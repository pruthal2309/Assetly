import { z } from 'zod';

export const dashboardQuerySchema = z.object({
  zoneId: z.string().optional()
});
