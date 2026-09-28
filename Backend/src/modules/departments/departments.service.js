import { Department } from '../../models/Department.js';
import { Category } from '../../models/Category.js';
import { Asset } from '../../models/Asset.js';
import { User } from '../../models/User.js';
import { WorkOrder } from '../../models/WorkOrder.js';
import { CitizenReport } from '../../models/CitizenReport.js';
import { NotFoundError, ConflictError, BadRequestError } from '../../common/errors.js';
import { writeAuditLog } from '../../middleware/audit.js';

export const listDepartments = async (filters, scopeFilter) => {
  const { status } = filters;
  const mongoFilter = { ...scopeFilter };
  if (status) mongoFilter.status = status;

  const departments = await Department.find(mongoFilter)
    .sort({ name: 1 })
    .populate('categoryIds', 'name key icon')
    .populate('zoneIds', 'name code')
    .populate('supervisorIds', 'name email role')
    .populate('engineerIds', 'name email role');

  return departments;
};

export const getDepartmentById = async (id, scopeFilter) => {
  const dept = await Department.findOne({ _id: id, ...scopeFilter })
    .populate('categoryIds', 'name key icon')
    .populate('zoneIds', 'name code')
    .populate('supervisorIds', 'name email role status')
    .populate('engineerIds', 'name email role status');

  if (!dept) throw new NotFoundError('Department not found or out of scope');

  // Aggregated department stats
  const orgId = dept.orgId;
  const deptId = dept._id;

  const totalAssets = await Asset.countDocuments({ orgId, departmentId: deptId, archivedAt: null });
  const openReports = await CitizenReport.countDocuments({ orgId, departmentId: deptId, status: { $in: ['received', 'matched'] } });
  
  const workOrders = await WorkOrder.find({ orgId, departmentId: deptId });
  const now = new Date();

  const openWorkOrders = workOrders.filter((w) => w.status === 'open' || w.status === 'assigned').length;
  const inProgressWorkOrders = workOrders.filter((w) => w.status === 'in_progress' || w.status === 'submitted').length;
  const completedWorkOrders = workOrders.filter((w) => w.status === 'completed').length;
  const overdueWorkOrders = workOrders.filter(
    (w) => w.dueDate && new Date(w.dueDate) < now && !['completed', 'cancelled'].includes(w.status)
  ).length;

  return {
    ...dept.toObject(),
    stats: {
      totalAssets,
      openReports,
      openWorkOrders,
      inProgressWorkOrders,
      completedWorkOrders,
      overdueWorkOrders,
      totalWorkOrders: workOrders.length
    }
  };
};

export const createDepartment = async (actorUser, data) => {
  const existing = await Department.findOne({ orgId: actorUser.orgId, code: data.code.toUpperCase() });
  if (existing) {
    throw new ConflictError(`Department with code '${data.code}' already exists`);
  }

  const dept = await Department.create({
    orgId: actorUser.orgId,
    name: data.name,
    code: data.code.toUpperCase(),
    description: data.description || '',
    status: data.status || 'active',
    categoryIds: data.categoryIds || [],
    zoneIds: data.zoneIds || [],
    supervisorIds: data.supervisorIds || [],
    engineerIds: data.engineerIds || []
  });

  // Link selected categories to this department
  if (data.categoryIds && data.categoryIds.length > 0) {
    await Category.updateMany(
      { _id: { $in: data.categoryIds }, orgId: actorUser.orgId },
      { departmentId: dept._id }
    );
    // Update assets belonging to these categories
    await Asset.updateMany(
      { categoryId: { $in: data.categoryIds }, orgId: actorUser.orgId },
      { departmentId: dept._id }
    );
  }

  // Update user departmentIds
  const allUserIds = [...(data.supervisorIds || []), ...(data.engineerIds || [])];
  if (allUserIds.length > 0) {
    await User.updateMany(
      { _id: { $in: allUserIds }, orgId: actorUser.orgId },
      { $addToSet: { departmentIds: dept._id } }
    );
  }

  return getDepartmentById(dept._id, { orgId: actorUser.orgId });
};

export const updateDepartment = async (actorUser, id, updates, scopeFilter) => {
  const dept = await Department.findOne({ _id: id, ...scopeFilter });
  if (!dept) throw new NotFoundError('Department not found');

  if (updates.code && updates.code.toUpperCase() !== dept.code) {
    const existing = await Department.findOne({ orgId: actorUser.orgId, code: updates.code.toUpperCase() });
    if (existing) throw new ConflictError(`Department with code '${updates.code}' already exists`);
    dept.code = updates.code.toUpperCase();
  }

  if (updates.name) dept.name = updates.name;
  if (updates.description !== undefined) dept.description = updates.description;
  if (updates.status) dept.status = updates.status;
  if (updates.zoneIds) dept.zoneIds = updates.zoneIds;

  if (updates.categoryIds) {
    dept.categoryIds = updates.categoryIds;
    await Category.updateMany(
      { _id: { $in: updates.categoryIds }, orgId: actorUser.orgId },
      { departmentId: dept._id }
    );
    await Asset.updateMany(
      { categoryId: { $in: updates.categoryIds }, orgId: actorUser.orgId },
      { departmentId: dept._id }
    );
  }

  if (updates.supervisorIds) {
    dept.supervisorIds = updates.supervisorIds;
    await User.updateMany(
      { _id: { $in: updates.supervisorIds }, orgId: actorUser.orgId },
      { $addToSet: { departmentIds: dept._id } }
    );
  }

  if (updates.engineerIds) {
    dept.engineerIds = updates.engineerIds;
    await User.updateMany(
      { _id: { $in: updates.engineerIds }, orgId: actorUser.orgId },
      { $addToSet: { departmentIds: dept._id } }
    );
  }

  await dept.save();

  return getDepartmentById(dept._id, scopeFilter);
};
