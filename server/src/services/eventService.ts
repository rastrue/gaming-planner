import { EventStatus, Prisma, UserRoleName } from '@prisma/client';
import { eventFitsAvailability } from '../lib/availabilityFit.js';
import {
  canCancelPublishedEvent,
  canCompleteEventStatus,
  computeRegistrationDeadline,
  resolveEventStatus,
} from '../lib/eventLifecycle.js';
import { AppError } from '../lib/errors.js';
import prisma from '../lib/prisma.js';
import type {
  CreateEventInput,
  ListEventsQuery,
  UpdateEventInput,
} from '../validators/eventValidator.js';

const eventSelect = {
  id: true,
  gameId: true,
  organizerId: true,
  title: true,
  description: true,
  serverRegion: true,
  scheduledStart: true,
  scheduledEnd: true,
  registrationDeadline: true,
  maxPlayers: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  game: {
    select: {
      id: true,
      slug: true,
      title: true,
      genre: true,
      platform: true,
    },
  },
  organizer: {
    select: {
      id: true,
      username: true,
      displayName: true,
    },
  },
  _count: {
    select: {
      registrations: true,
      slots: true,
    },
  },
} as const;

export type EventRecord = Prisma.EventGetPayload<{ select: typeof eventSelect }>;

export interface PaginatedEvents {
  events: EventRecord[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

function buildEventWhere(query: ListEventsQuery): Prisma.EventWhereInput {
  const where: Prisma.EventWhereInput = {};

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  if (query.gameId) {
    where.gameId = query.gameId;
  }

  if (query.status) {
    where.status = query.status;
  }

  if (query.startDate || query.endDate) {
    where.scheduledStart = {
      ...(query.startDate ? { gte: query.startDate } : {}),
      ...(query.endDate ? { lte: query.endDate } : {}),
    };
  }

  return where;
}

function buildEventOrderBy(
  sort: ListEventsQuery['sort'],
  order: ListEventsQuery['order'],
): Prisma.EventOrderByWithRelationInput {
  return { [sort]: order };
}

async function syncEventLifecycle(event: EventRecord): Promise<EventRecord> {
  const resolved = resolveEventStatus(event);

  if (resolved === event.status) {
    return event;
  }

  return prisma.event.update({
    where: { id: event.id },
    data: { status: resolved },
    select: eventSelect,
  });
}

async function syncEvents(events: EventRecord[]): Promise<EventRecord[]> {
  return Promise.all(events.map((event) => syncEventLifecycle(event)));
}

function assertAllowedStatusTransition(current: EventRecord, next: EventStatus): void {
  if (next === current.status) {
    return;
  }

  if (next === EventStatus.COMPLETED) {
    assertCanCompleteEvent(current.scheduledStart);

    if (!canCompleteEventStatus(current.status, current.scheduledStart)) {
      throw new AppError(409, 'Завершить можно только событие в ожидании или уже начавшееся');
    }

    return;
  }

  if (next === EventStatus.CANCELLED) {
    assertCanCancelEvent(current.status);
    return;
  }

  throw new AppError(400, 'Недопустимый переход статуса события');
}

export async function listEvents(
  query: ListEventsQuery,
  availabilityUserId?: number,
): Promise<PaginatedEvents> {
  if (query.availabilityFit && !availabilityUserId) {
    throw new AppError(401, 'Требуется авторизация для фильтрации по доступности');
  }

  const where = buildEventWhere(query);
  const orderBy = buildEventOrderBy(query.sort, query.order);

  if (query.availabilityFit && availabilityUserId) {
    const windows = await prisma.availabilityWindow.findMany({
      where: { userId: availabilityUserId },
      select: {
        dayOfWeek: true,
        startMinute: true,
        endMinute: true,
      },
    });

    const candidates = await prisma.event.findMany({
      where,
      select: eventSelect,
      orderBy,
    });

    const filtered = candidates.filter((event) =>
      eventFitsAvailability(event.scheduledStart, event.scheduledEnd, windows),
    );

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
    const start = (query.page - 1) * query.pageSize;
    const events = await syncEvents(filtered.slice(start, start + query.pageSize));

    return {
      events,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages,
      },
    };
  }

  const [total, events] = await prisma.$transaction([
    prisma.event.count({ where }),
    prisma.event.findMany({
      where,
      select: eventSelect,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  const syncedEvents = await syncEvents(events);

  return {
    events: syncedEvents,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
  };
}

export async function getEventById(id: number): Promise<EventRecord> {
  const event = await prisma.event.findUnique({
    where: { id },
    select: eventSelect,
  });

  if (!event) {
    throw new AppError(404, 'Событие не найдено');
  }

  return syncEventLifecycle(event);
}

async function assertOrganizerOwnsEvent(eventId: number, organizerId: number): Promise<EventRecord> {
  const event = await getEventById(eventId);

  if (event.organizerId !== organizerId) {
    throw new AppError(403, 'Вы можете управлять только событиями, которые организуете');
  }

  return event;
}

function assertCanCompleteEvent(scheduledStart: Date): void {
  if (scheduledStart.getTime() > Date.now()) {
    throw new AppError(
      409,
      'Нельзя завершить событие, которое ещё не началось. Его можно отменить.',
    );
  }
}

function assertCanCancelEvent(currentStatus: EventStatus): void {
  if (!canCancelPublishedEvent(currentStatus)) {
    throw new AppError(409, 'Отменить можно только событие в регистрации или ожидании');
  }
}

function assertEventIsEditable(status: EventStatus): void {
  if (status === EventStatus.COMPLETED || status === EventStatus.CANCELLED) {
    throw new AppError(409, 'Завершённые и отменённые события нельзя изменять');
  }
}

function assertEventDetailsEditable(event: EventRecord): void {
  if (event.status !== EventStatus.REGISTRATION || event._count.registrations > 0) {
    throw new AppError(
      409,
      'Редактировать можно только события в статусе «Регистрация» без зарегистрированных игроков',
    );
  }
}

export async function createEvent(
  input: CreateEventInput,
  organizerId: number,
): Promise<EventRecord> {
  const game = await prisma.game.findUnique({ where: { id: input.gameId } });

  if (!game || !game.isActive) {
    throw new AppError(400, 'Выбранная игра недоступна');
  }

  const created = await prisma.event.create({
    data: {
      ...input,
      registrationDeadline: computeRegistrationDeadline(input.scheduledStart),
      status: EventStatus.REGISTRATION,
      organizerId,
    },
    select: eventSelect,
  });

  return syncEventLifecycle(created);
}

export async function updateEvent(
  id: number,
  input: UpdateEventInput,
  organizerId: number,
): Promise<EventRecord> {
  const current = await assertOrganizerOwnsEvent(id, organizerId);
  const syncedCurrent = await syncEventLifecycle(current);

  assertEventIsEditable(syncedCurrent.status);

  const isDetailsUpdate = Object.keys(input).some((key) => key !== 'status');
  if (isDetailsUpdate) {
    assertEventDetailsEditable(syncedCurrent);
  }

  if (input.status) {
    assertAllowedStatusTransition(syncedCurrent, input.status);
  }

  if (input.status === EventStatus.CANCELLED) {
    assertCanCancelEvent(syncedCurrent.status);
  }

  if (input.gameId) {
    const game = await prisma.game.findUnique({ where: { id: input.gameId } });

    if (!game || !game.isActive) {
      throw new AppError(400, 'Выбранная игра недоступна');
    }
  }

  if (input.scheduledStart || input.scheduledEnd) {
    const scheduledStart = input.scheduledStart ?? syncedCurrent.scheduledStart;
    const scheduledEnd = input.scheduledEnd ?? syncedCurrent.scheduledEnd;

    if (scheduledEnd <= scheduledStart) {
      throw new AppError(400, 'Время окончания должно быть позже времени начала');
    }
  }

  if (input.status === EventStatus.COMPLETED) {
    const scheduledStart = input.scheduledStart ?? syncedCurrent.scheduledStart;
    assertCanCompleteEvent(scheduledStart);
  }

  const data: Prisma.EventUpdateInput = { ...input };

  if (input.scheduledStart) {
    data.registrationDeadline = computeRegistrationDeadline(
      input.scheduledStart ?? syncedCurrent.scheduledStart,
    );
  }

  const updated = await prisma.event.update({
    where: { id },
    data,
    select: eventSelect,
  });

  return syncEventLifecycle(updated);
}

export async function deleteEvent(id: number, organizerId: number): Promise<void> {
  await assertOrganizerOwnsEvent(id, organizerId);
  throw new AppError(
    409,
    'События нельзя удалять. Отмените опубликованное событие, чтобы сохранить историю.',
  );
}

export function assertOrganizerRole(roleName: UserRoleName): void {
  if (roleName !== UserRoleName.ORGANIZER) {
    throw new AppError(403, 'Требуются права организатора');
  }
}
