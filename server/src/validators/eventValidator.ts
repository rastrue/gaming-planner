import { EventStatus } from '@prisma/client';
import { z } from 'zod';

export const eventIdParamsSchema = z.object({
  id: z.coerce.number().int().positive('Event id must be a positive integer'),
});

const sortFields = ['scheduledStart', 'title', 'createdAt', 'status'] as const;

export const listEventsQuerySchema = z.object({
  search: z.string().trim().optional(),
  gameId: z.coerce.number().int().positive().optional(),
  status: z.nativeEnum(EventStatus).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  sort: z.enum(sortFields).optional().default('scheduledStart'),
  order: z.enum(['asc', 'desc']).optional().default('asc'),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(10),
  availabilityFit: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
});

const eventFieldsSchema = z.object({
  gameId: z.coerce.number().int().positive('Game id is required'),
  title: z.string().trim().min(1, 'Title is required').max(160, 'Title is too long'),
  description: z.string().trim().min(1, 'Description is required'),
  serverRegion: z.string().trim().min(1, 'Server region is required').max(64),
  scheduledStart: z.coerce.date(),
  scheduledEnd: z.coerce.date(),
  registrationDeadline: z.coerce.date(),
  maxPlayers: z.coerce.number().int().positive('Max players must be at least 1'),
  status: z.nativeEnum(EventStatus).optional().default(EventStatus.DRAFT),
});

export const createEventSchema = eventFieldsSchema.superRefine((data, ctx) => {
  if (data.scheduledEnd <= data.scheduledStart) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Scheduled end must be after scheduled start',
      path: ['scheduledEnd'],
    });
  }

  if (data.registrationDeadline > data.scheduledStart) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Registration deadline must be on or before scheduled start',
      path: ['registrationDeadline'],
    });
  }
});

export const updateEventSchema = eventFieldsSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: 'At least one field must be provided for update',
  },
);

export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
