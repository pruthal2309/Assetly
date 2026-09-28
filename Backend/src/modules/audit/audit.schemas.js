import { z } from 'zod';

export const auditQuerySchema = z.object({
  actorId: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  outcome: z.enum(['success', 'denied', 'error']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});
