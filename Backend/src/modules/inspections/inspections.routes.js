import { Router } from 'express';
import * as inspectionsController from './inspections.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createInspectionSchema, updateInspectionSchema } from './inspections.schemas.js';

const router = Router({ mergeParams: true });

router.get('/assets/:id/inspections', authenticate, authorize('inspection:read'), inspectionsController.listForAsset);
router.post('/assets/:id/inspections', authenticate, authorize('inspection:create'), validate({ body: createInspectionSchema }), inspectionsController.create);
router.patch('/inspections/:id', authenticate, authorize('inspection:update'), validate({ body: updateInspectionSchema }), inspectionsController.update);

export default router;
