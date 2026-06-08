import { z } from 'zod';

export const eventSlotEventParamsSchema = z.object({
  eventId: z.coerce.number().int().positive('Event id must be a positive integer'),
});

export const slotIdParamsSchema = z.object({
  id: z.coerce.number().int().positive('Slot id must be a positive integer'),
});

export const createSlotSchema = z.object({
  roleName: z
    .string()
    .trim()
    .min(1, 'Role name is required')
    .max(64, 'Role name must be at most 64 characters'),
  displayOrder: z.coerce.number().int().positive('Display order must be a positive integer'),
  requiredCount: z.coerce.number().int().positive('Required count must be at least 1'),
});

export const updateSlotSchema = createSlotSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' },
);

export type CreateSlotInput = z.infer<typeof createSlotSchema>;
export type UpdateSlotInput = z.infer<typeof updateSlotSchema>;
