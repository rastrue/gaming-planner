import { Prisma } from '@prisma/client';
import { AppError } from '../lib/errors.js';
import prisma from '../lib/prisma.js';
import type { AuthenticatedUser } from '../middleware/authMiddleware.js';
import type {
  CreateAvailabilityInput,
  ListAvailabilityQuery,
  UpdateAvailabilityInput,
} from '../validators/availabilityValidator.js';

const availabilitySelect = {
  id: true,
  userId: true,
  dayOfWeek: true,
  startMinute: true,
  endMinute: true,
  timezone: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type AvailabilityWindowRecord = Prisma.AvailabilityWindowGetPayload<{
  select: typeof availabilitySelect;
}>;

async function getAvailabilityByIdInternal(id: number): Promise<AvailabilityWindowRecord> {
  const window = await prisma.availabilityWindow.findUnique({
    where: { id },
    select: availabilitySelect,
  });

  if (!window) {
    throw new AppError(404, 'Availability window not found');
  }

  return window;
}

function assertOwnAvailability(window: AvailabilityWindowRecord, userId: number): void {
  if (window.userId !== userId) {
    throw new AppError(403, 'You can only manage your own availability windows');
  }
}

function validateMinuteRange(startMinute: number, endMinute: number): void {
  if (endMinute <= startMinute) {
    throw new AppError(400, 'End minute must be after start minute');
  }
}

export async function listAvailabilityWindows(
  user: AuthenticatedUser,
  query: ListAvailabilityQuery,
): Promise<AvailabilityWindowRecord[]> {
  return prisma.availabilityWindow.findMany({
    where: {
      userId: user.id,
      ...(query.dayOfWeek !== undefined ? { dayOfWeek: query.dayOfWeek } : {}),
    },
    select: availabilitySelect,
    orderBy: [{ dayOfWeek: 'asc' }, { startMinute: 'asc' }],
  });
}

export async function getAvailabilityWindowById(
  id: number,
  user: AuthenticatedUser,
): Promise<AvailabilityWindowRecord> {
  const window = await getAvailabilityByIdInternal(id);
  assertOwnAvailability(window, user.id);
  return window;
}

export async function createAvailabilityWindow(
  user: AuthenticatedUser,
  input: CreateAvailabilityInput,
): Promise<AvailabilityWindowRecord> {
  validateMinuteRange(input.startMinute, input.endMinute);

  return prisma.availabilityWindow.create({
    data: {
      userId: user.id,
      dayOfWeek: input.dayOfWeek,
      startMinute: input.startMinute,
      endMinute: input.endMinute,
      timezone: input.timezone,
    },
    select: availabilitySelect,
  });
}

export async function updateAvailabilityWindow(
  id: number,
  input: UpdateAvailabilityInput,
  user: AuthenticatedUser,
): Promise<AvailabilityWindowRecord> {
  const existing = await getAvailabilityByIdInternal(id);
  assertOwnAvailability(existing, user.id);

  const startMinute = input.startMinute ?? existing.startMinute;
  const endMinute = input.endMinute ?? existing.endMinute;
  validateMinuteRange(startMinute, endMinute);

  return prisma.availabilityWindow.update({
    where: { id },
    data: input,
    select: availabilitySelect,
  });
}

export async function deleteAvailabilityWindow(
  id: number,
  user: AuthenticatedUser,
): Promise<void> {
  const existing = await getAvailabilityByIdInternal(id);
  assertOwnAvailability(existing, user.id);
  await prisma.availabilityWindow.delete({ where: { id } });
}
