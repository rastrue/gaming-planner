import {
  AttendanceStatus,
  EventStatus,
  RegistrationStatus,
  ReportFormat,
  ReportKind,
} from '@prisma/client';
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
} from 'docx';
import { jsPDF } from 'jspdf';
import autoTableModule from 'jspdf-autotable';

type AutoTableFn = (doc: jsPDF, options: Record<string, unknown>) => void;

function resolveAutoTable(module: unknown): AutoTableFn {
  if (typeof module === 'function') {
    return module as AutoTableFn;
  }

  const nestedDefault = (module as { default?: unknown }).default;
  if (typeof nestedDefault === 'function') {
    return nestedDefault as AutoTableFn;
  }

  throw new Error('Экспорт jspdf-autotable недоступен');
}

const autoTable = resolveAutoTable(autoTableModule);

interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: { finalY: number };
}
import prisma from './prisma.js';

export interface EventAttendanceReportData {
  title: string;
  gameTitle: string;
  organizerName: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  status: EventStatus;
  slots: Array<{ roleName: string; requiredCount: number }>;
  registrations: Array<{
    playerName: string;
    status: RegistrationStatus;
    assignedSlot: string;
    attendanceStatus: AttendanceStatus;
  }>;
  metrics: {
    totalRegistrations: number;
    approvedCount: number;
    declinedCount: number;
    presentCount: number;
    absentCount: number;
    fillRate: number;
  };
}

export interface PlayerParticipationReportData {
  playerName: string;
  username: string;
  email: string;
  availability: Array<{
    dayOfWeek: number;
    startMinute: number;
    endMinute: number;
    timezone: string;
  }>;
  registrations: Array<{
    eventTitle: string;
    gameTitle: string;
    scheduledStart: Date;
    status: RegistrationStatus;
    assignedSlot: string;
    attendanceStatus: AttendanceStatus;
  }>;
  metrics: {
    totalRegistrations: number;
    approvedRegistrations: number;
    completedEvents: number;
    attendanceRate: number;
  };
}

function formatDateTime(date: Date): string {
  return date.toISOString().replace('T', ' ').slice(0, 16);
}

function formatMinutes(minute: number): string {
  const hours = Math.floor(minute / 60);
  const mins = minute % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export async function loadEventAttendanceData(eventId: number): Promise<EventAttendanceReportData> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      game: true,
      organizer: { select: { displayName: true } },
      slots: { orderBy: { displayOrder: 'asc' } },
      registrations: {
        include: {
          user: { select: { displayName: true } },
          eventSlot: { select: { roleName: true } },
        },
        orderBy: { joinedAt: 'asc' },
      },
    },
  });

  if (!event) {
    throw new Error('Событие не найдено');
  }

  const approved = event.registrations.filter((r) => r.status === RegistrationStatus.APPROVED);
  const requiredCapacity = event.slots.reduce((sum, slot) => sum + slot.requiredCount, 0);
  const assignedApproved = approved.filter((r) => r.eventSlotId !== null).length;

  return {
    title: event.title,
    gameTitle: event.game.title,
    organizerName: event.organizer.displayName,
    scheduledStart: event.scheduledStart,
    scheduledEnd: event.scheduledEnd,
    status: event.status,
    slots: event.slots.map((slot) => ({
      roleName: slot.roleName,
      requiredCount: slot.requiredCount,
    })),
    registrations: event.registrations.map((registration) => ({
      playerName: registration.user.displayName,
      status: registration.status,
      assignedSlot: registration.eventSlot?.roleName ?? 'Unassigned',
      attendanceStatus: registration.attendanceStatus,
    })),
    metrics: {
      totalRegistrations: event.registrations.length,
      approvedCount: approved.length,
      declinedCount: event.registrations.filter((r) => r.status === RegistrationStatus.DECLINED)
        .length,
      presentCount: approved.filter((r) => r.attendanceStatus === AttendanceStatus.PRESENT).length,
      absentCount: approved.filter((r) => r.attendanceStatus === AttendanceStatus.ABSENT).length,
      fillRate: requiredCapacity > 0 ? assignedApproved / requiredCapacity : 0,
    },
  };
}

