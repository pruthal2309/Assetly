import * as categoryService from './categories.service.js';
import { asyncHandler } from '../../common/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const categories = await categoryService.listCategories(req.scope);
  res.json({ data: categories });
});

export const getById = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.id, req.scope);
  res.json({ data: category });
});

export const create = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.user, req.body);
  res.status(201).json({ data: category });
});

export const update = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(req.user, req.params.id, req.body, req.scope);
  res.json({ data: category });
});
