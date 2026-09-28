import { Router } from 'express';
import * as woController from './workorders.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import {
  createWorkOrderSchema,
  updateWorkOrderSchema,
  assignWorkOrderSchema,
  submitWorkOrderSchema,
  completeWorkOrderSchema,
  sendBackWorkOrderSchema,
  cancelWorkOrderSchema,
  addCommentSchema
} from './workorders.schemas.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('workorder:read'), woController.list);
router.get('/:id', authorize('workorder:read'), woController.getById);
router.post('/', authorize('workorder:create'), validate({ body: createWorkOrderSchema }), woController.create);
router.patch('/:id', authorize('workorder:update'), validate({ body: updateWorkOrderSchema }), woController.update);
router.post('/:id/assign', authorize('workorder:assign'), validate({ body: assignWorkOrderSchema }), woController.assign);
router.post('/:id/submit', authorize('workorder:update'), validate({ body: submitWorkOrderSchema }), woController.submit);
router.post('/:id/send-back', authorize('workorder:assign'), validate({ body: sendBackWorkOrderSchema }), woController.sendBack);
router.post('/:id/complete', authorize('workorder:complete'), validate({ body: completeWorkOrderSchema }), woController.complete);
router.post('/:id/cancel', authorize('workorder:cancel'), validate({ body: cancelWorkOrderSchema }), woController.cancel);
router.post('/:id/comments', authorize('workorder:update'), validate({ body: addCommentSchema }), woController.comment);

export default router;
