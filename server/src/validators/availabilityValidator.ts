import { z } from 'zod';

export const availabilityIdParamsSchema = z.object({
  id: z.coerce.number().int().positive('Availability ID must be a positive integer'),
});

export const listAvailabilityQuerySchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0, 'Day of week must be between 0 (Sunday) and 6 (Saturday)').max(6, 'Day of week must be between 0 (Sunday) and 6 (Saturday)').optional(),
});

const availabilityFieldsSchema = z.object({
  dayOfWeek: z.coerce
    .number()
    .int()
    .min(0, 'Day of week must be between 0 (Sunday) and 6 (Saturday)')
    .max(6, 'Day of week must be between 0 (Sunday) and 6 (Saturday)'),
  startMinute: z.coerce
    .number()
    .int()
    .min(0, 'Start minute must be between 0 and 1439')
    .max(1439, 'Start minute must be between 0 and 1439'),
  endMinute: z.coerce
    .number()
    .int()
    .min(1, 'End minute must be between 1 and 1440')
    .max(1440, 'End minute must be between 1 and 1440'),
  timezone: z.string().trim().min(1, 'Timezone is required').max(64, 'Timezone value is too long'),
});

export const createAvailabilitySchema = availabilityFieldsSchema.superRefine((data, ctx) => {
  if (data.endMinute <= data.startMinute) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'End minute must be after start minute',
      path: ['endMinute'],
    });
  }
});

export const updateAvailabilitySchema = availabilityFieldsSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Provide at least one field to update' },
);

export type ListAvailabilityQuery = z.infer<typeof listAvailabilityQuerySchema>;
export type CreateAvailabilityInput = z.infer<typeof createAvailabilitySchema>;
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;
