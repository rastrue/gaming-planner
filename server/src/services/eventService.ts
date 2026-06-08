import { Prisma, UserRoleName } from '@prisma/client';
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
    throw new AppError(401, 'Authentication required for availability fit filtering');
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
    throw new AppError(404, 'Event not found');
  }

  return event;
}

async function assertOrganizerOwnsEvent(eventId: number, organizerId: number): Promise<EventRecord> {
  const event = await getEventById(eventId);

  if (event.organizerId !== organizerId) {
    throw new AppError(403, 'You can only manage events that you organize');
  }

  return event;
}

export async function createEvent(
  input: CreateEventInput,
  organizerId: number,
): Promise<EventRecord> {
  const game = await prisma.game.findUnique({ where: { id: input.gameId } });

  if (!game || !game.isActive) {
    throw new AppError(400, 'Selected game is not available');
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
  await assertOrganizerOwnsEvent(id, organizerId);

  if (input.gameId) {
    const game = await prisma.game.findUnique({ where: { id: input.gameId } });

    if (!game || !game.isActive) {
      throw new AppError(400, 'Selected game is not available');
    }
  }

  if (input.scheduledStart || input.scheduledEnd || input.registrationDeadline) {
    const current = await getEventById(id);
    const scheduledStart = input.scheduledStart ?? current.scheduledStart;
    const scheduledEnd = input.scheduledEnd ?? current.scheduledEnd;
    const registrationDeadline = input.registrationDeadline ?? current.registrationDeadline;

    if (scheduledEnd <= scheduledStart) {
      throw new AppError(400, 'Scheduled end must be after scheduled start');
    }

    if (registrationDeadline > scheduledStart) {
      throw new AppError(400, 'Registration deadline must be on or before scheduled start');
    }
  }

  return prisma.event.update({
    where: { id },
    data: input,
    select: eventSelect,
  });
}

export async function deleteEvent(id: number, organizerId: number): Promise<void> {
  await assertOrganizerOwnsEvent(id, organizerId);
  await prisma.event.delete({ where: { id } });
}

export function assertOrganizerRole(roleName: UserRoleName): void {
  if (roleName !== UserRoleName.ORGANIZER) {
    throw new AppError(403, 'Organizer access required');
  }
}
