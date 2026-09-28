import { Router } from 'express';
import * as deptController from './departments.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createDepartmentSchema, updateDepartmentSchema } from './departments.schemas.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('user:read'), deptController.list);
router.get('/:id', authorize('user:read'), deptController.getById);
router.post('/', authorize('user:update'), validate({ body: createDepartmentSchema }), deptController.create);
router.patch('/:id', authorize('user:update'), validate({ body: updateDepartmentSchema }), deptController.update);

export default router;
