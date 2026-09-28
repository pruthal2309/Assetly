import { randomBytes } from 'node:crypto';
import { CitizenReport } from '../../models/CitizenReport.js';
import { Asset } from '../../models/Asset.js';
import { WorkOrder } from '../../models/WorkOrder.js';
import { Organization } from '../../models/Organization.js';
import { Counter } from '../../models/Counter.js';
import { NotFoundError } from '../../common/errors.js';

const generateTrackingCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'R-';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const createPublicReport = async ({ description, contact, location, mediaIds }, reporterUser = null) => {
  let org = await Organization.findOne();
  const orgId = reporterUser?.orgId || org?._id;

  const trackingCode = generateTrackingCode();

  // Attempt to match nearest active asset within 50 meters
  const nearestAssets = await Asset.find({
    orgId,
    archivedAt: null,
    status: { $in: ['installed', 'in_service', 'under_maintenance'] },
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: location.coordinates
        },
        $maxDistance: 50
      }
    }
  }).limit(1);

  let matchedAssetId = null;
  let departmentId = null;
  let zoneId = null;
  let matchDistanceM = null;
  let workOrderId = null;
  let status = 'received';

  if (nearestAssets.length > 0) {
    const matchedAsset = nearestAssets[0];
    matchedAssetId = matchedAsset._id;
    departmentId = matchedAsset.departmentId;
    zoneId = matchedAsset.zoneId;
    status = 'matched';

    // Auto create work order for matched asset
    const year = new Date().getFullYear();
    const counter = await Counter.findByIdAndUpdate(`WO:${year}:${orgId}`, { $inc: { seq: 1 } }, { new: true, upsert: true });
    const woCode = `WO-${year}-${String(counter.seq).padStart(4, '0')}`;

    const createdByUserId = reporterUser?._id || matchedAsset.createdBy;

    const wo = await WorkOrder.create({
      orgId,
      assetId: matchedAsset._id,
      departmentId: matchedAsset.departmentId,
      zoneId: matchedAsset.zoneId,
      code: woCode,
      title: `Citizen Report: Issue near ${matchedAsset.assetCode}`,
      description,
      priority: 'high',
      status: 'open',
      source: 'citizen_report',
      createdBy: createdByUserId
    });
    workOrderId = wo._id;

    matchedAsset.openWorkOrderCount += 1;
    await matchedAsset.save();
  }

  const report = await CitizenReport.create({
    orgId,
    trackingCode,
    reporterId: reporterUser?._id || null,
    contact: contact || '',
    description,
    location,
    mediaIds,
    matchedAssetId,
    departmentId,
    zoneId,
    matchDistanceM,
    workOrderId,
    status
  });

  return {
    trackingCode: report.trackingCode,
    status: report.status,
    matchedAssetId: report.matchedAssetId,
    departmentId: report.departmentId,
    createdAt: report.createdAt
  };
};

export const getPublicReportByCode = async (code) => {
  const report = await CitizenReport.findOne({ trackingCode: code })
    .populate('matchedAssetId', 'assetCode name categoryKey status departmentId zoneId')
    .populate('departmentId', 'name code')
    .populate('zoneId', 'name code')
    .populate({
      path: 'workOrderId',
      select: 'code status priority assigneeId createdBy departmentId zoneId',
      populate: [
        { path: 'assigneeId', select: 'name email role' },
        { path: 'createdBy', select: 'name email role' }
      ]
    });

  if (!report) throw new NotFoundError('Report not found with provided tracking code');

  return {
    trackingCode: report.trackingCode,
    description: report.description,
    status: report.status,
    matchedAsset: report.matchedAssetId,
    department: report.departmentId,
    zone: report.zoneId,
    workOrder: report.workOrderId,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt
  };
};

export const getPublicAssetByCode = async (assetCode) => {
  const asset = await Asset.findOne({ assetCode, archivedAt: null })
    .populate('categoryId', 'name key icon')
    .populate('departmentId', 'name code');

  if (!asset) throw new NotFoundError('Asset not found');

  return {
    assetCode: asset.assetCode,
    name: asset.name,
    category: asset.categoryId?.name || asset.categoryKey,
    department: asset.departmentId?.name,
    status: asset.status,
    location: asset.location
  };
};

export const listStaffReports = async (scopeFilter) => {
  return CitizenReport.find(scopeFilter)
    .sort({ createdAt: -1 })
    .populate('matchedAssetId', 'assetCode name categoryKey departmentId zoneId')
    .populate('departmentId', 'name code')
    .populate('zoneId', 'name code')
    .populate({
      path: 'workOrderId',
      select: 'code status priority assigneeId createdBy',
      populate: { path: 'assigneeId', select: 'name email' }
    })
    .populate('mediaIds');
};

export const triageReport = async (actorUser, reportId, data, scopeFilter) => {
  const report = await CitizenReport.findOne({ _id: reportId, ...scopeFilter });
  if (!report) throw new NotFoundError('Report not found');

  if (data.status) report.status = data.status;
  if (data.matchedAssetId) report.matchedAssetId = data.matchedAssetId;

  if (data.createWorkOrder && report.matchedAssetId && !report.workOrderId) {
    const asset = await Asset.findById(report.matchedAssetId);
    if (asset) {
      const year = new Date().getFullYear();
      const counter = await Counter.findByIdAndUpdate(`WO:${year}:${actorUser.orgId}`, { $inc: { seq: 1 } }, { new: true, upsert: true });
      const woCode = `WO-${year}-${String(counter.seq).padStart(4, '0')}`;

      const wo = await WorkOrder.create({
        orgId: actorUser.orgId,
        assetId: asset._id,
        departmentId: asset.departmentId,
        zoneId: asset.zoneId,
        code: woCode,
        title: `Triaged Report: Issue for ${asset.assetCode}`,
        description: report.description,
        priority: 'medium',
        status: 'open',
        source: 'citizen_report',
        sourceRef: report._id,
        createdBy: actorUser._id
      });
      report.workOrderId = wo._id;
      report.departmentId = asset.departmentId;
      report.zoneId = asset.zoneId;
      report.status = 'matched';

      asset.openWorkOrderCount += 1;
      await asset.save();
    }
  }

  await report.save();
  return report;
};
