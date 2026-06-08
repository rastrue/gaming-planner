import { AttendanceStatus, RegistrationStatus } from '@prisma/client';
import { z } from 'zod';

export const registrationIdParamsSchema = z.object({
  id: z.coerce.number().int().positive('Registration id must be a positive integer'),
});

export const listRegistrationsQuerySchema = z.object({
  eventId: z.coerce.number().int().positive().optional(),
  status: z.nativeEnum(RegistrationStatus).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(10),
});

export const createRegistrationSchema = z.object({
  eventId: z.coerce.number().int().positive('Event id is required'),
  requestedRoleName: z.string().trim().min(1).max(64).optional(),
});

export const updateRegistrationSchema = z
  .object({
    status: z.nativeEnum(RegistrationStatus).optional(),
    eventSlotId: z.coerce.number().int().positive().nullable().optional(),
    attendanceStatus: z.nativeEnum(AttendanceStatus).optional(),
    requestedRoleName: z.string().trim().min(1).max(64).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export type ListRegistrationsQuery = z.infer<typeof listRegistrationsQuerySchema>;
export type CreateRegistrationInput = z.infer<typeof createRegistrationSchema>;
export type UpdateRegistrationInput = z.infer<typeof updateRegistrationSchema>;
