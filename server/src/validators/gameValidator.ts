import { GameGenre } from '@prisma/client';
import { z } from 'zod';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const gameIdParamsSchema = z.object({
  id: z.coerce.number().int().positive('Game ID must be a positive integer'),
});

export const createGameSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2, 'Slug must be at least 2 characters')
    .max(64, 'Slug must be at most 64 characters')
    .regex(slugPattern, 'Slug may only contain lowercase letters, numbers, and hyphens'),
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(128, 'Title must be at most 128 characters'),
  genre: z.nativeEnum(GameGenre, {
    errorMap: () => ({ message: 'Select a valid game genre' }),
  }),
  platform: z
    .string()
    .trim()
    .min(1, 'Platform is required')
    .max(64, 'Platform must be at most 64 characters'),
  isActive: z.boolean().optional().default(true),
});

export const updateGameSchema = createGameSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Provide at least one field to update' },
);

export type CreateGameInput = z.infer<typeof createGameSchema>;
export type UpdateGameInput = z.infer<typeof updateGameSchema>;
