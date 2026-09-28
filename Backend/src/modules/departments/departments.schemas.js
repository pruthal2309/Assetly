import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z.string().min(2, 'Code must be at least 2 characters'),
  description: z.string().optional().default(''),
  status: z.enum(['active', 'inactive']).optional().default('active'),
  categoryIds: z.array(z.string()).optional().default([]),
  zoneIds: z.array(z.string()).optional().default([]),
  supervisorIds: z.array(z.string()).optional().default([]),
  engineerIds: z.array(z.string()).optional().default([])
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(2).optional(),
  code: z.string().min(2).optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  categoryIds: z.array(z.string()).optional(),
  zoneIds: z.array(z.string()).optional(),
  supervisorIds: z.array(z.string()).optional(),
  engineerIds: z.array(z.string()).optional()
});