export async function loadPlayerParticipationData(
  subjectUserId: number,
  periodStart?: Date,
  periodEnd?: Date,
): Promise<PlayerParticipationReportData> {
  const user = await prisma.user.findUnique({
    where: { id: subjectUserId },
    select: {
      displayName: true,
      username: true,
      email: true,
      availabilityWindows: {
        orderBy: [{ dayOfWeek: 'asc' }, { startMinute: 'asc' }],
      },
      registrations: {
        where: {
          ...(periodStart || periodEnd
            ? {
                event: {
                  scheduledStart: {
                    ...(periodStart ? { gte: periodStart } : {}),
                    ...(periodEnd ? { lte: periodEnd } : {}),
                  },
                },
              }
            : {}),
        },
        include: {
          event: {
            include: { game: true },
          },
          eventSlot: { select: { roleName: true } },
        },
        orderBy: { joinedAt: 'desc' },
      },
    },
  });

  if (!user) {
    throw new Error('Игрок не найден');
  }

  const approved = user.registrations.filter((r) => r.status === RegistrationStatus.APPROVED);
  const completed = approved.filter((r) => r.event.status === EventStatus.COMPLETED);
  const marked = completed.filter(
    (r) =>
      r.attendanceStatus === AttendanceStatus.PRESENT ||
      r.attendanceStatus === AttendanceStatus.ABSENT,
  );
  const present = marked.filter((r) => r.attendanceStatus === AttendanceStatus.PRESENT);

  return {
    playerName: user.displayName,
    username: user.username,
    email: user.email,
    availability: user.availabilityWindows.map((window) => ({
      dayOfWeek: window.dayOfWeek,
      startMinute: window.startMinute,
      endMinute: window.endMinute,
      timezone: window.timezone,
    })),
    registrations: user.registrations.map((registration) => ({
      eventTitle: registration.event.title,
      gameTitle: registration.event.game.title,
      scheduledStart: registration.event.scheduledStart,
      status: registration.status,
      assignedSlot: registration.eventSlot?.roleName ?? 'Unassigned',
      attendanceStatus: registration.attendanceStatus,
    })),
    metrics: {
      totalRegistrations: user.registrations.length,
      approvedRegistrations: approved.length,
      completedEvents: completed.length,
      attendanceRate: marked.length > 0 ? present.length / marked.length : 0,
    },
  };
}

function buildEventPdf(data: EventAttendanceReportData): Buffer {
  const doc = new jsPDF();
  let y = 15;

  doc.setFontSize(16);
  doc.text('Event Attendance Report', 14, y);
  y += 10;
  doc.setFontSize(11);
  doc.text(`Event: ${data.title}`, 14, y);
  y += 6;
  doc.text(`Game: ${data.gameTitle}`, 14, y);
  y += 6;
  doc.text(`Organizer: ${data.organizerName}`, 14, y);
  y += 6;
  doc.text(`Schedule: ${formatDateTime(data.scheduledStart)} - ${formatDateTime(data.scheduledEnd)}`, 14, y);
  y += 6;
  doc.text(`Status: ${data.status}`, 14, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [['Role', 'Required Count']],
    body: data.slots.map((slot) => [slot.roleName, String(slot.requiredCount)]),
  });

  y = (doc as jsPDFWithAutoTable).lastAutoTable.finalY + 8;

  autoTable(doc, {
    startY: y,
    head: [['Player', 'Registration Status', 'Assigned Slot', 'Attendance']],
    body: data.registrations.map((row) => [
      row.playerName,
      row.status,
      row.assignedSlot,
      row.attendanceStatus,
    ]),
  });

  y = (doc as jsPDFWithAutoTable).lastAutoTable.finalY + 8;
  doc.text(`Total registrations: ${data.metrics.totalRegistrations}`, 14, y);
  y += 6;
  doc.text(`Approved: ${data.metrics.approvedCount}`, 14, y);
  y += 6;
  doc.text(`Declined: ${data.metrics.declinedCount}`, 14, y);
  y += 6;
  doc.text(`Present: ${data.metrics.presentCount}`, 14, y);
  y += 6;
  doc.text(`Absent: ${data.metrics.absentCount}`, 14, y);
  y += 6;
  doc.text(`Fill rate: ${(data.metrics.fillRate * 100).toFixed(1)}%`, 14, y);

  return Buffer.from(doc.output('arraybuffer'));
}

function buildPlayerPdf(data: PlayerParticipationReportData): Buffer {
  const doc = new jsPDF();
  let y = 15;

  doc.setFontSize(16);
  doc.text('Player Participation Report', 14, y);
  y += 10;
  doc.setFontSize(11);
  doc.text(`Player: ${data.playerName} (@${data.username})`, 14, y);
  y += 6;
  doc.text(`Email: ${data.email}`, 14, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [['Day', 'Start', 'End', 'Timezone']],
    body: data.availability.map((window) => [
      dayNames[window.dayOfWeek] ?? String(window.dayOfWeek),
      formatMinutes(window.startMinute),
      formatMinutes(window.endMinute),
      window.timezone,
    ]),
  });

  y = (doc as jsPDFWithAutoTable).lastAutoTable.finalY + 8;

  autoTable(doc, {
    startY: y,
    head: [['Event', 'Game', 'Scheduled Start', 'Status', 'Slot', 'Attendance']],
    body: data.registrations.map((row) => [
      row.eventTitle,
      row.gameTitle,
      formatDateTime(row.scheduledStart),
      row.status,
      row.assignedSlot,
      row.attendanceStatus,
    ]),
  });

  y = (doc as jsPDFWithAutoTable).lastAutoTable.finalY + 8;
  doc.text(`Total registrations: ${data.metrics.totalRegistrations}`, 14, y);
  y += 6;
  doc.text(`Approved registrations: ${data.metrics.approvedRegistrations}`, 14, y);
  y += 6;
  doc.text(`Completed events: ${data.metrics.completedEvents}`, 14, y);
  y += 6;
  doc.text(`Attendance rate: ${(data.metrics.attendanceRate * 100).toFixed(1)}%`, 14, y);

  return Buffer.from(doc.output('arraybuffer'));
}

