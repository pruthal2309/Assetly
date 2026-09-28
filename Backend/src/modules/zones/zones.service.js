import { Zone } from '../../models/Zone.js';
import { NotFoundError, ConflictError } from '../../common/errors.js';

export const listZones = async (scopeFilter) => {
  return Zone.find(scopeFilter).sort({ code: 1 });
};

export const getZoneById = async (id, scopeFilter) => {
  const zone = await Zone.findOne({ _id: id, ...scopeFilter });
  if (!zone) throw new NotFoundError('Zone not found');
  return zone;
};

export const createZone = async (actorUser, data) => {
  const existing = await Zone.findOne({ orgId: actorUser.orgId, code: data.code });
  if (existing) throw new ConflictError('Zone code already exists in organization');
  return Zone.create({ ...data, orgId: actorUser.orgId });
};

export const updateZone = async (actorUser, id, data, scopeFilter) => {
  const zone = await Zone.findOne({ _id: id, ...scopeFilter });
  if (!zone) throw new NotFoundError('Zone not found');
  Object.assign(zone, data);
  await zone.save();
  return zone;
};
