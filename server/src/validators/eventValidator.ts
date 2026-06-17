import { EventStatus } from '@prisma/client';
import { z } from 'zod';

export const eventIdParamsSchema = z.object({
  id: z.coerce.number().int().positive('Идентификатор события должен быть положительным целым числом'),
});

const sortFields = ['scheduledStart', 'title', 'createdAt', 'status'] as const;

export const listEventsQuerySchema = z.object({
  search: z.string().trim().optional(),
  gameId: z.coerce.number().int().positive('Идентификатор игры должен быть положительным числом').optional(),
  status: z.nativeEnum(EventStatus, {
    errorMap: () => ({ message: 'Недопустимый статус события' }),
  }).optional(),
  startDate: z.coerce.date({ invalid_type_error: 'Некорректная дата начала' }).optional(),
  endDate: z.coerce.date({ invalid_type_error: 'Некорректная дата окончания' }).optional(),
  sort: z.enum(sortFields, {
    errorMap: () => ({ message: 'Недопустимое поле сортировки' }),
  }).optional().default('scheduledStart'),
  order: z.enum(['asc', 'desc'], {
    errorMap: () => ({ message: 'Порядок сортировки должен быть asc или desc' }),
  }).optional().default('asc'),
  page: z.coerce.number().int().positive('Номер страницы должен быть положительным числом').optional().default(1),
  pageSize: z.coerce
    .number()
    .int()
    .positive('Размер страницы должен быть положительным числом')
    .max(100, 'Размер страницы не может превышать 100')
    .optional()
    .default(10),
  availabilityFit: z
    .enum(['true', 'false'], {
      errorMap: () => ({ message: 'Параметр availabilityFit должен быть true или false' }),
    })
    .optional()
    .transform((value) => value === 'true'),
});

const eventFieldsSchema = z.object({
  gameId: z.coerce.number().int().positive('Идентификатор игры обязателен'),
  title: z.string().trim().min(1, 'Название обязательно').max(160, 'Слишком длинное название'),
  description: z.string().trim().min(1, 'Описание обязательно'),
  serverRegion: z
    .string()
    .trim()
    .min(1, 'Регион сервера обязателен')
    .max(64, 'Регион сервера должен содержать не более 64 символов'),
  scheduledStart: z.coerce.date({ invalid_type_error: 'Некорректная дата начала' }),
  scheduledEnd: z.coerce.date({ invalid_type_error: 'Некорректная дата окончания' }),
  registrationDeadline: z.coerce.date({ invalid_type_error: 'Некорректный срок регистрации' }),
  maxPlayers: z.coerce.number().int().positive('Максимум игроков должен быть не меньше 1'),
  status: z.nativeEnum(EventStatus, {
    errorMap: () => ({ message: 'Недопустимый статус события' }),
  }).optional().default(EventStatus.DRAFT),
});

export const createEventSchema = eventFieldsSchema.superRefine((data, ctx) => {
  if (data.scheduledEnd <= data.scheduledStart) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Время окончания должно быть позже времени начала',
      path: ['scheduledEnd'],
    });
  }

  if (data.registrationDeadline > data.scheduledStart) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Срок регистрации должен быть не позже времени начала',
      path: ['registrationDeadline'],
    });
  }
});

export const updateEventSchema = eventFieldsSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: 'Укажите хотя бы одно поле для обновления',
  },
);

export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
