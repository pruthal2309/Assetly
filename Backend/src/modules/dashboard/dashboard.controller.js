import * as dashboardService from './dashboard.service.js';
import { asyncHandler } from '../../common/asyncHandler.js';

export const summary = asyncHandler(async (req, res) => {
  const data = await dashboardService.getDashboardSummary(req.user, req.scope, req.query.zoneId);
  res.json({ data });
});
