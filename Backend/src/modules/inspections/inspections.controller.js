import * as inspectionService from './inspections.service.js';
import { asyncHandler } from '../../common/asyncHandler.js';

export const listForAsset = asyncHandler(async (req, res) => {
  const inspections = await inspectionService.listAssetInspections(req.params.id, req.scope);
  res.json({ data: inspections });
});

export const create = asyncHandler(async (req, res) => {
  const inspection = await inspectionService.createInspection(req.user, req.params.id, req.body, req.scope);
  res.status(201).json({ data: inspection });
});

export const update = asyncHandler(async (req, res) => {
  const inspection = await inspectionService.updateInspection(req.user, req.params.id, req.body, req.scope);
  res.json({ data: inspection });
});
