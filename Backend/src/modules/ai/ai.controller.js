import * as aiService from './ai.service.js';
import { asyncHandler } from '../../common/asyncHandler.js';

export const detectDamage = asyncHandler(async (req, res) => {
  const imageInput = req.body.imageUrl || req.file?.filename || 'demo_inspection_photo';
  const result = await aiService.analyzeDamage(imageInput);
  res.json({ data: result });
});
