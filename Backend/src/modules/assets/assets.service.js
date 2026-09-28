import QRCode from 'qrcode';
import { Asset } from '../../models/Asset.js';
import { Category } from '../../models/Category.js';
import { AssetEvent } from '../../models/AssetEvent.js';
import { generateAssetCode } from './code.js';
import { computeHealth } from './health.js';
import { transitionStatus } from './lifecycle.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../common/errors.js';
import { withTransaction } from '../../db/withTransaction.js';
import { buildCursorFilter, encodeCursor } from '../../common/pagination.js';

export const validateSpecs = (specs, specSchema = []) => {
  for (const field of specSchema) {
    const val = specs[field.key];
    if (field.required && (val === undefined || val === null || val === '')) {
      throw new BadRequestError(`Missing required spec field: ${field.label}`);
    }
    if (val !== undefined && val !== null && val !== '') {
      if (field.type === 'number') {
        const num = Number(val);
        if (isNaN(num)) throw new BadRequestError(`Spec field ${field.label} must be a number`);
        if (field.min !== undefined && num < field.min) throw new BadRequestError(`Spec field ${field.label} minimum is ${field.min}`);
        if (field.max !== undefined && num > field.max) throw new BadRequestError(`Spec field ${field.label} maximum is ${field.max}`);
      }
    }
  }
};

export const listAssets = async (queryFilters, scopeFilter, cursor, limit = 25) => {
  const { q, category, status, risk, zone } = queryFilters;

  const mongoFilter = { ...scopeFilter, archivedAt: null };

  if (q) {
    mongoFilter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { assetCode: { $regex: q, $options: 'i' } },
      { address: { $regex: q, $options: 'i' } }
    ];
  }
  if (category) mongoFilter.categoryKey = category;
  if (status) mongoFilter.status = status;
  if (risk) mongoFilter['health.riskLevel'] = risk;
  if (zone) mongoFilter.zoneId = zone;

  const cursorFilter = buildCursorFilter(cursor, '_id', -1);
  const finalFilter = { ...mongoFilter, ...cursorFilter };

  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const assets = await Asset.find(finalFilter)
    .sort({ _id: -1 })
    .limit(parsedLimit + 1)
    .populate('categoryId', 'name key specSchema')
    .populate('zoneId', 'name code');

  let nextCursor = null;
  if (assets.length > parsedLimit) {
    const nextItem = assets.pop();
    nextCursor = encodeCursor(nextItem._id);
  }

  const total = await Asset.countDocuments(mongoFilter);

  return { assets, nextCursor, total };
};

export const getMapAssets = async (bboxStr, category, status, risk, scopeFilter) => {
  const mongoFilter = { ...scopeFilter, archivedAt: null };

  if (bboxStr) {
    const parts = bboxStr.split(',').map(Number);
    if (parts.length === 4 && !parts.some(isNaN)) {
      const [west, south, east, north] = parts;
      mongoFilter.location = {
        $geoWithin: {
          $box: [
            [west, south],
            [east, north]
          ]
        }
      };
    }
  }

  if (category) mongoFilter.categoryKey = category;
  if (status) mongoFilter.status = status;
  if (risk) mongoFilter['health.riskLevel'] = risk;

  return Asset.find(mongoFilter)
    .select('_id assetCode name categoryKey location status health.score health.riskLevel zoneId')
    .lean();
};

export const getAssetById = async (id, scopeFilter) => {
  const asset = await Asset.findOne({ _id: id, ...scopeFilter, archivedAt: null })
    .populate('categoryId', 'name key specSchema icon')
    .populate('zoneId', 'name code')
    .populate('createdBy', 'name email');

  if (!asset) {
    throw new NotFoundError('Asset not found or out of scope');
  }
  return asset;
};

export const createAsset = async (actorUser, data) => {
  const category = await Category.findById(data.categoryId);
  if (!category) throw new BadRequestError('Invalid category ID');

  validateSpecs(data.specs || {}, category.specSchema);

  const assetCode = await generateAssetCode(category.key, actorUser.orgId);

  const tempAsset = {
    ...data,
    orgId: actorUser.orgId,
    assetCode,
    categoryKey: category.key,
    installDate: data.installDate ? new Date(data.installDate) : new Date(),
    expectedLifeYears: data.expectedLifeYears || category.defaultLifeYears,
    createdBy: actorUser._id
  };

  tempAsset.health = computeHealth(tempAsset);

  return withTransaction(async (session) => {
    const [created] = await Asset.create([tempAsset], { session });

    await AssetEvent.create(
      [
        {
          orgId: actorUser.orgId,
          assetId: created._id,
          zoneId: created.zoneId,
          type: 'asset.created',
          actorId: actorUser._id,
          data: { assetCode, name: created.name, status: created.status }
        }
      ],
      { session }
    );

    return Asset.findById(created._id).populate('categoryId zoneId').session(session);
  });
};

export const updateAsset = async (actorUser, assetId, updates, scopeFilter) => {
  const asset = await Asset.findOne({ _id: assetId, ...scopeFilter, archivedAt: null });
  if (!asset) {
    throw new NotFoundError('Asset not found or out of scope');
  }

  // Engineer PATCH restriction rule:
  // Engineer may edit ONLY name, address, specs, notes, location (if within 25 m); reject other fields with 403.
  if (actorUser.role === 'engineer') {
    const allowedFields = ['name', 'address', 'specs', 'notes', 'location'];
    const forbiddenFields = Object.keys(updates).filter((key) => !allowedFields.includes(key));
    if (forbiddenFields.length > 0) {
      throw new ForbiddenError(`Engineers cannot modify fields: ${forbiddenFields.join(', ')}`);
    }
  }

  // Supervisor restriction: Cannot change zoneId; only Admin can.
  if (updates.zoneId && updates.zoneId.toString() !== asset.zoneId.toString() && actorUser.role !== 'admin') {
    throw new ForbiddenError('Only Admin can change the zone of an asset');
  }

  if (updates.specs) {
    const category = await Category.findById(asset.categoryId);
    if (category) validateSpecs(updates.specs, category.specSchema);
  }

  Object.assign(asset, updates);
  asset.health = computeHealth(asset);
  await asset.save();

  await AssetEvent.create({
    orgId: actorUser.orgId,
    assetId: asset._id,
    zoneId: asset.zoneId,
    type: 'asset.updated',
    actorId: actorUser._id,
    data: { updatedFields: Object.keys(updates) }
  });

  return Asset.findById(asset._id).populate('categoryId zoneId');
};

export const changeAssetStatus = async (actorUser, assetId, targetStatus, reason, scopeFilter) => {
  return transitionStatus(actorUser, assetId, targetStatus, reason, scopeFilter);
};

export const generateQrCode = async (assetCode) => {
  const url = `${process.env.PUBLIC_BASE_URL || 'http://localhost:8000'}/a/${assetCode}`;
  return QRCode.toDataURL(url);
};

export const getAssetEvents = async (assetId, scopeFilter) => {
  const asset = await Asset.findOne({ _id: assetId, ...scopeFilter });
  if (!asset) throw new NotFoundError('Asset not found');

  return AssetEvent.find({ assetId })
    .sort({ at: -1 })
    .populate('actorId', 'name email role');
};
