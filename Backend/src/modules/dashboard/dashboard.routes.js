import { Router } from 'express';
import * as dashboardController from './dashboard.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate);

router.get('/summary', authorize('dashboard:read'), dashboardController.summary);
router.get('/charts', authorize('dashboard:read'), dashboardController.summary);
router.get('/operations/workforce', authorize('dashboard:read'), dashboardController.getWorkforce);
router.get('/operations/zones', authorize('dashboard:read'), dashboardController.getZonePerformance);

export default router;
