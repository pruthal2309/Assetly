import { z } from 'zod';

export const createZoneSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  boundary: z
    .object({
      type: z.literal('Polygon'),
      coordinates: z.array(z.array(z.array(z.number())))
    })
    .optional()
});

export const updateZoneSchema = createZoneSchema.partial();
