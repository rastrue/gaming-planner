import { EventStatus } from '@prisma/client';
import { z } from 'zod';

export const eventIdParamsSchema = z.object({
  id: z.coerce.number().int().positive('Event ID must be a positive integer'),
});

const sortFields = ['scheduledStart', 'title', 'createdAt', 'status'] as const;

const optionalEventStatusQuery = z.preprocess(
  (value) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const parsed = z.nativeEnum(EventStatus).safeParse(value);
    return parsed.success ? parsed.data : undefined;
  },
  z.nativeEnum(EventStatus).optional(),
);

export const listEventsQuerySchema = z.object({
  search: z.string().trim().optional(),
  gameId: z.coerce.number().int().positive('Game ID must be a positive integer').optional(),
  status: optionalEventStatusQuery,
  startDate: z.coerce.date({ invalid_type_error: 'Invalid start date' }).optional(),
  endDate: z.coerce.date({ invalid_type_error: 'Invalid end date' }).optional(),
  sort: z.enum(sortFields, {
    errorMap: () => ({ message: 'Invalid sort field' }),
  }).optional().default('scheduledStart'),
  order: z.enum(['asc', 'desc'], {
    errorMap: () => ({ message: 'Sort order must be asc or desc' }),
  }).optional().default('asc'),
  page: z.coerce.number().int().positive('Page number must be a positive integer').optional().default(1),
  pageSize: z.coerce
    .number()
    .int()
    .positive('Page size must be a positive integer')
    .max(100, 'Page size cannot exceed 100')
    .optional()
    .default(10),
  availabilityFit: z
    .enum(['true', 'false'], {
      errorMap: () => ({ message: 'availabilityFit must be true or false' }),
    })
    .optional()
    .transform((value) => value === 'true'),
});

const eventFieldsSchema = z.object({
  gameId: z.coerce.number().int().positive('Game ID is required'),
  title: z.string().trim().min(1, 'Title is required').max(160, 'Title is too long'),
  description: z.string().trim().min(1, 'Description is required'),
  serverRegion: z
    .string()
    .trim()
    .min(1, 'Server region is required')
    .max(64, 'Server region must be at most 64 characters'),
  scheduledStart: z.coerce.date({ invalid_type_error: 'Invalid start date' }),
  scheduledEnd: z.coerce.date({ invalid_type_error: 'Invalid end date' }),
  maxPlayers: z.coerce.number().int().positive('Maximum players must be at least 1'),
  status: z.nativeEnum(EventStatus, {
    errorMap: () => ({ message: 'Invalid event status' }),
  }).optional(),
});

const createEventFieldsSchema = eventFieldsSchema.omit({ status: true });

export const createEventSchema = createEventFieldsSchema.superRefine((data, ctx) => {
  if (data.scheduledEnd <= data.scheduledStart) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'End time must be after start time',
      path: ['scheduledEnd'],
    });
  }
});

export const updateEventSchema = eventFieldsSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: 'Provide at least one field to update',
  },
);

export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
