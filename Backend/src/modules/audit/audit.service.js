import { AuditLog } from '../../models/AuditLog.js';

export const listAuditLogs = async (queryFilters, scopeFilter) => {
  const { actorId, entityType, entityId, outcome, startDate, endDate } = queryFilters;

  const mongoFilter = { ...scopeFilter };

  if (actorId) mongoFilter.actorId = actorId;
  if (entityType) mongoFilter.entityType = entityType;
  if (entityId) mongoFilter.entityId = entityId;
  if (outcome) mongoFilter.outcome = outcome;

  if (startDate || endDate) {
    mongoFilter.at = {};
    if (startDate) mongoFilter.at.$gte = new Date(startDate);
    if (endDate) mongoFilter.at.$lte = new Date(endDate);
  }

  return AuditLog.find(mongoFilter)
    .sort({ at: -1 })
    .limit(200)
    .populate('actorId', 'name email role');
};
