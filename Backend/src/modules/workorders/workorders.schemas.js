import { z } from 'zod';

export const createWorkOrderSchema = z.object({
  assetId: z.string().min(1),
  title: z.string().min(2),
  description: z.string().optional().default(''),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.string().optional(),
  estimatedCost: z.number().optional().default(0),
  checklist: z.array(z.object({ label: z.string(), done: z.boolean().default(false) })).optional().default([])
});

export const updateWorkOrderSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().optional(),
  estimatedCost: z.number().optional(),
  actualCost: z.number().optional(),
  workNotes: z.string().optional(),
  photos: z.array(z.string()).optional(),
  checklist: z.array(z.object({ label: z.string(), done: z.boolean() })).optional(),
  status: z.enum(['open', 'assigned', 'in_progress', 'submitted', 'completed', 'cancelled']).optional()
});

export const assignWorkOrderSchema = z.object({
  assigneeId: z.string().min(1)
});

export const submitWorkOrderSchema = z.object({
  workNotes: z.string().optional().default(''),
  photos: z.array(z.string()).optional().default([]),
  actualCost: z.number().optional().default(0),
  checklist: z.array(z.object({ label: z.string(), done: z.boolean() })).optional()
});

export const completeWorkOrderSchema = z.object({
  actualCost: z.number().optional().default(0),
  notes: z.string().optional().default(''),
  reviewNotes: z.string().optional().default('')
});

export const sendBackWorkOrderSchema = z.object({
  reason: z.string().min(2, 'Reason for sending back is required')
});

export const cancelWorkOrderSchema = z.object({
  reason: z.string().min(2, 'Cancellation reason required')
});

export const addCommentSchema = z.object({
  text: z.string().min(1, 'Comment cannot be empty')
});
