import { Category } from '../../models/Category.js';
import { NotFoundError, ConflictError } from '../../common/errors.js';

export const listCategories = async (scopeFilter) => {
  return Category.find(scopeFilter).sort({ name: 1 });
};

export const getCategoryById = async (id, scopeFilter) => {
  const category = await Category.findOne({ _id: id, ...scopeFilter });
  if (!category) throw new NotFoundError('Category not found');
  return category;
};

export const getCategoryByKey = async (key, scopeFilter) => {
  const category = await Category.findOne({ key, ...scopeFilter });
  if (!category) throw new NotFoundError('Category not found');
  return category;
};

export const createCategory = async (actorUser, data) => {
  const existing = await Category.findOne({ orgId: actorUser.orgId, key: data.key });
  if (existing) throw new ConflictError('Category key already exists in organization');
  return Category.create({ ...data, orgId: actorUser.orgId });
};

export const updateCategory = async (actorUser, id, data, scopeFilter) => {
  const category = await Category.findOne({ _id: id, ...scopeFilter });
  if (!category) throw new NotFoundError('Category not found');
  Object.assign(category, data);
  await category.save();
  return category;
};
