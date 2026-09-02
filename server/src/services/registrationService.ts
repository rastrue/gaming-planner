import {
  AttendanceStatus,
  EventStatus,
  Prisma,
  RegistrationStatus,
  UserRoleName,
} from '@prisma/client';
import { isRegistrationOpen, canPlayerCancelRegistration } from '../lib/eventLifecycle.js';
import { AppError } from '../lib/errors.js';
import prisma from '../lib/prisma.js';
import { syncEventStatusForEvent } from './eventService.js';
import type { AuthenticatedUser } from '../middleware/authMiddleware.js';
import type {
  CreateRegistrationInput,
  ListRegistrationsQuery,
  UpdateRegistrationInput,
} from '../validators/registrationValidator.js';

const registrationSelect = {
  id: true,
  eventId: true,
  userId: true,
  eventSlotId: true,
  requestedRoleName: true,
  status: true,
  attendanceStatus: true,
  joinedAt: true,
  updatedAt: true,
  event: {
    select: {
      id: true,
      title: true,
      status: true,
      organizerId: true,
      registrationDeadline: true,
      scheduledStart: true,
      scheduledEnd: true,
    },
  },
  user: {
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
    },
  },
  eventSlot: {
    select: {
      id: true,
      roleName: true,
      displayOrder: true,
    },
  },
} as const;

export type RegistrationRecord = Prisma.RegistrationGetPayload<{ select: typeof registrationSelect }>;

