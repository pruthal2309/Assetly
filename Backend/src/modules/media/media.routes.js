import { Router } from 'express';
import * as mediaController from './media.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate);

router.post('/upload', authorize('media:upload'), mediaController.uploadMiddleware, mediaController.uploadFile);
router.delete('/:id', authorize('media:delete'), mediaController.remove);

export default router;
