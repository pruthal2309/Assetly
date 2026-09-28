import { Asset } from '../../models/Asset.js';
import { AssetEvent } from '../../models/AssetEvent.js';
import { withTransaction } from '../../db/withTransaction.js';
import { writeAuditLog } from '../../middleware/audit.js';
import { ConflictError, ForbiddenError } from '../../common/errors.js';

export const VALID_TRANSITIONS = {
  planned: ['acquired'],
  acquired: ['installed'],
  installed: ['in_service'],
  in_service: ['under_maintenance', 'decommissioned'],
  under_maintenance: ['in_service', 'decommissioned'],
  decommissioned: ['disposed'],
  disposed: []
};

export const validateTransition = (currentStatus, targetStatus, user, asset, reason) => {
  const allowed = VALID_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(targetStatus)) {
    throw new ConflictError(`Invalid status transition from ${currentStatus} to ${targetStatus}`);
  }

  const role = user.role;

  // Rule 1: Only Admin can move to decommissioned or disposed, and a reason is required
  if (targetStatus === 'decommissioned' || targetStatus === 'disposed') {
    if (role !== 'admin') {
      throw new ForbiddenError('Only Admin can move an asset to decommissioned or disposed');
    }
    if (!reason || reason.trim().length === 0) {
      throw new ConflictError('A reason is required for retirement or disposal');
    }
  }

  // Rule 2: Engineer can set installed -> in_service only on assets they created (or were assigned)
  if (targetStatus === 'in_service' && currentStatus === 'installed' && role === 'engineer') {
    if (asset.createdBy.toString() !== user._id.toString()) {
      throw new ForbiddenError('Engineers can only set in_service status on assets they created');
    }
  }
};

export const transitionStatus = async (user, assetId, targetStatus, reason = '', scopeFilter = {}) => {
  return withTransaction(async (session) => {
    const asset = await Asset.findOne({ _id: assetId, ...scopeFilter }).session(session);
    if (!asset) {
      throw new ConflictError('Asset not found or out of scope');
    }

    validateTransition(asset.status, targetStatus, user, asset, reason);

    const fromStatus = asset.status;
    asset.status = targetStatus;

    if (targetStatus === 'decommissioned' || targetStatus === 'disposed') {
      asset.retirement = {
        reason,
        at: new Date(),
        by: user._id
      };
    }

    await asset.save({ session });

    await AssetEvent.create(
      [
        {
          orgId: asset.orgId,
          assetId: asset._id,
          zoneId: asset.zoneId,
          type: 'status.changed',
          actorId: user._id,
          at: new Date(),
          data: { from: fromStatus, to: targetStatus, reason }
        }
      ],
      { session }
    );

    await writeAuditLog({ user, id: user.reqId }, {
      action: 'asset:status:change',
      outcome: 'success',
      entityType: 'Asset',
      entityId: asset._id,
      changes: { from: fromStatus, to: targetStatus, reason }
    });

    return asset;
  });
};
