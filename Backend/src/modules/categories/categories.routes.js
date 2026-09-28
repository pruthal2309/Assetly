import { Router } from 'express';
import * as categoriesController from './categories.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createCategorySchema, updateCategorySchema } from './categories.schemas.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('category:read'), categoriesController.list);
router.get('/:id', authorize('category:read'), categoriesController.getById);
router.post('/', authorize('category:manage'), validate({ body: createCategorySchema }), categoriesController.create);
router.patch('/:id', authorize('category:manage'), validate({ body: updateCategorySchema }), categoriesController.update);

export default router;
