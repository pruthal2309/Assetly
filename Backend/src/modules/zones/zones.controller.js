import * as zoneService from './zones.service.js';
import { asyncHandler } from '../../common/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const zones = await zoneService.listZones(req.scope);
  res.json({ data: zones });
});

export const getById = asyncHandler(async (req, res) => {
  const zone = await zoneService.getZoneById(req.params.id, req.scope);
  res.json({ data: zone });
});

export const create = asyncHandler(async (req, res) => {
  const zone = await zoneService.createZone(req.user, req.body);
  res.status(201).json({ data: zone });
});

export const update = asyncHandler(async (req, res) => {
  const zone = await zoneService.updateZone(req.user, req.params.id, req.body, req.scope);
  res.json({ data: zone });
});
