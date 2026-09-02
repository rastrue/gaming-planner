import { AttendanceStatus, RegistrationStatus } from '@prisma/client';
import { z } from 'zod';

export const registrationIdParamsSchema = z.object({
  id: z.coerce.number().int().positive('Registration ID must be a positive integer'),
});

export const listRegistrationsQuerySchema = z.object({
  eventId: z.coerce.number().int().positive('Event ID must be a positive integer').optional(),
  status: z.nativeEnum(RegistrationStatus, {
    errorMap: () => ({ message: 'Invalid registration status' }),
  }).optional(),
  page: z.coerce.number().int().positive('Page number must be a positive integer').optional().default(1),
  pageSize: z.coerce
    .number()
    .int()
    .positive('Page size must be a positive integer')
    .max(100, 'Page size cannot exceed 100')
    .optional()
    .default(10),
});

export const createRegistrationSchema = z.object({
  eventId: z.coerce.number().int().positive('Event ID is required'),
  requestedRoleName: z
    .string()
    .trim()
    .min(1, 'Role name cannot be empty')
    .max(64, 'Role name must be at most 64 characters')
    .optional(),
});

export const updateRegistrationSchema = z
  .object({
    status: z.nativeEnum(RegistrationStatus, {
      errorMap: () => ({ message: 'Invalid registration status' }),
    }).optional(),
    eventSlotId: z.coerce
      .number()
      .int()
      .positive('Slot ID must be a positive integer')
      .nullable()
      .optional(),
    attendanceStatus: z.nativeEnum(AttendanceStatus, {
      errorMap: () => ({ message: 'Invalid attendance status' }),
    }).optional(),
    requestedRoleName: z
      .string()
      .trim()
      .min(1, 'Role name cannot be empty')
      .max(64, 'Role name must be at most 64 characters')
      .nullable()
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });

export type ListRegistrationsQuery = z.infer<typeof listRegistrationsQuerySchema>;
export type CreateRegistrationInput = z.infer<typeof createRegistrationSchema>;
export type UpdateRegistrationInput = z.infer<typeof updateRegistrationSchema>;
