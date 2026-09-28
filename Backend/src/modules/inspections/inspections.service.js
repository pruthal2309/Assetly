import { Inspection } from '../../models/Inspection.js';
import { Asset } from '../../models/Asset.js';
import { Category } from '../../models/Category.js';
import { AssetEvent } from '../../models/AssetEvent.js';
import { computeHealth } from '../assets/health.js';
import { withTransaction } from '../../db/withTransaction.js';
import { NotFoundError, ForbiddenError } from '../../common/errors.js';

export const listAssetInspections = async (assetId, scopeFilter) => {
  const asset = await Asset.findOne({ _id: assetId, ...scopeFilter });
  if (!asset) throw new NotFoundError('Asset not found');

  return Inspection.find({ assetId })
    .sort({ inspectedAt: -1 })
    .populate('inspectorId', 'name email role')
    .populate('mediaIds');
};

export const createInspection = async (actorUser, assetId, data, scopeFilter) => {
  return withTransaction(async (session) => {
    const asset = await Asset.findOne({ _id: assetId, ...scopeFilter }).session(session);
    if (!asset) {
      throw new NotFoundError('Asset not found or out of scope');
    }

    const category = await Category.findById(asset.categoryId).session(session);
    const intervalDays = category?.inspectionIntervalDays || 180;

    const inspectedAt = new Date();
    const [inspection] = await Inspection.create(
      [
        {
          orgId: actorUser.orgId,
          assetId: asset._id,
          zoneId: asset.zoneId,
          inspectorId: actorUser._id,
          rating: data.rating,
          notes: data.notes || '',
          ai: data.ai || undefined,
          mediaIds: data.mediaIds || [],
          inspectedAt
        }
      ],
      { session }
    );

    // Update asset summary
    asset.lastInspection = {
      at: inspectedAt,
      rating: data.rating,
      inspectorId: actorUser._id,
      aiSeverity: data.ai?.severity
    };
    asset.nextInspectionDue = new Date(inspectedAt.getTime() + intervalDays * 24 * 60 * 60 * 1000);

    // Recompute health
    asset.health = computeHealth(asset);
    await asset.save({ session });

    // Insert timeline event
    await AssetEvent.create(
      [
        {
          orgId: actorUser.orgId,
          assetId: asset._id,
          zoneId: asset.zoneId,
          type: 'inspection.logged',
          actorId: actorUser._id,
          at: inspectedAt,
          data: {
            inspectionId: inspection._id,
            rating: data.rating,
            aiSeverity: data.ai?.severity,
            newHealthScore: asset.health.score
          }
        }
      ],
      { session }
    );

    return Inspection.findById(inspection._id)
      .populate('inspectorId', 'name email role')
      .session(session);
  });
};

export const updateInspection = async (actorUser, inspectionId, updates, scopeFilter) => {
  const inspection = await Inspection.findOne({ _id: inspectionId, ...scopeFilter });
  if (!inspection) throw new NotFoundError('Inspection not found');

  // Engineers can edit only their own inspection logged within 24 hours
  if (actorUser.role === 'engineer') {
    if (inspection.inspectorId.toString() !== actorUser._id.toString()) {
      throw new ForbiddenError('Engineers can only update their own inspections');
    }
    const hoursSinceLog = (Date.now() - new Date(inspection.inspectedAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceLog > 24) {
      throw new ForbiddenError('Inspections can only be updated within 24 hours of logging');
    }
  }

  if (updates.rating) inspection.rating = updates.rating;
  if (updates.notes !== undefined) inspection.notes = updates.notes;

  await inspection.save();

  // Recompute asset health
  const asset = await Asset.findById(inspection.assetId);
  if (asset) {
    asset.lastInspection.rating = inspection.rating;
    asset.health = computeHealth(asset);
    await asset.save();
  }

  return inspection;
};
