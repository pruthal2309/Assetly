import * as auditService from './audit.service.js';
import { asyncHandler } from '../../common/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const logs = await auditService.listAuditLogs(req.query, req.scope);
  res.json({ data: logs });
});
