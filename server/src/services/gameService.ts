import { Prisma } from '@prisma/client';
import { AppError } from '../lib/errors.js';
import prisma from '../lib/prisma.js';
import type { CreateGameInput, UpdateGameInput } from '../validators/gameValidator.js';

const gameSelect = {
  id: true,
  slug: true,
  title: true,
  genre: true,
  platform: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type GameRecord = Prisma.GameGetPayload<{ select: typeof gameSelect }>;

export async function listGames(): Promise<GameRecord[]> {
  return prisma.game.findMany({
    select: gameSelect,
    orderBy: { title: 'asc' },
  });
}

export async function getGameById(id: number): Promise<GameRecord> {
  const game = await prisma.game.findUnique({
    where: { id },
    select: gameSelect,
  });

  if (!game) {
    throw new AppError(404, 'Игра не найдена');
  }

  return game;
}

export async function createGame(input: CreateGameInput): Promise<GameRecord> {
  try {
    return await prisma.game.create({
      data: {
        slug: input.slug,
        title: input.title,
        genre: input.genre,
        platform: input.platform,
        isActive: input.isActive,
      },
      select: gameSelect,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError(409, 'Игра с таким slug или названием уже существует');
    }

    throw error;
  }
}

export async function updateGame(id: number, input: UpdateGameInput): Promise<GameRecord> {
  await getGameById(id);

  try {
    return await prisma.game.update({
      where: { id },
      data: input,
      select: gameSelect,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError(409, 'Игра с таким slug или названием уже существует');
    }

    throw error;
  }
}

export async function deleteGame(id: number): Promise<void> {
  await getGameById(id);

  const linkedEvents = await prisma.event.count({
    where: { gameId: id },
  });

  if (linkedEvents > 0) {
    throw new AppError(409, 'Нельзя удалить игру, связанную с существующими событиями');
  }

  await prisma.game.delete({ where: { id } });
}
