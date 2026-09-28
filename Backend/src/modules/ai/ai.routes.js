import { Router } from 'express';
import * as aiController from './ai.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { aiRateLimiter } from '../../middleware/rateLimit.js';

const router = Router();

router.use(aiRateLimiter);

router.post('/detect-damage', authenticate, authorize('ai:detect'), aiController.detectDamage);

export default router;
