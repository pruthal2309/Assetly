import { z } from 'zod';

export const createCitizenReportSchema = z.object({
  description: z.string().min(5, 'Please provide a detailed description'),
  contact: z.string().optional().default(''),
  location: z.object({
    type: z.literal('Point').default('Point'),
    coordinates: z.tuple([z.number(), z.number()]) // [lng, lat]
  }),
  mediaIds: z.array(z.string()).optional().default([])
});

export const triageReportSchema = z.object({
  status: z.enum(['received', 'matched', 'in_progress', 'resolved', 'rejected']),
  matchedAssetId: z.string().optional(),
  createWorkOrder: z.boolean().optional().default(false)
});
