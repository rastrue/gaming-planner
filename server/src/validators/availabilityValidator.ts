import { z } from 'zod';

export const availabilityIdParamsSchema = z.object({
  id: z.coerce.number().int().positive('Идентификатор доступности должен быть положительным целым числом'),
});

export const listAvailabilityQuerySchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0, 'День недели должен быть от 0 (воскресенье) до 6 (суббота)').max(6, 'День недели должен быть от 0 (воскресенье) до 6 (суббота)').optional(),
});

const availabilityFieldsSchema = z.object({
  dayOfWeek: z.coerce
    .number()
    .int()
    .min(0, 'День недели должен быть от 0 (воскресенье) до 6 (суббота)')
    .max(6, 'День недели должен быть от 0 (воскресенье) до 6 (суббота)'),
  startMinute: z.coerce
    .number()
    .int()
    .min(0, 'Минута начала должна быть от 0 до 1439')
    .max(1439, 'Минута начала должна быть от 0 до 1439'),
  endMinute: z.coerce
    .number()
    .int()
    .min(1, 'Минута окончания должна быть от 1 до 1440')
    .max(1440, 'Минута окончания должна быть от 1 до 1440'),
  timezone: z.string().trim().min(1, 'Часовой пояс обязателен').max(64, 'Слишком длинное значение часового пояса'),
});

export const createAvailabilitySchema = availabilityFieldsSchema.superRefine((data, ctx) => {
  if (data.endMinute <= data.startMinute) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Минута окончания должна быть позже минуты начала',
      path: ['endMinute'],
    });
  }
});

export const updateAvailabilitySchema = availabilityFieldsSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Укажите хотя бы одно поле для обновления' },
);

export type ListAvailabilityQuery = z.infer<typeof listAvailabilityQuerySchema>;
export type CreateAvailabilityInput = z.infer<typeof createAvailabilitySchema>;
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;
