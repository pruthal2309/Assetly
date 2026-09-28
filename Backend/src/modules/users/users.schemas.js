import { z } from 'zod';

export const inviteUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['supervisor', 'engineer', 'auditor'], {
    errorMap: () => ({ message: 'Role must be supervisor, engineer, or auditor' })
  }),
  zoneIds: z.array(z.string()).optional()
}).refine(
  (data) => {
    if (['supervisor', 'engineer'].includes(data.role)) {
      return Array.isArray(data.zoneIds) && data.zoneIds.length > 0;
    }
    return true;
  },
  {
    message: 'At least one assigned zone is required for Supervisor and Engineer roles',
    path: ['zoneIds']
  }
);

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(['admin', 'supervisor', 'engineer', 'auditor', 'citizen']).optional(),
  zoneIds: z.array(z.string()).optional(),
  status: z.enum(['active', 'invited', 'deactivated']).optional()
});
