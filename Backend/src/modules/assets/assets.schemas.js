import { z } from 'zod';

export const createAssetSchema = z.object({
  name: z.string().min(2),
  categoryId: z.string().min(1),
  zoneId: z.string().min(1),
  location: z.object({
    type: z.literal('Point').default('Point'),
    coordinates: z.tuple([z.number(), z.number()]) // [lng, lat]
  }),
  address: z.string().optional().default(''),
  installDate: z.string().optional(),
  acquisitionCost: z.number().optional().default(0),
  vendor: z.string().optional().default(''),
  expectedLifeYears: z.number().optional().default(10),
  specs: z.record(z.any()).optional().default({}),
  status: z
    .enum(['planned', 'acquired', 'installed', 'in_service', 'under_maintenance', 'decommissioned', 'disposed'])
    .default('installed')
});

export const updateAssetSchema = createAssetSchema.partial();

export const statusChangeSchema = z.object({
  status: z.enum(['planned', 'acquired', 'installed', 'in_service', 'under_maintenance', 'decommissioned', 'disposed']),
  reason: z.string().optional()
});
