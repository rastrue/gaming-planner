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
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const prisma = new PrismaClient();
const SEED_PASSWORD = 'Password123!';

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

  const organizerAlice = await prisma.user.create({
    data: {
      username: 'org_alice',
      email: 'alice.organizer@questsync.test',
      passwordHash,
      displayName: 'Alice Organizer',
      roleId: organizerRole.id,
    },
  });

  const organizerBob = await prisma.user.create({
    data: {
      username: 'org_bob',
      email: 'bob.organizer@questsync.test',
      passwordHash,
      displayName: 'Bob Organizer',
      roleId: organizerRole.id,
    },
  });

  const playerCarol = await prisma.user.create({
    data: {
      username: 'player_carol',
      email: 'carol.player@questsync.test',
      passwordHash,
      displayName: 'Carol Player',
      roleId: playerRole.id,
    },
  });

  const playerDave = await prisma.user.create({
    data: {
      username: 'player_dave',
      email: 'dave.player@questsync.test',
      passwordHash,
      displayName: 'Dave Player',
      roleId: playerRole.id,
    },
  });

  const playerEve = await prisma.user.create({
    data: {
      username: 'player_eve',
      email: 'eve.player@questsync.test',
      passwordHash,
      displayName: 'Eve Player',
      roleId: playerRole.id,
    },
  });

  const games = await Promise.all([
    prisma.game.create({
      data: {
        slug: 'aether-raids',
        title: 'Aether Raids Online',
        genre: GameGenre.MMORPG,
        platform: 'PC',
      },
    }),
    prisma.game.create({
      data: {
        slug: 'neon-siege',
        title: 'Neon Siege',
        genre: GameGenre.FPS,
        platform: 'PC',
      },
    }),
    prisma.game.create({
      data: {
        slug: 'rift-tactics',
        title: 'Rift Tactics',
        genre: GameGenre.MOBA,
        platform: 'PC',
      },
    }),
    prisma.game.create({
      data: {
        slug: 'starforge-colony',
        title: 'Starforge Colony',
        genre: GameGenre.SURVIVAL,
        platform: 'PC',
      },
    }),
  ]);

  const now = new Date();
  const inDays = (days: number, hours = 18) => {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    date.setHours(hours, 0, 0, 0);
    return date;
  };

  const events = await Promise.all([
    prisma.event.create({
      data: {
        gameId: games[0].id,
        organizerId: organizerAlice.id,
        title: 'Weekly Aether Raid',
        description: 'Coordinated raid night for core progression.',
        serverRegion: 'EU-West',
        scheduledStart: inDays(7),
        scheduledEnd: inDays(7, 22),
        registrationDeadline: inDays(6),
        maxPlayers: 8,
        status: EventStatus.OPEN,
      },
    }),
    prisma.event.create({
      data: {
        gameId: games[1].id,
        organizerId: organizerAlice.id,
        title: 'Neon Siege Scrim Block',
        description: 'Ranked practice session with role assignments.',
        serverRegion: 'NA-East',
        scheduledStart: inDays(10),
        scheduledEnd: inDays(10, 21),
        registrationDeadline: inDays(9),
        maxPlayers: 10,
        status: EventStatus.OPEN,
      },
    }),
    prisma.event.create({
      data: {
        gameId: games[2].id,
        organizerId: organizerBob.id,
        title: 'Rift Tactics Team Night',
        description: 'Draft-friendly team event for support and DPS roles.',
        serverRegion: 'EU-Central',
        scheduledStart: inDays(14),
        scheduledEnd: inDays(14, 23),
        registrationDeadline: inDays(13),
        maxPlayers: 6,
        status: EventStatus.DRAFT,
      },
    }),
    prisma.event.create({
      data: {
        gameId: games[3].id,
        organizerId: organizerBob.id,
        title: 'Starforge Survival Sprint',
        description: 'Completed colony run with attendance tracking.',
        serverRegion: 'NA-West',
        scheduledStart: inDays(-3),
        scheduledEnd: inDays(-3, 22),
        registrationDeadline: inDays(-5),
        maxPlayers: 4,
        status: EventStatus.COMPLETED,
      },
    }),
  ]);

  const slots = await Promise.all([
    prisma.eventSlot.create({
      data: {
        eventId: events[0].id,
        roleName: 'Tank',
        displayOrder: 1,
        requiredCount: 1,
      },
    }),
    prisma.eventSlot.create({
      data: {
        eventId: events[0].id,
        roleName: 'Healer',
        displayOrder: 2,
        requiredCount: 2,
      },
    }),
    prisma.eventSlot.create({
      data: {
        eventId: events[1].id,
        roleName: 'Entry',
        displayOrder: 1,
        requiredCount: 2,
      },
    }),
    prisma.eventSlot.create({
      data: {
        eventId: events[1].id,
        roleName: 'Support',
        displayOrder: 2,
        requiredCount: 2,
      },
    }),
    prisma.eventSlot.create({
      data: {
        eventId: events[2].id,
        roleName: 'Captain',
        displayOrder: 1,
        requiredCount: 1,
      },
    }),
    prisma.eventSlot.create({
      data: {
        eventId: events[2].id,
        roleName: 'Flex',
        displayOrder: 2,
        requiredCount: 2,
      },
    }),
    prisma.eventSlot.create({
      data: {
        eventId: events[3].id,
        roleName: 'Builder',
        displayOrder: 1,
        requiredCount: 1,
      },
    }),
    prisma.eventSlot.create({
      data: {
        eventId: events[3].id,
        roleName: 'Scout',
        displayOrder: 2,
        requiredCount: 1,
      },
    }),
  ]);

  await Promise.all([
    prisma.registration.create({
      data: {
        eventId: events[0].id,
        userId: playerCarol.id,
        eventSlotId: slots[0].id,
        requestedRoleName: 'Tank',
        status: RegistrationStatus.APPROVED,
      },
    }),
    prisma.registration.create({
      data: {
        eventId: events[0].id,
        userId: playerDave.id,
        eventSlotId: slots[1].id,
        requestedRoleName: 'Healer',
        status: RegistrationStatus.APPROVED,
      },
    }),
    prisma.registration.create({
      data: {
        eventId: events[0].id,
        userId: playerEve.id,
        requestedRoleName: 'Healer',
        status: RegistrationStatus.PENDING,
      },
    }),
    prisma.registration.create({
      data: {
        eventId: events[1].id,
        userId: playerCarol.id,
        requestedRoleName: 'Entry',
        status: RegistrationStatus.APPROVED,
      },
    }),
    prisma.registration.create({
      data: {
        eventId: events[1].id,
        userId: playerDave.id,
        requestedRoleName: 'Support',
        status: RegistrationStatus.DECLINED,
      },
    }),
    prisma.registration.create({
      data: {
        eventId: events[3].id,
        userId: playerEve.id,
        eventSlotId: slots[7].id,
        requestedRoleName: 'Scout',
        status: RegistrationStatus.APPROVED,
        attendanceStatus: AttendanceStatus.PRESENT,
      },
    }),
  ]);

  await Promise.all([
    prisma.availabilityWindow.create({
      data: {
        userId: playerCarol.id,
        dayOfWeek: 1,
        startMinute: 18 * 60,
        endMinute: 22 * 60,
        timezone: 'Europe/Berlin',
      },
    }),
    prisma.availabilityWindow.create({
      data: {
        userId: playerCarol.id,
        dayOfWeek: 5,
        startMinute: 19 * 60,
        endMinute: 23 * 60,
        timezone: 'Europe/Berlin',
      },
    }),
    prisma.availabilityWindow.create({
      data: {
        userId: playerDave.id,
        dayOfWeek: 2,
        startMinute: 17 * 60,
        endMinute: 21 * 60,
        timezone: 'America/New_York',
      },
    }),
    prisma.availabilityWindow.create({
      data: {
        userId: playerDave.id,
        dayOfWeek: 4,
        startMinute: 20 * 60,
        endMinute: 24 * 60,
        timezone: 'America/New_York',
      },
    }),
    prisma.availabilityWindow.create({
      data: {
        userId: playerEve.id,
        dayOfWeek: 6,
        startMinute: 14 * 60,
        endMinute: 20 * 60,
        timezone: 'America/Los_Angeles',
      },
    }),
    prisma.availabilityWindow.create({
      data: {
        userId: playerEve.id,
        dayOfWeek: 0,
        startMinute: 16 * 60,
        endMinute: 22 * 60,
        timezone: 'America/Los_Angeles',
      },
    }),
  ]);

  await Promise.all([
    prisma.reportRequest.create({
      data: {
        requestedByUserId: organizerAlice.id,
        eventId: events[3].id,
        reportKind: ReportKind.EVENT_ATTENDANCE,
        outputFormat: ReportFormat.PDF,
        deliveryChannel: DeliveryChannel.DOWNLOAD,
        status: ReportStatus.GENERATED,
        fileName: 'event-attendance-starforge.pdf',
        storagePath: 'reports/event-attendance-starforge.pdf',
        generatedAt: new Date(),
      },
    }),
    prisma.reportRequest.create({
      data: {
        requestedByUserId: organizerBob.id,
        subjectUserId: playerCarol.id,
        reportKind: ReportKind.PLAYER_PARTICIPATION,
        outputFormat: ReportFormat.DOCX,
        deliveryChannel: DeliveryChannel.EMAIL,
        recipientEmail: 'carol.player@questsync.test',
        status: ReportStatus.QUEUED,
      },
    }),
  ]);

  console.log('QuestSync seed completed.');
  console.log(`Default password for seeded users: ${SEED_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
