import { Router } from 'express';
import * as reportsController from './reports.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { publicRateLimiter } from '../../middleware/rateLimit.js';
import { createCitizenReportSchema, triageReportSchema } from './reports.schemas.js';

const router = Router();

// Public routes
router.post('/public/reports', publicRateLimiter, validate({ body: createCitizenReportSchema }), reportsController.createPublicReport);
router.get('/public/reports/:code', publicRateLimiter, reportsController.getPublicReportByCode);
router.get('/public/assets/:assetCode', publicRateLimiter, reportsController.getPublicAssetByCode);

// Staff protected routes
router.get('/reports', authenticate, authorize('report:read'), reportsController.listStaffReports);
router.post('/reports/:id/triage', authenticate, authorize('report:triage'), validate({ body: triageReportSchema }), reportsController.triage);

export default router;
