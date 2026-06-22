import bcrypt from 'bcryptjs';
import {
  AttendanceStatus,
  DeliveryChannel,
  EventStatus,
  GameGenre,
  PrismaClient,
  RegistrationStatus,
  ReportFormat,
  ReportKind,
  ReportStatus,
  UserRoleName,
} from '@prisma/client';
import { resolveEventStatus } from '../src/lib/eventLifecycle.js';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const prisma = new PrismaClient();
const SEED_PASSWORD = 'Password123!';

const REGIONS = ['EU-West', 'EU-Central', 'NA-East', 'NA-West', 'Asia-Pacific', 'SA-South'];
const TIMEZONES = ['Europe/Berlin', 'Europe/London', 'America/New_York', 'America/Los_Angeles', 'Asia/Tokyo'];

const ROLE_TEMPLATES: Record<GameGenre, string[]> = {
  [GameGenre.MMORPG]: ['Tank', 'Healer', 'DPS', 'Support'],
  [GameGenre.MOBA]: ['Captain', 'Flex', 'Support', 'Carry'],
  [GameGenre.FPS]: ['Entry', 'Support', 'Anchor', 'Flex'],
  [GameGenre.RPG]: ['Leader', 'Support', 'Scout', 'Specialist'],
  [GameGenre.SURVIVAL]: ['Builder', 'Scout', 'Gatherer', 'Guard'],
  [GameGenre.STRATEGY]: ['Commander', 'Economy', 'Scout', 'Defense'],
  [GameGenre.SPORTS]: ['Captain', 'Striker', 'Defender', 'Goalkeeper'],
  [GameGenre.OTHER]: ['Lead', 'Support', 'Flex', 'Reserve'],
};

const GAME_DEFINITIONS: Array<{ slug: string; title: string; genre: GameGenre; platform: string; isActive?: boolean }> = [
  { slug: 'aether-raids', title: 'Aether Raids Online', genre: GameGenre.MMORPG, platform: 'PC' },
  { slug: 'neon-siege', title: 'Neon Siege', genre: GameGenre.FPS, platform: 'PC' },
  { slug: 'rift-tactics', title: 'Rift Tactics', genre: GameGenre.MOBA, platform: 'PC' },
  { slug: 'starforge-colony', title: 'Starforge Colony', genre: GameGenre.SURVIVAL, platform: 'PC' },
  { slug: 'iron-legion', title: 'Iron Legion Tactics', genre: GameGenre.STRATEGY, platform: 'PC' },
  { slug: 'crystal-quest', title: 'Crystal Quest Saga', genre: GameGenre.RPG, platform: 'PC' },
  { slug: 'velocity-cup', title: 'Velocity Cup', genre: GameGenre.SPORTS, platform: 'PC' },
  { slug: 'void-runners', title: 'Void Runners', genre: GameGenre.FPS, platform: 'PC' },
  { slug: 'elder-realms', title: 'Elder Realms', genre: GameGenre.MMORPG, platform: 'PC' },
  { slug: 'nexus-clash', title: 'Nexus Clash', genre: GameGenre.MOBA, platform: 'PC' },
  { slug: 'frontier-outpost', title: 'Frontier Outpost', genre: GameGenre.SURVIVAL, platform: 'PC' },
  { slug: 'arcade-legends', title: 'Arcade Legends', genre: GameGenre.OTHER, platform: 'PC' },
  { slug: 'storm-grid', title: 'Storm Grid', genre: GameGenre.STRATEGY, platform: 'PC' },
  { slug: 'mythic-chronicles', title: 'Mythic Chronicles', genre: GameGenre.RPG, platform: 'PC' },
  { slug: 'retro-rally', title: 'Retro Rally League', genre: GameGenre.SPORTS, platform: 'PC', isActive: false },
];

const EVENT_STATUS_WEIGHTS: Array<{ status: EventStatus; weight: number }> = [
  { status: EventStatus.REGISTRATION, weight: 38 },
  { status: EventStatus.WAITING, weight: 12 },
  { status: EventStatus.STARTED, weight: 10 },
  { status: EventStatus.COMPLETED, weight: 28 },
  { status: EventStatus.CANCELLED, weight: 12 },
];

const EVENT_TITLE_PREFIXES = [
  'Weekly',
  'Weekend',
  'Community',
  'Ranked',
  'Casual',
  'Progression',
  'Scrim',
  'Tournament',
  'Practice',
  'Charity',
];

