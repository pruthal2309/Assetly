import { Router } from 'express';
import * as auditController from './audit.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('audit:read'), auditController.list);

export default router;
