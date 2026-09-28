import { Router } from 'express';
import * as assetsController from './assets.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createAssetSchema, updateAssetSchema, statusChangeSchema } from './assets.schemas.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('asset:read'), assetsController.list);
router.get('/map', authorize('asset:read'), assetsController.map);
router.get('/:id', authorize('asset:read'), assetsController.getById);
router.post('/', authorize('asset:create'), validate({ body: createAssetSchema }), assetsController.create);
router.patch('/:id', authorize('asset:update'), validate({ body: updateAssetSchema }), assetsController.update);
router.patch('/:id/status', (req, res, next) => {
  const targetStatus = req.body?.status;
  const perm = (targetStatus === 'decommissioned' || targetStatus === 'disposed')
    ? 'asset:status:retire'
    : 'asset:status:operate';
  return authorize(perm)(req, res, next);
}, validate({ body: statusChangeSchema }), assetsController.changeStatus);

router.get('/:id/qr', authorize('asset:read'), assetsController.getQr);
router.get('/:id/events', authorize('asset:read'), assetsController.getEvents);

export default router;