function pickOne<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function pickMany<T>(items: T[], count: number): T[] {
  const copy = [...items];
  const result: T[] = [];
  while (result.length < count && copy.length > 0) {
    const index = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(index, 1)[0]!);
  }
  return result;
}

function weightedStatus(): EventStatus {
  const total = EVENT_STATUS_WEIGHTS.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;

  for (const item of EVENT_STATUS_WEIGHTS) {
    roll -= item.weight;
    if (roll <= 0) {
      return item.status;
    }
  }

  return EventStatus.REGISTRATION;
}

function inDays(base: Date, days: number, startHour = 18, durationHours = 4): {
  scheduledStart: Date;
  scheduledEnd: Date;
  registrationDeadline: Date;
} {
  const scheduledStart = new Date(base);
  scheduledStart.setDate(scheduledStart.getDate() + days);
  scheduledStart.setHours(startHour, 0, 0, 0);

  const scheduledEnd = new Date(scheduledStart);
  scheduledEnd.setHours(scheduledStart.getHours() + durationHours);

  const registrationDeadline = new Date(scheduledStart.getTime() - 60 * 60 * 1000);

  return { scheduledStart, scheduledEnd, registrationDeadline };
}

function statusDayOffset(status: EventStatus, index: number): number {
  switch (status) {
    case EventStatus.COMPLETED:
      return -((index % 45) + 3);
    case EventStatus.CANCELLED:
      return -((index % 20) + 1);
    case EventStatus.STARTED:
      return -((index % 8) + 1);
    case EventStatus.WAITING:
      return (index % 5) + 1;
    case EventStatus.REGISTRATION:
      return (index % 30) + 3;
    default:
      return (index % 25) + 5;
  }
}

