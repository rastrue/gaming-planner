import { GameGenre } from '@prisma/client';
import { z } from 'zod';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const gameIdParamsSchema = z.object({
  id: z.coerce.number().int().positive('Идентификатор игры должен быть положительным целым числом'),
});

export const createGameSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2, 'Slug должен содержать минимум 2 символа')
    .max(64, 'Slug должен содержать не более 64 символов')
    .regex(slugPattern, 'Slug может содержать только строчные буквы, цифры и дефисы'),
  title: z
    .string()
    .trim()
    .min(1, 'Название обязательно')
    .max(128, 'Название должно содержать не более 128 символов'),
  genre: z.nativeEnum(GameGenre, {
    errorMap: () => ({ message: 'Укажите корректный жанр игры' }),
  }),
  platform: z
    .string()
    .trim()
    .min(1, 'Платформа обязательна')
    .max(64, 'Платформа должна содержать не более 64 символов'),
  isActive: z.boolean().optional().default(true),
});

export const updateGameSchema = createGameSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Укажите хотя бы одно поле для обновления' },
);

export type CreateGameInput = z.infer<typeof createGameSchema>;
export type UpdateGameInput = z.infer<typeof updateGameSchema>;
