import { AuditLog } from '../models/AuditLog.js';

export const writeAuditLog = async (req, { action, outcome = 'success', entityType, entityId, changes }) => {
  try {
    await AuditLog.create({
      orgId: req?.user?.orgId,
      actorId: req?.user?._id,
      actorRole: req?.user?.role || 'public',
      action,
      outcome,
      entityType,
      entityId,
      changes,
      requestId: req?.id,
      ip: req?.ip,
      userAgent: req?.headers?.['user-agent']
    });
  } catch (err) {
    console.error('Audit log write error:', err.message);
  }
};