export interface PaginatedRegistrations {
  registrations: RegistrationRecord[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

async function syncRegistrationEvent(
  event: RegistrationRecord['event'],
): Promise<RegistrationRecord['event']> {
  await syncEventStatusForEvent(event.id);

  const refreshed = await prisma.event.findUnique({
    where: { id: event.id },
    select: registrationSelect.event.select,
  });

  if (!refreshed) {
    throw new AppError(404, 'Event not found');
  }

  return refreshed;
}

async function getRegistrationByIdInternal(id: number): Promise<RegistrationRecord> {
  const registration = await prisma.registration.findUnique({
    where: { id },
    select: registrationSelect,
  });

  if (!registration) {
    throw new AppError(404, 'Registration not found');
  }

  return {
    ...registration,
    event: await syncRegistrationEvent(registration.event),
  };
}

function assertCanViewRegistration(registration: RegistrationRecord, user: AuthenticatedUser): void {
  const isOwner = registration.userId === user.id;
  const isOrganizer = user.roleName === UserRoleName.ORGANIZER;
  const managesEvent = registration.event.organizerId === user.id;

  if (isOwner || (isOrganizer && managesEvent)) {
    return;
  }

  throw new AppError(403, 'You do not have access to this registration');
}

export async function listRegistrations(
  user: AuthenticatedUser,
  query: ListRegistrationsQuery,
): Promise<PaginatedRegistrations> {
  const where: Prisma.RegistrationWhereInput = {};

  if (query.status) {
    where.status = query.status;
  }

  if (user.roleName === UserRoleName.PLAYER) {
    where.userId = user.id;

    if (query.eventId) {
      where.eventId = query.eventId;
    }
  } else if (query.eventId) {
    const event = await prisma.event.findUnique({
      where: { id: query.eventId },
      select: { organizerId: true },
    });

    if (!event) {
      throw new AppError(404, 'Event not found');
    }

    if (event.organizerId !== user.id) {
      throw new AppError(403, 'You can only view registrations for events you organize');
    }

    where.eventId = query.eventId;
  } else {
    where.event = { organizerId: user.id };
  }

  const [total, registrations] = await prisma.$transaction([
    prisma.registration.count({ where }),
    prisma.registration.findMany({
      where,
      select: registrationSelect,
      orderBy: { joinedAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return {
    registrations: await Promise.all(
      registrations.map(async (registration) => ({
        ...registration,
        event: await syncRegistrationEvent(registration.event),
      })),
    ),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
  };
}

export async function getRegistrationById(
  id: number,
  user: AuthenticatedUser,
): Promise<RegistrationRecord> {
  const registration = await getRegistrationByIdInternal(id);
  assertCanViewRegistration(registration, user);
  return registration;
}

export async function createRegistration(
  user: AuthenticatedUser,
  input: CreateRegistrationInput,
): Promise<RegistrationRecord> {
  if (user.roleName !== UserRoleName.PLAYER) {
    throw new AppError(403, 'Only players can register for events');
  }

  const event = await prisma.event.findUnique({
    where: { id: input.eventId },
    select: {
      id: true,
      status: true,
      registrationDeadline: true,
      scheduledStart: true,
      maxPlayers: true,
    },
  });

  if (!event) {
    throw new AppError(404, 'Event not found');
  }

  const approvedRegistrationCount = await prisma.registration.count({
    where: {
      eventId: input.eventId,
      status: RegistrationStatus.APPROVED,
    },
  });

  if (!isRegistrationOpen({ ...event, approvedRegistrationCount })) {
    throw new AppError(409, 'Registration for this event is not open');
  }

  const existing = await prisma.registration.findUnique({
    where: {
      eventId_userId: {
        eventId: input.eventId,
        userId: user.id,
      },
    },
    select: { id: true, status: true },
  });

  if (existing) {
    if (
      existing.status === RegistrationStatus.PENDING ||
      existing.status === RegistrationStatus.APPROVED
    ) {
      throw new AppError(409, 'You are already registered for this event');
    }

    if (
      existing.status === RegistrationStatus.DECLINED ||
      existing.status === RegistrationStatus.CANCELLED
    ) {
      return prisma.registration.update({
        where: { id: existing.id },
        data: {
          status: RegistrationStatus.PENDING,
          requestedRoleName: input.requestedRoleName ?? null,
          attendanceStatus: AttendanceStatus.NOT_MARKED,
          eventSlot: { disconnect: true },
          joinedAt: new Date(),
        },
        select: registrationSelect,
      });
    }
  }

  try {
    return await prisma.registration.create({
      data: {
        eventId: input.eventId,
        userId: user.id,
        requestedRoleName: input.requestedRoleName,
        status: RegistrationStatus.PENDING,
      },
      select: registrationSelect,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError(409, 'You are already registered for this event');
    }

    throw error;
  }
}

async function applyPlayerUpdate(
  registration: RegistrationRecord,
  input: UpdateRegistrationInput,
  userId: number,
): Promise<Prisma.RegistrationUpdateInput> {
  if (registration.userId !== userId) {
    throw new AppError(403, 'You can only modify your own registration');
  }

  const allowedFields = ['status'];
  const inputKeys = Object.keys(input);

  if (inputKeys.some((key) => !allowedFields.includes(key))) {
    throw new AppError(403, 'Players can only cancel their own registration');
  }

  if (input.status !== RegistrationStatus.CANCELLED) {
    throw new AppError(400, 'Players can only cancel registrations');
  }

  if (
    registration.status !== RegistrationStatus.PENDING &&
    registration.status !== RegistrationStatus.APPROVED
  ) {
    throw new AppError(409, 'This registration cannot be canceled');
  }

  const event = await syncRegistrationEvent(registration.event);

  if (!canPlayerCancelRegistration(event)) {
    throw new AppError(409, 'Participation can only be canceled during registration, before Waiting status');
  }

  return {
    status: RegistrationStatus.CANCELLED,
    eventSlot: { disconnect: true },
  };
}

async function applyOrganizerUpdate(
  registration: RegistrationRecord,
  input: UpdateRegistrationInput,
  organizerId: number,
): Promise<Prisma.RegistrationUpdateInput> {
  if (registration.event.organizerId !== organizerId) {
    throw new AppError(403, 'You can only manage registrations for events you organize');
  }

  if (registration.event.status === EventStatus.CANCELLED) {
    throw new AppError(409, 'Canceled events cannot be modified');
  }

  if (registration.event.status === EventStatus.COMPLETED) {
    const isAttendanceOnly =
      input.attendanceStatus !== undefined &&
      input.status === undefined &&
      input.eventSlotId === undefined &&
      input.requestedRoleName === undefined;

    if (!isAttendanceOnly) {
      throw new AppError(
        409,
        'Completed events cannot be modified. Only attendance can be marked.',
      );
    }
  }

  const data: Prisma.RegistrationUpdateInput = {};

  if (input.status) {
    if (
      input.status !== RegistrationStatus.APPROVED &&
      input.status !== RegistrationStatus.DECLINED &&
      input.status !== RegistrationStatus.CANCELLED
    ) {
      throw new AppError(400, 'Organizers can only approve, decline, or cancel registrations');
    }

    if (registration.status === RegistrationStatus.CANCELLED) {
      throw new AppError(409, 'Canceled registrations cannot be changed');
    }

    if (
      input.status === RegistrationStatus.APPROVED &&
      registration.status !== RegistrationStatus.APPROVED
    ) {
      const [approvedCount, eventCapacity] = await Promise.all([
        prisma.registration.count({
          where: {
            eventId: registration.eventId,
            status: RegistrationStatus.APPROVED,
          },
        }),
        prisma.event.findUnique({
          where: { id: registration.eventId },
          select: { maxPlayers: true },
        }),
      ]);

      if (eventCapacity && approvedCount >= eventCapacity.maxPlayers) {
        throw new AppError(409, 'All spots for this event are already taken');
      }
    }

    data.status = input.status;

    if (input.status !== RegistrationStatus.APPROVED) {
      data.eventSlot = { disconnect: true };
    }
  }

  if (input.eventSlotId !== undefined) {
    if (registration.status !== RegistrationStatus.APPROVED) {
      throw new AppError(409, 'Only approved registrations can be assigned to a slot');
    }

    if (input.eventSlotId === null) {
      data.eventSlot = { disconnect: true };
    } else {
      const slot = await prisma.eventSlot.findUnique({
        where: { id: input.eventSlotId },
        select: {
          eventId: true,
          requiredCount: true,
          _count: {
            select: {
              registrations: {
                where: {
                  status: RegistrationStatus.APPROVED,
                  id: { not: registration.id },
                },
              },
            },
          },
        },
      });

      if (!slot || slot.eventId !== registration.eventId) {
        throw new AppError(400, 'The selected slot does not belong to this event');
      }

      if (
        registration.eventSlotId !== input.eventSlotId &&
        slot._count.registrations >= slot.requiredCount
      ) {
        throw new AppError(409, 'This roster slot is already full');
      }

      data.eventSlot = { connect: { id: input.eventSlotId } };
    }
  }

  if (input.attendanceStatus) {
    if (registration.event.status !== EventStatus.COMPLETED) {
      throw new AppError(409, 'Attendance can only be marked after the event is completed');
    }

    if (registration.status !== RegistrationStatus.APPROVED) {
      throw new AppError(409, 'Attendance can only be marked for approved registrations');
    }

    data.attendanceStatus = input.attendanceStatus;
  }

  if (input.requestedRoleName !== undefined) {
    data.requestedRoleName = input.requestedRoleName;
  }

  if (Object.keys(data).length === 0) {
    throw new AppError(400, 'No valid organizer changes were provided');
  }

  return data;
}

export async function updateRegistration(
  id: number,
  input: UpdateRegistrationInput,
  user: AuthenticatedUser,
): Promise<RegistrationRecord> {
  const registration = await getRegistrationByIdInternal(id);

  const data =
    user.roleName === UserRoleName.PLAYER
      ? await applyPlayerUpdate(registration, input, user.id)
      : await applyOrganizerUpdate(registration, input, user.id);

  const updated = await prisma.registration.update({
    where: { id },
    data,
    select: registrationSelect,
  });

  await syncEventStatusForEvent(updated.eventId);

  const syncedEvent = await prisma.event.findUnique({
    where: { id: updated.eventId },
    select: registrationSelect.event.select,
  });

  return {
    ...updated,
    event: syncedEvent ?? updated.event,
  };
}

export async function deleteRegistration(id: number, user: AuthenticatedUser): Promise<void> {
  const registration = await getRegistrationByIdInternal(id);

  if (user.roleName === UserRoleName.PLAYER) {
    if (registration.userId !== user.id) {
      throw new AppError(403, 'You can only delete your own registration');
    }

    if (registration.status !== RegistrationStatus.PENDING) {
      throw new AppError(409, 'Only pending registrations can be deleted');
    }
  } else if (registration.event.organizerId !== user.id) {
    throw new AppError(403, 'You can only delete registrations for events you organize');
  }

  await prisma.registration.delete({ where: { id } });
}
