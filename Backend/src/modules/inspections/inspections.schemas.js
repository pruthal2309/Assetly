import { z } from 'zod';

export const createInspectionSchema = z.object({
  rating: z.number().min(1).max(5),
  notes: z.string().optional().default(''),
  ai: z
    .object({
      damageType: z.string().optional(),
      severity: z.enum(['none', 'low', 'medium', 'high', 'critical']).optional(),
      confidence: z.number().optional(),
      model: z.string().optional()
    })
    .optional(),
  mediaIds: z.array(z.string()).optional().default([])
});

export const updateInspectionSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  notes: z.string().optional()
});
