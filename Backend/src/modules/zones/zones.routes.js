import { Router } from 'express';
import * as zonesController from './zones.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createZoneSchema, updateZoneSchema } from './zones.schemas.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('zone:read'), zonesController.list);
router.get('/:id', authorize('zone:read'), zonesController.getById);
router.post('/', authorize('zone:manage'), validate({ body: createZoneSchema }), zonesController.create);
router.patch('/:id', authorize('zone:manage'), validate({ body: updateZoneSchema }), zonesController.update);

export default router;
