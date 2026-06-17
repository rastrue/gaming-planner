import { AttendanceStatus, RegistrationStatus } from '@prisma/client';
import { z } from 'zod';

export const registrationIdParamsSchema = z.object({
  id: z.coerce.number().int().positive('Идентификатор регистрации должен быть положительным целым числом'),
});

export const listRegistrationsQuerySchema = z.object({
  eventId: z.coerce.number().int().positive('Идентификатор события должен быть положительным числом').optional(),
  status: z.nativeEnum(RegistrationStatus, {
    errorMap: () => ({ message: 'Недопустимый статус регистрации' }),
  }).optional(),
  page: z.coerce.number().int().positive('Номер страницы должен быть положительным числом').optional().default(1),
  pageSize: z.coerce
    .number()
    .int()
    .positive('Размер страницы должен быть положительным числом')
    .max(100, 'Размер страницы не может превышать 100')
    .optional()
    .default(10),
});

export const createRegistrationSchema = z.object({
  eventId: z.coerce.number().int().positive('Идентификатор события обязателен'),
  requestedRoleName: z
    .string()
    .trim()
    .min(1, 'Название роли не может быть пустым')
    .max(64, 'Название роли должно содержать не более 64 символов')
    .optional(),
});

export const updateRegistrationSchema = z
  .object({
    status: z.nativeEnum(RegistrationStatus, {
      errorMap: () => ({ message: 'Недопустимый статус регистрации' }),
    }).optional(),
    eventSlotId: z.coerce
      .number()
      .int()
      .positive('Идентификатор слота должен быть положительным числом')
      .nullable()
      .optional(),
    attendanceStatus: z.nativeEnum(AttendanceStatus, {
      errorMap: () => ({ message: 'Недопустимый статус посещаемости' }),
    }).optional(),
    requestedRoleName: z
      .string()
      .trim()
      .min(1, 'Название роли не может быть пустым')
      .max(64, 'Название роли должно содержать не более 64 символов')
      .nullable()
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Укажите хотя бы одно поле для обновления',
  });

export type ListRegistrationsQuery = z.infer<typeof listRegistrationsQuerySchema>;
export type CreateRegistrationInput = z.infer<typeof createRegistrationSchema>;
export type UpdateRegistrationInput = z.infer<typeof updateRegistrationSchema>;
