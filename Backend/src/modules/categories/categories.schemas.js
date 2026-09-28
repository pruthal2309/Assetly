import { z } from 'zod';

const specFieldSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['string', 'number', 'boolean', 'select', 'date']),
  unit: z.string().optional(),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  min: z.number().optional(),
  max: z.number().optional()
});

export const createCategorySchema = z.object({
  key: z.string().min(2),
  name: z.string().min(2),
  defaultLifeYears: z.number().default(10),
  inspectionIntervalDays: z.number().default(180),
  icon: z.string().default('box'),
  specSchema: z.array(specFieldSchema).default([])
});

export const updateCategorySchema = createCategorySchema.partial();