async function main() {
  await prisma.reportRequest.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.eventSlot.deleteMany();
  await prisma.event.deleteMany();
  await prisma.availabilityWindow.deleteMany();
  await prisma.game.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  const now = new Date();

  const organizerRole = await prisma.role.create({
    data: {
      name: UserRoleName.ORGANIZER,
      description: 'Creates and manages multiplayer game events',
    },
  });

  const playerRole = await prisma.role.create({
    data: {
      name: UserRoleName.PLAYER,
      description: 'Discovers events and registers to participate',
    },
  });

  const coreUsers = await Promise.all([
    prisma.user.create({
      data: {
        username: 'org_alice',
        email: 'alice.organizer@questsync.test',
        passwordHash,
        displayName: 'Alice Organizer',
        roleId: organizerRole.id,
      },
    }),
    prisma.user.create({
      data: {
        username: 'org_bob',
        email: 'bob.organizer@questsync.test',
        passwordHash,
        displayName: 'Bob Organizer',
        roleId: organizerRole.id,
      },
    }),
    prisma.user.create({
      data: {
        username: 'player_carol',
        email: 'carol.player@questsync.test',
        passwordHash,
        displayName: 'Carol Player',
        roleId: playerRole.id,
      },
    }),
    prisma.user.create({
      data: {
        username: 'player_dave',
        email: 'dave.player@questsync.test',
        passwordHash,
        displayName: 'Dave Player',
        roleId: playerRole.id,
      },
    }),
    prisma.user.create({
      data: {
        username: 'player_eve',
        email: 'eve.player@questsync.test',
        passwordHash,
        displayName: 'Eve Player',
        roleId: playerRole.id,
      },
    }),
  ]);

  const extraOrganizers = await Promise.all(
    Array.from({ length: 4 }, (_, index) =>
      prisma.user.create({
        data: {
          username: `org_${String(index + 3).padStart(2, '0')}`,
          email: `organizer${index + 3}@questsync.test`,
          passwordHash,
          displayName: `Organizer ${index + 3}`,
          roleId: organizerRole.id,
        },
      }),
    ),
  );

  const extraPlayers = await Promise.all(
    Array.from({ length: 25 }, (_, index) =>
      prisma.user.create({
        data: {
          username: `player_${String(index + 6).padStart(2, '0')}`,
          email: `player${index + 6}@questsync.test`,
          passwordHash,
          displayName: `Player ${index + 6}`,
          roleId: playerRole.id,
          isActive: index !== 24,
        },
      }),
    ),
  );

  const organizers = [...coreUsers.slice(0, 2), ...extraOrganizers];
  const players = [...coreUsers.slice(2), ...extraPlayers];

  const games = await Promise.all(
    GAME_DEFINITIONS.map((game) =>
      prisma.game.create({
        data: {
          slug: game.slug,
          title: game.title,
          genre: game.genre,
          platform: game.platform,
          isActive: game.isActive ?? true,
        },
      }),
    ),
  );

  const eventCount = 72;
  const events = [];

  for (let index = 0; index < eventCount; index += 1) {
    const game = games[index % games.length]!;
    const organizer = organizers[index % organizers.length]!;
    const status = weightedStatus();
    const dayOffset = statusDayOffset(status, index);
    const startHour = 16 + (index % 5);
    const durationHours = 3 + (index % 3);
    const schedule = inDays(now, dayOffset, startHour, durationHours);
    const prefix = EVENT_TITLE_PREFIXES[index % EVENT_TITLE_PREFIXES.length]!;

    const event = await prisma.event.create({
      data: {
        gameId: game.id,
        organizerId: organizer.id,
        title: `${prefix} ${game.title} #${index + 1}`,
        description: `Тестовое событие для ${game.title}. Статус: ${status}. Слоты и регистрации сгенерированы автоматически.`,
        serverRegion: REGIONS[index % REGIONS.length]!,
        scheduledStart: schedule.scheduledStart,
        scheduledEnd: schedule.scheduledEnd,
        registrationDeadline: schedule.registrationDeadline,
        maxPlayers: 6 + (index % 9),
        status,
      },
    });

    events.push(event);
  }

  const slotsByEventId = new Map<number, Array<{ id: number; roleName: string; requiredCount: number }>>();

  for (const event of events) {
    const game = games.find((item) => item.id === event.gameId)!;
    const roleNames = ROLE_TEMPLATES[game.genre].slice(0, 2 + (event.id % 3));
    const createdSlots = [];

    for (let order = 0; order < roleNames.length; order += 1) {
      const slot = await prisma.eventSlot.create({
        data: {
          eventId: event.id,
          roleName: roleNames[order]!,
          displayOrder: order + 1,
          requiredCount: 1 + (order % 2),
        },
      });
      createdSlots.push(slot);
    }

    slotsByEventId.set(event.id, createdSlots);
  }

  const registrationStatuses = [
    RegistrationStatus.PENDING,
    RegistrationStatus.APPROVED,
    RegistrationStatus.DECLINED,
    RegistrationStatus.CANCELLED,
  ];

  let registrationCount = 0;

  for (const event of events) {
    if (event.status === EventStatus.CANCELLED) {
      continue;
    }

    const slots = slotsByEventId.get(event.id) ?? [];
    const targetApproved =
      event.status === EventStatus.COMPLETED
        ? Math.min(event.maxPlayers, 3 + (event.id % 4))
        : event.status === EventStatus.REGISTRATION && event.id % 9 === 0
          ? event.maxPlayers
          : 1 + (event.id % 4);

    const eventPlayers = pickMany(players, Math.min(targetApproved, players.length));

    for (let playerIndex = 0; playerIndex < eventPlayers.length; playerIndex += 1) {
      const player = eventPlayers[playerIndex]!;
      const slot = slots[playerIndex % Math.max(slots.length, 1)];
      let status: RegistrationStatus;

      if (event.status === EventStatus.COMPLETED || playerIndex < targetApproved) {
        status = RegistrationStatus.APPROVED;
      } else {
        status = registrationStatuses[(event.id + playerIndex) % registrationStatuses.length]!;
        if (status === RegistrationStatus.APPROVED) {
          status = RegistrationStatus.PENDING;
        }
      }

      let attendanceStatus = AttendanceStatus.NOT_MARKED;
      if (event.status === EventStatus.COMPLETED && status === RegistrationStatus.APPROVED) {
        attendanceStatus =
          (event.id + playerIndex) % 5 === 0 ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT;
      }

      await prisma.registration.create({
        data: {
          eventId: event.id,
          userId: player.id,
          eventSlotId: status === RegistrationStatus.APPROVED && slot ? slot.id : undefined,
          requestedRoleName: slot?.roleName ?? pickOne(ROLE_TEMPLATES[games.find((g) => g.id === event.gameId)!.genre]),
          status,
          attendanceStatus,
        },
      });

      registrationCount += 1;
    }
  }

  for (const event of events) {
    if (event.status === EventStatus.CANCELLED || event.status === EventStatus.COMPLETED) {
      continue;
    }

    const approvedRegistrationCount = await prisma.registration.count({
      where: {
        eventId: event.id,
        status: RegistrationStatus.APPROVED,
      },
    });

    const resolvedStatus = resolveEventStatus({
      status: event.status,
      registrationDeadline: event.registrationDeadline,
      scheduledStart: event.scheduledStart,
      maxPlayers: event.maxPlayers,
      approvedRegistrationCount,
    });

    if (resolvedStatus !== event.status) {
      await prisma.event.update({
        where: { id: event.id },
        data: { status: resolvedStatus },
      });
    }
  }

  let availabilityCount = 0;

  for (const player of players) {
    const windowCount = 2 + (player.id % 3);
    const usedDays = new Set<number>();

    for (let windowIndex = 0; windowIndex < windowCount; windowIndex += 1) {
      let dayOfWeek = (player.id + windowIndex * 2) % 7;
      while (usedDays.has(dayOfWeek)) {
        dayOfWeek = (dayOfWeek + 1) % 7;
      }
      usedDays.add(dayOfWeek);

      const startHour = 16 + ((player.id + windowIndex) % 4);
      await prisma.availabilityWindow.create({
        data: {
          userId: player.id,
          dayOfWeek,
          startMinute: startHour * 60,
          endMinute: (startHour + 3) * 60,
          timezone: TIMEZONES[(player.id + windowIndex) % TIMEZONES.length]!,
        },
      });
      availabilityCount += 1;
    }
  }

  const completedEvents = events.filter((event) => event.status === EventStatus.COMPLETED);
  const reportStatuses = [ReportStatus.QUEUED, ReportStatus.GENERATED, ReportStatus.EMAILED, ReportStatus.FAILED];
  let reportCount = 0;

  for (let index = 0; index < 18; index += 1) {
    const organizer = organizers[index % organizers.length]!;
    const player = players[index % players.length]!;
    const event = completedEvents[index % Math.max(completedEvents.length, 1)] ?? events[index % events.length]!;
    const reportKind = index % 2 === 0 ? ReportKind.EVENT_ATTENDANCE : ReportKind.PLAYER_PARTICIPATION;
    const outputFormat = index % 2 === 0 ? ReportFormat.PDF : ReportFormat.DOCX;
    const deliveryChannel = index % 3 === 0 ? DeliveryChannel.EMAIL : DeliveryChannel.DOWNLOAD;
    const status = reportStatuses[index % reportStatuses.length]!;
    const generated = status === ReportStatus.GENERATED || status === ReportStatus.EMAILED;

    await prisma.reportRequest.create({
      data: {
        requestedByUserId: organizer.id,
        subjectUserId: reportKind === ReportKind.PLAYER_PARTICIPATION ? player.id : undefined,
        eventId: reportKind === ReportKind.EVENT_ATTENDANCE ? event.id : undefined,
        periodStart: reportKind === ReportKind.PLAYER_PARTICIPATION ? inDays(now, -30).scheduledStart : undefined,
        periodEnd: reportKind === ReportKind.PLAYER_PARTICIPATION ? inDays(now, -1).scheduledStart : undefined,
        reportKind,
        outputFormat,
        deliveryChannel,
        recipientEmail: deliveryChannel === DeliveryChannel.EMAIL ? player.email : undefined,
        status,
        fileName: generated ? `report-${index + 1}.${outputFormat.toLowerCase()}` : undefined,
        storagePath: generated ? `reports/report-${index + 1}.${outputFormat.toLowerCase()}` : undefined,
        generatedAt: generated ? new Date(now.getTime() - index * 3_600_000) : undefined,
        emailedAt: status === ReportStatus.EMAILED ? new Date(now.getTime() - index * 1_800_000) : undefined,
        failedReason: status === ReportStatus.FAILED ? 'SMTP connection timed out during seed simulation' : undefined,
      },
    });
    reportCount += 1;
  }

  console.log('QuestSync seed completed.');
  console.log(`Default password for seeded users: ${SEED_PASSWORD}`);
  console.log(`Users: ${organizers.length} organizers, ${players.length} players`);
  console.log(`Games: ${games.length}`);
  console.log(`Events: ${events.length}`);
  console.log(`Registrations: ${registrationCount}`);
  console.log(`Availability windows: ${availabilityCount}`);
  console.log(`Report requests: ${reportCount}`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
