import { WorkOrder } from '../../models/WorkOrder.js';
import { Asset } from '../../models/Asset.js';
import { User } from '../../models/User.js';
import { AssetEvent } from '../../models/AssetEvent.js';
import { Counter } from '../../models/Counter.js';
import { Notification } from '../../models/Notification.js';
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
    .populate('assetId', 'assetCode name categoryKey location status health zoneId')
    .populate('assigneeId', 'name email role')
    .populate('createdBy', 'name email role')
    .populate('submittedBy', 'name email role')
    .populate('reviewedBy', 'name email role')
    .populate('zoneId', 'name code');
};

export const getWorkOrderById = async (id, scopeFilter) => {
  const wo = await WorkOrder.findOne({ _id: id, ...scopeFilter })
    .populate('assetId', 'assetCode name categoryKey location status health specs zoneId')
    .populate('assigneeId', 'name email role')
    .populate('createdBy', 'name email role')
    .populate('submittedBy', 'name email role')
    .populate('reviewedBy', 'name email role')
    .populate('comments.by', 'name email role')
    .populate('zoneId', 'name code');

  if (!wo) throw new NotFoundError('Work order not found or out of scope');
  return wo;
};

export const createWorkOrder = async (actorUser, data) => {
  if (actorUser.role === 'engineer') {
    throw new ForbiddenError('Engineers are not permitted to create work orders');
  }

  const asset = await Asset.findOne({ _id: data.assetId, orgId: actorUser.orgId });
  if (!asset) throw new NotFoundError('Asset not found');

  if (data.assigneeId) {
    const assignee = await User.findOne({ _id: data.assigneeId, orgId: actorUser.orgId });
    if (!assignee) throw new BadRequestError('Assignee user not found');
    const inZone = assignee.zoneIds.some((z) => z.toString() === asset.zoneId.toString());
    if (!inZone && assignee.role !== 'admin') {
      throw new BadRequestError("Assignee must belong to the asset's zone");
    }
  }

  const code = await generateWOCode(actorUser.orgId);
  const status = data.assigneeId ? 'assigned' : 'open';

  return withTransaction(async (session) => {
    const woDocs = await WorkOrder.create(
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
      session ? { session } : {}
    );
    const wo = Array.isArray(woDocs) ? woDocs[0] : woDocs;

    asset.openWorkOrderCount += 1;
    asset.health = computeHealth(asset);
    await asset.save(session ? { session } : {});

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
      session ? { session } : {}
    );

    // Notify assigned engineer or engineers in the ward
    try {
      if (data.assigneeId) {
        await Notification.create({
          userId: data.assigneeId,
          title: `New Assigned Work Order: ${code}`,
          message: `Work Order '${data.title}' assigned for ${asset.name}. Priority: ${data.priority || 'medium'}.`,
          type: 'workorder'
        });
      } else {
        const zoneEngineers = await User.find({
          orgId: actorUser.orgId,
          role: 'engineer',
          zoneIds: asset.zoneId
        });
        for (const eng of zoneEngineers) {
          await Notification.create({
            userId: eng._id,
            title: `New Open Work Order: ${code}`,
            message: `Work Order '${data.title}' created in your ward for ${asset.name}.`,
            type: 'workorder'
          });
        }
      }
    } catch (notifErr) {
      console.error('Notification creation error:', notifErr.message);
    }

    return WorkOrder.findById(wo._id).populate('assetId assigneeId createdBy');
  });
};

export const assignWorkOrder = async (actorUser, id, assigneeId, scopeFilter) => {
  if (actorUser.role === 'engineer') {
    throw new ForbiddenError('Engineers are not permitted to assign or reassign work orders');
  }

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

  try {
    await Notification.create({
      userId: assignee._id,
      title: `Assigned Work Order: ${wo.code}`,
      message: `You have been assigned to work order '${wo.title}'. Priority: ${wo.priority}.`,
      type: 'workorder'
    });
  } catch (err) {
    console.error('Notification error:', err.message);
  }

  return WorkOrder.findById(wo._id).populate('assigneeId createdBy assetId');
};

export const updateWorkOrder = async (actorUser, id, updates, scopeFilter) => {
  const wo = await WorkOrder.findOne({ _id: id, ...scopeFilter });
  if (!wo) throw new NotFoundError('Work order not found');

  if (updates.status === 'in_progress' && wo.status !== 'in_progress') {
    wo.startedAt = new Date();
    const asset = await Asset.findById(wo.assetId);
    if (asset && asset.status === 'in_service') {
      asset.status = 'under_maintenance';
      await asset.save();
    }
  }

  Object.assign(wo, updates);
  await wo.save();

  return WorkOrder.findById(wo._id).populate('assigneeId createdBy assetId submittedBy reviewedBy');
};

