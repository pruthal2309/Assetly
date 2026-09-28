import { WorkOrder } from '../../models/WorkOrder.js';
import { Asset } from '../../models/Asset.js';
import { User } from '../../models/User.js';
import { AssetEvent } from '../../models/AssetEvent.js';
import { Counter } from '../../models/Counter.js';
import { computeHealth } from '../assets/health.js';
import { withTransaction } from '../../db/withTransaction.js';
import { NotFoundError, ForbiddenError, BadRequestError, ConflictError } from '../../common/errors.js';

const generateWOCode = async (orgId) => {
  const year = new Date().getFullYear();
  const counterId = `WO:${year}:${orgId}`;
  const counter = await Counter.findByIdAndUpdate(counterId, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return `WO-${year}-${String(counter.seq).padStart(4, '0')}`;
};

export const listWorkOrders = async (filters, scopeFilter) => {
  const { assetId, status, priority, assigneeId, zoneId } = filters;
  const mongoFilter = { ...scopeFilter };

  if (assetId) mongoFilter.assetId = assetId;
  if (status) mongoFilter.status = status;
  if (priority) mongoFilter.priority = priority;
  if (assigneeId) mongoFilter.assigneeId = assigneeId;
  if (zoneId) mongoFilter.zoneId = zoneId;

  return WorkOrder.find(mongoFilter)
    .sort({ createdAt: -1 })
    .populate('assetId', 'assetCode name categoryKey location status health')
    .populate('assigneeId', 'name email role')
    .populate('createdBy', 'name email role')
    .populate('zoneId', 'name code');
};

export const getWorkOrderById = async (id, scopeFilter) => {
  const wo = await WorkOrder.findOne({ _id: id, ...scopeFilter })
    .populate('assetId', 'assetCode name categoryKey location status health specs')
    .populate('assigneeId', 'name email role')
    .populate('createdBy', 'name email role')
    .populate('comments.by', 'name email role')
    .populate('zoneId', 'name code');

  if (!wo) throw new NotFoundError('Work order not found or out of scope');
  return wo;
};

export const createWorkOrder = async (actorUser, data) => {
  const asset = await Asset.findOne({ _id: data.assetId, orgId: actorUser.orgId });
  if (!asset) throw new NotFoundError('Asset not found');

  if (data.assigneeId) {
    const assignee = await User.findOne({ _id: data.assigneeId, orgId: actorUser.orgId });
    if (!assignee) throw new BadRequestError('Assignee user not found');
    const inZone = assignee.zoneIds.some((z) => z.toString() === asset.zoneId.toString());
    if (!inZone && assignee.role !== 'admin') {
      throw new BadRequestError('Assignee must belong to the asset\'s zone');
    }
  }

  const code = await generateWOCode(actorUser.orgId);
  const status = data.assigneeId ? 'assigned' : 'open';

  return withTransaction(async (session) => {
    const [wo] = await WorkOrder.create(
      [
        {
          orgId: actorUser.orgId,
          assetId: asset._id,
          zoneId: asset.zoneId,
          code,
          title: data.title,
          description: data.description || '',
          priority: data.priority || 'medium',
          status,
          assigneeId: data.assigneeId || null,
          createdBy: actorUser._id,
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
          estimatedCost: data.estimatedCost || 0,
          checklist: data.checklist || []
        }
      ],
      { session }
    );

    asset.openWorkOrderCount += 1;
    asset.health = computeHealth(asset);
    await asset.save({ session });

    await AssetEvent.create(
      [
        {
          orgId: actorUser.orgId,
          assetId: asset._id,
          zoneId: asset.zoneId,
          type: 'workorder.created',
          actorId: actorUser._id,
          data: { workOrderId: wo._id, code, title: wo.title, priority: wo.priority }
        }
      ],
      { session }
    );

    return WorkOrder.findById(wo._id).populate('assetId assigneeId createdBy').session(session);
  });
};

export const assignWorkOrder = async (actorUser, id, assigneeId, scopeFilter) => {
  const wo = await WorkOrder.findOne({ _id: id, ...scopeFilter });
  if (!wo) throw new NotFoundError('Work order not found');

  const assignee = await User.findOne({ _id: assigneeId, orgId: actorUser.orgId });
  if (!assignee) throw new BadRequestError('Assignee user not found');

  const inZone = assignee.zoneIds.some((z) => z.toString() === wo.zoneId.toString());
  if (!inZone && assignee.role !== 'admin') {
    throw new BadRequestError("Assignee must belong to the asset's zone");
  }

  wo.assigneeId = assignee._id;
  if (wo.status === 'open') {
    wo.status = 'assigned';
  }
  await wo.save();

  return WorkOrder.findById(wo._id).populate('assigneeId createdBy assetId');
};

export const updateWorkOrder = async (actorUser, id, updates, scopeFilter) => {
  const wo = await WorkOrder.findOne({ _id: id, ...scopeFilter });
  if (!wo) throw new NotFoundError('Work order not found');

  if (updates.status === 'in_progress' && wo.status !== 'in_progress') {
    wo.startedAt = new Date();
    // Update asset status to under_maintenance
    const asset = await Asset.findById(wo.assetId);
    if (asset && asset.status === 'in_service') {
      asset.status = 'under_maintenance';
      await asset.save();
    }
  }

  Object.assign(wo, updates);
  await wo.save();

  return WorkOrder.findById(wo._id).populate('assigneeId createdBy assetId');
};

export const completeWorkOrder = async (actorUser, id, { actualCost = 0, notes = '' }, scopeFilter) => {
  return withTransaction(async (session) => {
    const wo = await WorkOrder.findOne({ _id: id, ...scopeFilter }).session(session);
    if (!wo) throw new NotFoundError('Work order not found');

    if (wo.status === 'completed') {
      throw new ConflictError('Work order is already completed');
    }

    // Permission rule: Assignee, or Supervisor/Admin in scope
    const isAssignee = wo.assigneeId && wo.assigneeId.toString() === actorUser._id.toString();
    const isSupOrAdmin = actorUser.role === 'supervisor' || actorUser.role === 'admin';
    if (!isAssignee && !isSupOrAdmin) {
      throw new ForbiddenError('Only the assigned engineer, or a Supervisor/Admin can complete this work order');
    }

    wo.status = 'completed';
    wo.completedAt = new Date();
    wo.actualCost = actualCost || wo.estimatedCost || 0;
    wo.logs.push({
      action: 'completed',
      cost: wo.actualCost,
      by: actorUser._id,
      at: new Date()
    });
    await wo.save({ session });

    // Update asset
    const asset = await Asset.findById(wo.assetId).session(session);
    if (asset) {
      asset.openWorkOrderCount = Math.max(0, asset.openWorkOrderCount - 1);

      // Restore in_service when no other open work orders exist
      if (asset.openWorkOrderCount === 0 && asset.status === 'under_maintenance') {
        asset.status = 'in_service';
      }

      asset.health = computeHealth(asset);
      await asset.save({ session });

      await AssetEvent.create(
        [
          {
            orgId: actorUser.orgId,
            assetId: asset._id,
            zoneId: asset.zoneId,
            type: 'workorder.completed',
            actorId: actorUser._id,
            data: { workOrderId: wo._id, code: wo.code, actualCost: wo.actualCost, notes }
          }
        ],
        { session }
      );
    }

    return WorkOrder.findById(wo._id).populate('assigneeId createdBy assetId').session(session);
  });
};

export const cancelWorkOrder = async (actorUser, id, reason, scopeFilter) => {
  const wo = await WorkOrder.findOne({ _id: id, ...scopeFilter });
  if (!wo) throw new NotFoundError('Work order not found');

  wo.status = 'cancelled';
  wo.cancelledAt = new Date();
  wo.cancelReason = reason;
  await wo.save();

  const asset = await Asset.findById(wo.assetId);
  if (asset) {
    asset.openWorkOrderCount = Math.max(0, asset.openWorkOrderCount - 1);
    if (asset.openWorkOrderCount === 0 && asset.status === 'under_maintenance') {
      asset.status = 'in_service';
    }
    asset.health = computeHealth(asset);
    await asset.save();
  }

  return wo;
};

export const addComment = async (actorUser, id, text, scopeFilter) => {
  const wo = await WorkOrder.findOne({ _id: id, ...scopeFilter });
  if (!wo) throw new NotFoundError('Work order not found');

  if (wo.comments.length >= 50) {
    throw new BadRequestError('Comments limit reached (maximum 50 comments per work order)');
  }

  wo.comments.push({
    by: actorUser._id,
    at: new Date(),
    text
  });

  await wo.save();
  return WorkOrder.findById(wo._id).populate('comments.by', 'name email role');
};
