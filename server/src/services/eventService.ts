import { EventStatus, Prisma, UserRoleName } from '@prisma/client';
import { eventFitsAvailability } from '../lib/availabilityFit.js';
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
    const events = filtered.slice(start, start + query.pageSize);

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

  return {
    events,
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

  return event;
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
  if (currentStatus !== EventStatus.OPEN) {
    throw new AppError(409, 'Отменить можно только открытое событие');
  }
}

function assertEventIsEditable(status: EventStatus): void {
  if (status === EventStatus.COMPLETED || status === EventStatus.CANCELLED) {
    throw new AppError(409, 'Завершённые и отменённые события нельзя изменять');
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

  if (input.status === EventStatus.COMPLETED) {
    assertCanCompleteEvent(input.scheduledStart);
  }

  return prisma.event.create({
    data: {
      ...input,
      organizerId,
    },
    select: eventSelect,
  });
}

export async function updateEvent(
  id: number,
  input: UpdateEventInput,
  organizerId: number,
): Promise<EventRecord> {
  const current = await assertOrganizerOwnsEvent(id, organizerId);

  assertEventIsEditable(current.status);

  if (input.status === EventStatus.CANCELLED) {
    assertCanCancelEvent(current.status);
  }

  if (input.gameId) {
    const game = await prisma.game.findUnique({ where: { id: input.gameId } });

    if (!game || !game.isActive) {
      throw new AppError(400, 'Выбранная игра недоступна');
    }
  }

  if (input.scheduledStart || input.scheduledEnd || input.registrationDeadline) {
    const current = await getEventById(id);
    const scheduledStart = input.scheduledStart ?? current.scheduledStart;
    const scheduledEnd = input.scheduledEnd ?? current.scheduledEnd;
    const registrationDeadline = input.registrationDeadline ?? current.registrationDeadline;

    if (scheduledEnd <= scheduledStart) {
      throw new AppError(400, 'Время окончания должно быть позже времени начала');
    }

    if (registrationDeadline > scheduledStart) {
      throw new AppError(400, 'Срок регистрации должен быть не позже времени начала');
    }
  }

  if (input.status === EventStatus.COMPLETED) {
    const scheduledStart = input.scheduledStart ?? current.scheduledStart;
    assertCanCompleteEvent(scheduledStart);
  }

  return prisma.event.update({
    where: { id },
    data: input,
    select: eventSelect,
  });
}

export async function deleteEvent(id: number, organizerId: number): Promise<void> {
  await assertOrganizerOwnsEvent(id, organizerId);
  throw new AppError(
    409,
    'События нельзя удалять. Отмените открытое событие, чтобы сохранить историю.',
  );
}

export function assertOrganizerRole(roleName: UserRoleName): void {
  if (roleName !== UserRoleName.ORGANIZER) {
    throw new AppError(403, 'Требуются права организатора');
  }
}
