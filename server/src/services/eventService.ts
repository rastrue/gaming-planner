import { EventStatus, Prisma, RegistrationStatus, UserRoleName } from '@prisma/client';
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

export type EventRecord = Prisma.EventGetPayload<{ select: typeof eventSelect }> & {
  _count: {
    registrations: number;
    activeRegistrations: number;
    slots: number;
  };
};

interface RegistrationCounts {
  approved: number;
  active: number;
}

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
      { game: { title: { contains: query.search, mode: 'insensitive' } } },
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

async function loadRegistrationCounts(eventIds: number[]): Promise<Map<number, RegistrationCounts>> {
  const counts = new Map<number, RegistrationCounts>();

  for (const eventId of eventIds) {
    counts.set(eventId, { approved: 0, active: 0 });
  }

  if (eventIds.length === 0) {
    return counts;
  }

  const [approvedGroups, activeGroups] = await Promise.all([
    prisma.registration.groupBy({
      by: ['eventId'],
      where: {
        eventId: { in: eventIds },
        status: RegistrationStatus.APPROVED,
      },
      _count: { _all: true },
    }),
    prisma.registration.groupBy({
      by: ['eventId'],
      where: {
        eventId: { in: eventIds },
        status: { in: [RegistrationStatus.PENDING, RegistrationStatus.APPROVED] },
      },
      _count: { _all: true },
    }),
  ]);

  for (const group of approvedGroups) {
    counts.get(group.eventId)!.approved = group._count._all;
  }

  for (const group of activeGroups) {
    counts.get(group.eventId)!.active = group._count._all;
  }

  return counts;
}

function applyRegistrationCounts(
  event: Prisma.EventGetPayload<{ select: typeof eventSelect }>,
  registrationCounts: RegistrationCounts,
): EventRecord {
  return {
    ...event,
    _count: {
      slots: event._count.slots,
      registrations: registrationCounts.approved,
      activeRegistrations: registrationCounts.active,
    },
  };
}

async function syncEventLifecycle(
  event: EventRecord,
  approvedRegistrationCount = event._count.registrations,
): Promise<EventRecord> {
  const resolved = resolveEventStatus({
    status: event.status,
    registrationDeadline: event.registrationDeadline,
    scheduledStart: event.scheduledStart,
    maxPlayers: event.maxPlayers,
    approvedRegistrationCount,
  });

  const registrationCounts = {
    approved: approvedRegistrationCount,
    active: event._count.activeRegistrations,
  };

  if (resolved === event.status) {
    return {
      ...event,
      _count: {
        ...event._count,
        registrations: registrationCounts.approved,
      },
    };
  }

  const updated = await prisma.event.update({
    where: { id: event.id },
    data: { status: resolved },
    select: eventSelect,
  });

  return applyRegistrationCounts(updated, registrationCounts);
}

async function syncEvents(
  events: Prisma.EventGetPayload<{ select: typeof eventSelect }>[],
): Promise<EventRecord[]> {
  const countsMap = await loadRegistrationCounts(events.map((event) => event.id));

  return Promise.all(
    events.map(async (event) => {
      const registrationCounts = countsMap.get(event.id) ?? { approved: 0, active: 0 };
      const enriched = applyRegistrationCounts(event, registrationCounts);
      return syncEventLifecycle(enriched, registrationCounts.approved);
    }),
  );
}

export async function syncEventStatusForEvent(eventId: number): Promise<void> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: eventSelect,
  });

  if (!event) {
    return;
  }

  const registrationCounts = (await loadRegistrationCounts([eventId])).get(eventId) ?? {
    approved: 0,
    active: 0,
  };

  await syncEventLifecycle(applyRegistrationCounts(event, registrationCounts), registrationCounts.approved);
}

function assertAllowedStatusTransition(current: EventRecord, next: EventStatus): void {
  if (next === current.status) {
    return;
  }

  if (next === EventStatus.COMPLETED) {
    assertCanCompleteEvent(current.scheduledStart);

    if (!canCompleteEventStatus(current.status, current.scheduledStart)) {
      throw new AppError(409, 'Only events that are waiting or already in progress can be completed');
    }

    return;
  }

  if (next === EventStatus.CANCELLED) {
    assertCanCancelEvent(current.status);
    return;
  }

  throw new AppError(400, 'Invalid event status transition');
}

export async function listEvents(
  query: ListEventsQuery,
  availabilityUserId?: number,
): Promise<PaginatedEvents> {
  if (query.availabilityFit && !availabilityUserId) {
    throw new AppError(401, 'Authentication is required to filter by availability');
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
    throw new AppError(404, 'Event not found');
  }

  const registrationCounts = (await loadRegistrationCounts([id])).get(id) ?? {
    approved: 0,
    active: 0,
  };

  return syncEventLifecycle(applyRegistrationCounts(event, registrationCounts), registrationCounts.approved);
}

async function assertOrganizerOwnsEvent(eventId: number, organizerId: number): Promise<EventRecord> {
  const event = await getEventById(eventId);

  if (event.organizerId !== organizerId) {
    throw new AppError(403, 'You can only manage events you organize');
  }

  return event;
}

function assertCanCompleteEvent(scheduledStart: Date): void {
  if (scheduledStart.getTime() > Date.now()) {
    throw new AppError(
      409,
      'Cannot complete an event that has not started yet. Cancel it instead.',
    );
  }
}

function assertCanCancelEvent(currentStatus: EventStatus): void {
  if (!canCancelPublishedEvent(currentStatus)) {
    throw new AppError(409, 'Only events in registration or waiting status can be canceled');
  }
}

function assertEventIsEditable(status: EventStatus): void {
  if (status === EventStatus.COMPLETED || status === EventStatus.CANCELLED) {
    throw new AppError(409, 'Completed and canceled events cannot be modified');
  }
}

function assertEventDetailsEditable(event: EventRecord): void {
  if (event.status !== EventStatus.REGISTRATION || event._count.activeRegistrations > 0) {
    throw new AppError(
      409,
      'Only events in Registration status with no registered players can be edited',
    );
  }
}

export async function createEvent(
  input: CreateEventInput,
  organizerId: number,
): Promise<EventRecord> {
  const game = await prisma.game.findUnique({ where: { id: input.gameId } });

  if (!game || !game.isActive) {
    throw new AppError(400, 'Selected game is unavailable');
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

  const registrationCounts = { approved: 0, active: 0 };
  return syncEventLifecycle(applyRegistrationCounts(created, registrationCounts), 0);
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
      throw new AppError(400, 'Selected game is unavailable');
    }
  }

  if (input.scheduledStart || input.scheduledEnd) {
    const scheduledStart = input.scheduledStart ?? syncedCurrent.scheduledStart;
    const scheduledEnd = input.scheduledEnd ?? syncedCurrent.scheduledEnd;

    if (scheduledEnd <= scheduledStart) {
      throw new AppError(400, 'End time must be after start time');
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

  const registrationCounts = (await loadRegistrationCounts([id])).get(id) ?? {
    approved: 0,
    active: 0,
  };

  return syncEventLifecycle(applyRegistrationCounts(updated, registrationCounts), registrationCounts.approved);
}

export async function deleteEvent(id: number, organizerId: number): Promise<void> {
  await assertOrganizerOwnsEvent(id, organizerId);
  throw new AppError(
    409,
    'Events cannot be deleted. Cancel a published event to preserve history.',
  );
}

export function assertOrganizerRole(roleName: UserRoleName): void {
  if (roleName !== UserRoleName.ORGANIZER) {
    throw new AppError(403, 'Organizer privileges are required');
  }
}
