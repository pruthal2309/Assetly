import * as deptService from './departments.service.js';
import { asyncHandler } from '../../common/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const departments = await deptService.listDepartments(req.query, req.scope);
  res.json({ data: departments });
});

export const getById = asyncHandler(async (req, res) => {
  const dept = await deptService.getDepartmentById(req.params.id, req.scope);
  res.json({ data: dept });
});

export const create = asyncHandler(async (req, res) => {
  const dept = await deptService.createDepartment(req.user, req.body);
  res.status(201).json({ data: dept });
});

export const update = asyncHandler(async (req, res) => {
  const dept = await deptService.updateDepartment(req.user, req.params.id, req.body, req.scope);
  res.json({ data: dept });
});
