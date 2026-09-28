import * as woService from './workorders.service.js';
import { asyncHandler } from '../../common/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const workOrders = await woService.listWorkOrders(req.query, req.scope);
  res.json({ data: workOrders });
});

export const getById = asyncHandler(async (req, res) => {
  const wo = await woService.getWorkOrderById(req.params.id, req.scope);
  res.json({ data: wo });
});

export const create = asyncHandler(async (req, res) => {
  const wo = await woService.createWorkOrder(req.user, req.body);
  res.status(201).json({ data: wo });
});

export const update = asyncHandler(async (req, res) => {
  const wo = await woService.updateWorkOrder(req.user, req.params.id, req.body, req.scope);
  res.json({ data: wo });
});

export const assign = asyncHandler(async (req, res) => {
  const wo = await woService.assignWorkOrder(req.user, req.params.id, req.body.assigneeId, req.scope);
  res.json({ data: wo });
});

export const complete = asyncHandler(async (req, res) => {
  const wo = await woService.completeWorkOrder(req.user, req.params.id, req.body, req.scope);
  res.json({ data: wo });
});

export const cancel = asyncHandler(async (req, res) => {
  const wo = await woService.cancelWorkOrder(req.user, req.params.id, req.body.reason, req.scope);
  res.json({ data: wo });
});

export const submit = asyncHandler(async (req, res) => {
  const wo = await woService.submitWorkOrder(req.user, req.params.id, req.body, req.scope);
  res.json({ data: wo });
});

export const sendBack = asyncHandler(async (req, res) => {
  const wo = await woService.sendBackWorkOrder(req.user, req.params.id, req.body.reason, req.scope);
  res.json({ data: wo });
});

export const comment = asyncHandler(async (req, res) => {
  const wo = await woService.addComment(req.user, req.params.id, req.body.text, req.scope);
  res.json({ data: wo });
});
