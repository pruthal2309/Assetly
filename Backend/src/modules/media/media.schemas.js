import { z } from 'zod';

export const confirmMediaSchema = z.object({
  ownerType: z.enum(['asset', 'inspection', 'report']),
  ownerId: z.string().min(1),
  storageKey: z.string().min(1),
  mime: z.string(),
  sizeBytes: z.number()
});
