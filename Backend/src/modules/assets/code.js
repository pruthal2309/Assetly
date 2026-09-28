import { Counter } from '../../models/Counter.js';

const PREFIX_MAP = {
  road: 'RD',
  streetlight: 'SL',
  bridge: 'BR',
  pipeline: 'PL',
  drain: 'DR',
  building: 'BD'
};

export const generateAssetCode = async (categoryKey, orgId) => {
  const prefix = PREFIX_MAP[categoryKey.toLowerCase()] || categoryKey.substring(0, 2).toUpperCase();
  const counterId = `${prefix}:${orgId}`;

  const counter = await Counter.findByIdAndUpdate(
    counterId,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const paddedSeq = String(counter.seq).padStart(4, '0');
  return `${prefix}-${paddedSeq}`;
};
