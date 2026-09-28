import { Router } from 'express';
import * as authController from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authRateLimiter } from '../../middleware/rateLimit.js';
import { loginSchema, registerCitizenSchema, acceptInviteSchema } from './auth.schemas.js';

const router = Router();

router.use(authRateLimiter);

router.post('/login', validate({ body: loginSchema }), authController.login);
router.get('/verify-invite', authController.verifyInvite);
router.post('/accept-invite', validate({ body: acceptInviteSchema }), authController.acceptInvite);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/register-citizen', validate({ body: registerCitizenSchema }), authController.registerCitizen);
router.get('/me', authenticate, authController.me);

export default router;
