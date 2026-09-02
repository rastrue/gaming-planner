import { EventStatus, Prisma } from '@prisma/client';
import { AppError } from '../lib/errors.js';
import prisma from '../lib/prisma.js';
import { getEventById } from './eventService.js';
import type { CreateSlotInput, UpdateSlotInput } from '../validators/slotValidator.js';

const slotSelect = {
  id: true,
  eventId: true,
  roleName: true,
  displayOrder: true,
  requiredCount: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      registrations: true,
    },
  },
} as const;

export type EventSlotRecord = Prisma.EventSlotGetPayload<{ select: typeof slotSelect }>;

async function assertOrganizerOwnsEvent(eventId: number, organizerId: number): Promise<void> {
  const event = await getEventById(eventId);

  if (event.organizerId !== organizerId) {
    throw new AppError(403, 'You can only manage slots for events you organize');
  }

  if (event.status === EventStatus.COMPLETED || event.status === EventStatus.CANCELLED) {
    throw new AppError(409, 'Completed and canceled events cannot be modified');
  }
}

async function getSlotById(id: number): Promise<EventSlotRecord> {
  const slot = await prisma.eventSlot.findUnique({
    where: { id },
    select: slotSelect,
  });

  if (!slot) {
    throw new AppError(404, 'Event slot not found');
  }

  return slot;
}

function handleUniqueConstraint(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    throw new AppError(
      409,
      'Role name and display order must be unique within an event',
    );
  }

  throw error;
}

export async function listEventSlots(eventId: number): Promise<EventSlotRecord[]> {
  await getEventById(eventId);

  return prisma.eventSlot.findMany({
    where: { eventId },
    select: slotSelect,
    orderBy: { displayOrder: 'asc' },
  });
}

export async function createEventSlot(
  eventId: number,
  input: CreateSlotInput,
  organizerId: number,
): Promise<EventSlotRecord> {
  await assertOrganizerOwnsEvent(eventId, organizerId);

  try {
    return await prisma.eventSlot.create({
      data: {
        eventId,
        roleName: input.roleName,
        displayOrder: input.displayOrder,
        requiredCount: input.requiredCount,
      },
      select: slotSelect,
    });
  } catch (error) {
    handleUniqueConstraint(error);
  }
}

export async function updateEventSlot(
  id: number,
  input: UpdateSlotInput,
  organizerId: number,
): Promise<EventSlotRecord> {
  const slot = await getSlotById(id);
  await assertOrganizerOwnsEvent(slot.eventId, organizerId);

  try {
    return await prisma.eventSlot.update({
      where: { id },
      data: input,
      select: slotSelect,
    });
  } catch (error) {
    handleUniqueConstraint(error);
  }
}

export async function deleteEventSlot(id: number, organizerId: number): Promise<void> {
  const slot = await getSlotById(id);
  await assertOrganizerOwnsEvent(slot.eventId, organizerId);

  if (slot._count.registrations > 0) {
    throw new AppError(409, 'Cannot delete a slot with assigned registrations');
  }

  await prisma.eventSlot.delete({ where: { id } });
}