function tableRow(cells: string[]): TableRow {
  return new TableRow({
    children: cells.map(
      (cell) =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun(cell)] })],
        }),
    ),
  });
}

async function buildEventDocx(data: EventAttendanceReportData): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: 'Event Attendance Report', heading: HeadingLevel.HEADING_1 }),
          new Paragraph(`Event: ${data.title}`),
          new Paragraph(`Game: ${data.gameTitle}`),
          new Paragraph(`Organizer: ${data.organizerName}`),
          new Paragraph(
            `Schedule: ${formatDateTime(data.scheduledStart)} - ${formatDateTime(data.scheduledEnd)}`,
          ),
          new Paragraph(`Status: ${data.status}`),
          new Paragraph({ text: 'Event Slots', heading: HeadingLevel.HEADING_2 }),
          new Table({
            rows: [
              tableRow(['Role', 'Required Count']),
              ...data.slots.map((slot) => tableRow([slot.roleName, String(slot.requiredCount)])),
            ],
          }),
          new Paragraph({ text: 'Registrations', heading: HeadingLevel.HEADING_2 }),
          new Table({
            rows: [
              tableRow(['Player', 'Registration Status', 'Assigned Slot', 'Attendance']),
              ...data.registrations.map((row) =>
                tableRow([row.playerName, row.status, row.assignedSlot, row.attendanceStatus]),
              ),
            ],
          }),
          new Paragraph({ text: 'Summary Metrics', heading: HeadingLevel.HEADING_2 }),
          new Paragraph(`Total registrations: ${data.metrics.totalRegistrations}`),
          new Paragraph(`Approved: ${data.metrics.approvedCount}`),
          new Paragraph(`Declined: ${data.metrics.declinedCount}`),
          new Paragraph(`Present: ${data.metrics.presentCount}`),
          new Paragraph(`Absent: ${data.metrics.absentCount}`),
          new Paragraph(`Fill rate: ${(data.metrics.fillRate * 100).toFixed(1)}%`),
        ],
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

async function buildPlayerDocx(data: PlayerParticipationReportData): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: 'Player Participation Report', heading: HeadingLevel.HEADING_1 }),
          new Paragraph(`Player: ${data.playerName} (@${data.username})`),
          new Paragraph(`Email: ${data.email}`),
          new Paragraph({ text: 'Weekly Availability', heading: HeadingLevel.HEADING_2 }),
          new Table({
            rows: [
              tableRow(['Day', 'Start', 'End', 'Timezone']),
              ...data.availability.map((window) =>
                tableRow([
                  dayNames[window.dayOfWeek] ?? String(window.dayOfWeek),
                  formatMinutes(window.startMinute),
                  formatMinutes(window.endMinute),
                  window.timezone,
                ]),
              ),
            ],
          }),
          new Paragraph({ text: 'Event Registrations', heading: HeadingLevel.HEADING_2 }),
          new Table({
            rows: [
              tableRow(['Event', 'Game', 'Scheduled Start', 'Status', 'Slot', 'Attendance']),
              ...data.registrations.map((row) =>
                tableRow([
                  row.eventTitle,
                  row.gameTitle,
                  formatDateTime(row.scheduledStart),
                  row.status,
                  row.assignedSlot,
                  row.attendanceStatus,
                ]),
              ),
            ],
          }),
          new Paragraph({ text: 'Summary Metrics', heading: HeadingLevel.HEADING_2 }),
          new Paragraph(`Total registrations: ${data.metrics.totalRegistrations}`),
          new Paragraph(`Approved registrations: ${data.metrics.approvedRegistrations}`),
          new Paragraph(`Completed events: ${data.metrics.completedEvents}`),
          new Paragraph(`Attendance rate: ${(data.metrics.attendanceRate * 100).toFixed(1)}%`),
        ],
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

export async function generateReportBuffer(
  reportKind: ReportKind,
  outputFormat: ReportFormat,
  options: {
    eventId?: number;
    subjectUserId?: number;
    periodStart?: Date;
    periodEnd?: Date;
  },
): Promise<Buffer> {
  if (reportKind === ReportKind.EVENT_ATTENDANCE) {
    const data = await loadEventAttendanceData(options.eventId!);
    return outputFormat === ReportFormat.PDF ? buildEventPdf(data) : buildEventDocx(data);
  }

  const data = await loadPlayerParticipationData(
    options.subjectUserId!,
    options.periodStart,
    options.periodEnd,
  );
  return outputFormat === ReportFormat.PDF ? buildPlayerPdf(data) : buildPlayerDocx(data);
}

export function getReportMimeType(format: ReportFormat): string {
  return format === ReportFormat.PDF
    ? 'application/pdf'
    : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
}

export function getReportExtension(format: ReportFormat): string {
  return format === ReportFormat.PDF ? 'pdf' : 'docx';
}