export const submitWorkOrder = async (actorUser, id, data, scopeFilter) => {
  const wo = await WorkOrder.findOne({ _id: id, ...scopeFilter });
  if (!wo) throw new NotFoundError('Work order not found');

  if (wo.status !== 'in_progress' && wo.status !== 'assigned') {
    throw new BadRequestError(`Work order cannot be submitted from status '${wo.status}'`);
  }

  wo.status = 'submitted';
  wo.submittedAt = new Date();
  wo.submittedBy = actorUser._id;
  if (data.workNotes !== undefined) wo.workNotes = data.workNotes;
  if (data.photos) wo.photos = data.photos;
  if (data.actualCost) wo.actualCost = data.actualCost;
  if (data.checklist) wo.checklist = data.checklist;

  wo.logs.push({
    action: 'submitted',
    cost: wo.actualCost || 0,
    by: actorUser._id,
    at: new Date()
  });

  await wo.save();

  try {
    await AssetEvent.create({
      orgId: actorUser.orgId,
      assetId: wo.assetId,
      zoneId: wo.zoneId,
      type: 'workorder.submitted',
      actorId: actorUser._id,
      data: { workOrderId: wo._id, code: wo.code, notes: data.workNotes }
    });

    const zoneSupervisors = await User.find({
      orgId: actorUser.orgId,
      role: { $in: ['supervisor', 'admin'] },
      $or: [{ zoneIds: wo.zoneId }, { role: 'admin' }]
    });

    for (const sup of zoneSupervisors) {
      await Notification.create({
        userId: sup._id,
        title: `Work Order Submitted: ${wo.code}`,
        message: `${actorUser.name} submitted work order '${wo.title}' for review.`,
        type: 'workorder'
      });
    }
  } catch (err) {
    console.error('Notification error on submit:', err.message);
  }

  return WorkOrder.findById(wo._id)
    .populate('assetId', 'assetCode name location')
    .populate('assigneeId', 'name email role')
    .populate('submittedBy', 'name email role')
    .populate('createdBy', 'name email role');
};

export const sendBackWorkOrder = async (actorUser, id, reason, scopeFilter) => {
  if (actorUser.role === 'engineer') {
    throw new ForbiddenError('Engineers cannot send back work orders');
  }

  const wo = await WorkOrder.findOne({ _id: id, ...scopeFilter });
  if (!wo) throw new NotFoundError('Work order not found');

  if (wo.status !== 'submitted') {
    throw new BadRequestError(`Only submitted work orders can be sent back (current status: '${wo.status}')`);
  }

  wo.status = 'in_progress';
  wo.reviewedBy = actorUser._id;
  wo.reviewedAt = new Date();
  wo.reviewNotes = reason;

  wo.logs.push({
    action: 'sent_back',
    cost: 0,
    by: actorUser._id,
    at: new Date()
  });

  await wo.save();

  try {
    await AssetEvent.create({
      orgId: actorUser.orgId,
      assetId: wo.assetId,
      zoneId: wo.zoneId,
      type: 'workorder.sent_back',
      actorId: actorUser._id,
      data: { workOrderId: wo._id, code: wo.code, reason }
    });

    if (wo.assigneeId) {
      await Notification.create({
        userId: wo.assigneeId,
        title: `Work Order Sent Back: ${wo.code}`,
        message: `Supervisor sent back '${wo.title}' for revision. Reason: ${reason}`,
        type: 'workorder'
      });
    }
  } catch (err) {
    console.error('Notification error on send back:', err.message);
  }

  return WorkOrder.findById(wo._id)
    .populate('assetId assigneeId createdBy submittedBy reviewedBy');
};

export const completeWorkOrder = async (actorUser, id, { actualCost = 0, notes = '', reviewNotes = '' }, scopeFilter) => {
  if (actorUser.role === 'engineer') {
    throw new ForbiddenError('Engineers must submit work orders for Supervisor review before completion');
  }

  return withTransaction(async (session) => {
    const wo = await WorkOrder.findOne({ _id: id, ...scopeFilter }).session(session);
    if (!wo) throw new NotFoundError('Work order not found');

    if (wo.status === 'completed') {
      throw new ConflictError('Work order is already completed');
    }

    wo.status = 'completed';
    wo.completedAt = new Date();
    wo.reviewedBy = actorUser._id;
    wo.reviewedAt = new Date();
    if (reviewNotes) wo.reviewNotes = reviewNotes;
    if (actualCost) wo.actualCost = actualCost;
    if (!wo.actualCost) wo.actualCost = wo.estimatedCost || 0;

    wo.logs.push({
      action: 'completed',
      cost: wo.actualCost,
      by: actorUser._id,
      at: new Date()
    });
    await wo.save({ session });

    const asset = await Asset.findById(wo.assetId).session(session);
    if (asset) {
      asset.openWorkOrderCount = Math.max(0, asset.openWorkOrderCount - 1);

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
            data: { workOrderId: wo._id, code: wo.code, actualCost: wo.actualCost, notes: reviewNotes || notes }
          }
        ],
        { session }
      );
    }

    return WorkOrder.findById(wo._id).populate('assigneeId createdBy assetId submittedBy reviewedBy').session(session);
  });
};

export const cancelWorkOrder = async (actorUser, id, reason, scopeFilter) => {
  if (actorUser.role === 'engineer') {
    throw new ForbiddenError('Engineers are not permitted to cancel work orders');
  }

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
