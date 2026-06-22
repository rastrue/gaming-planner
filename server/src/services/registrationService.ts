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
    throw new AppError(404, 'Событие не найдено');
  }

  return refreshed;
}

async function getRegistrationByIdInternal(id: number): Promise<RegistrationRecord> {
  const registration = await prisma.registration.findUnique({
    where: { id },
    select: registrationSelect,
  });

  if (!registration) {
    throw new AppError(404, 'Регистрация не найдена');
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

  throw new AppError(403, 'У вас нет доступа к этой регистрации');
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
      throw new AppError(404, 'Событие не найдено');
    }

    if (event.organizerId !== user.id) {
      throw new AppError(403, 'Вы можете просматривать регистрации только для событий, которые организуете');
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
    throw new AppError(403, 'Регистрироваться на события могут только игроки');
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
    throw new AppError(404, 'Событие не найдено');
  }

  const approvedRegistrationCount = await prisma.registration.count({
    where: {
      eventId: input.eventId,
      status: RegistrationStatus.APPROVED,
    },
  });

  if (!isRegistrationOpen({ ...event, approvedRegistrationCount })) {
    throw new AppError(409, 'Регистрация на это событие не открыта');
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
      throw new AppError(409, 'Вы уже зарегистрированы на это событие');
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
      throw new AppError(409, 'Вы уже зарегистрированы на это событие');
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
    throw new AppError(403, 'Вы можете изменять только свою регистрацию');
  }

  const allowedFields = ['status'];
  const inputKeys = Object.keys(input);

  if (inputKeys.some((key) => !allowedFields.includes(key))) {
    throw new AppError(403, 'Игроки могут отменять только свою регистрацию');
  }

  if (input.status !== RegistrationStatus.CANCELLED) {
    throw new AppError(400, 'Игроки могут только отменять регистрации');
  }

  if (
    registration.status !== RegistrationStatus.PENDING &&
    registration.status !== RegistrationStatus.APPROVED
  ) {
    throw new AppError(409, 'Эту регистрацию нельзя отменить');
  }

  const event = await syncRegistrationEvent(registration.event);

  if (!canPlayerCancelRegistration(event)) {
    throw new AppError(409, 'Отменить участие можно только на этапе регистрации, до статуса "Ожидание"');
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
    throw new AppError(403, 'Вы можете управлять регистрациями только для событий, которые организуете');
  }

  if (registration.event.status === EventStatus.CANCELLED) {
    throw new AppError(409, 'Отменённые события нельзя изменять');
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
        'Завершённое событие нельзя изменять. Доступна только отметка посещаемости.',
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
      throw new AppError(400, 'Организаторы могут только одобрять, отклонять или отменять регистрации');
    }

    if (registration.status === RegistrationStatus.CANCELLED) {
      throw new AppError(409, 'Отменённые регистрации нельзя изменить');
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
        throw new AppError(409, 'Все места на это событие уже заняты');
      }
    }

    data.status = input.status;

    if (input.status !== RegistrationStatus.APPROVED) {
      data.eventSlot = { disconnect: true };
    }
  }

  if (input.eventSlotId !== undefined) {
    if (registration.status !== RegistrationStatus.APPROVED) {
      throw new AppError(409, 'На слот можно назначить только одобренные регистрации');
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
        throw new AppError(400, 'Выбранный слот не принадлежит этому событию');
      }

      if (
        registration.eventSlotId !== input.eventSlotId &&
        slot._count.registrations >= slot.requiredCount
      ) {
        throw new AppError(409, 'Этот слот состава уже заполнен');
      }

      data.eventSlot = { connect: { id: input.eventSlotId } };
    }
  }

  if (input.attendanceStatus) {
    if (registration.event.status !== EventStatus.COMPLETED) {
      throw new AppError(409, 'Посещаемость можно отметить только после завершения события');
    }

    if (registration.status !== RegistrationStatus.APPROVED) {
      throw new AppError(409, 'Посещаемость можно отметить только для одобренных регистраций');
    }

    data.attendanceStatus = input.attendanceStatus;
  }

  if (input.requestedRoleName !== undefined) {
    data.requestedRoleName = input.requestedRoleName;
  }

  if (Object.keys(data).length === 0) {
    throw new AppError(400, 'Не указаны допустимые изменения для организатора');
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
      throw new AppError(403, 'Вы можете удалять только свою регистрацию');
    }

    if (registration.status !== RegistrationStatus.PENDING) {
      throw new AppError(409, 'Удалить можно только ожидающие регистрации');
    }
  } else if (registration.event.organizerId !== user.id) {
    throw new AppError(403, 'Вы можете удалять регистрации только для событий, которые организуете');
  }

  await prisma.registration.delete({ where: { id } });
}
