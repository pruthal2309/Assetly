import { Router } from 'express';
import * as usersController from './users.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { inviteUserSchema, updateUserSchema } from './users.schemas.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('user:read'), usersController.list);
router.post('/invite', authorize('user:invite'), validate({ body: inviteUserSchema }), usersController.invite);
router.post('/:id/resend-invite', authorize('user:invite'), usersController.resendInvite);
router.patch('/:id', authorize('user:update'), validate({ body: updateUserSchema }), usersController.update);
router.post('/:id/deactivate', authorize('user:deactivate'), usersController.deactivate);

export default router;
