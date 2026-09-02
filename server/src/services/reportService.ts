import {
  Prisma,
  ReportKind,
  ReportStatus,
  UserRoleName,
} from '@prisma/client';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AppError } from '../lib/errors.js';
import prisma from '../lib/prisma.js';
import {
  generateReportBuffer,
  getReportExtension,
  getReportMimeType,
} from '../lib/reportGenerator.js';
import type { AuthenticatedUser } from '../middleware/authMiddleware.js';
import { sendReportEmail } from './emailService.js';
import type {
  CreateReportInput,
  EmailReportInput,
  ListReportsQuery,
  UpdateReportInput,
} from '../validators/reportValidator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = path.resolve(__dirname, '../../storage/reports');

const reportSelect = {
  id: true,
  requestedByUserId: true,
  subjectUserId: true,
  eventId: true,
  periodStart: true,
  periodEnd: true,
  reportKind: true,
  outputFormat: true,
  deliveryChannel: true,
  recipientEmail: true,
  status: true,
  fileName: true,
  storagePath: true,
  requestedAt: true,
  generatedAt: true,
  emailedAt: true,
  failedReason: true,
} as const;

export type ReportRequestRecord = Prisma.ReportRequestGetPayload<{ select: typeof reportSelect }>;

export interface PaginatedReports {
  reports: ReportRequestRecord[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

async function ensureReportsDir(): Promise<void> {
  await fs.mkdir(REPORTS_DIR, { recursive: true });
}

async function getReportByIdInternal(id: number): Promise<ReportRequestRecord> {
  const report = await prisma.reportRequest.findUnique({
    where: { id },
    select: reportSelect,
  });

  if (!report) {
    throw new AppError(404, 'Report request not found');
  }

  return report;
}

function assertCanAccessReport(report: ReportRequestRecord, user: AuthenticatedUser): void {
  if (report.requestedByUserId !== user.id) {
    throw new AppError(403, 'You do not have access to this report request');
  }
}

async function assertCanCreateReport(input: CreateReportInput, user: AuthenticatedUser): Promise<void> {
  if (input.reportKind === ReportKind.EVENT_ATTENDANCE) {
    if (user.roleName !== UserRoleName.ORGANIZER) {
      throw new AppError(403, 'Only organizers can generate event attendance reports');
    }

    const event = await prisma.event.findUnique({
      where: { id: input.eventId },
      select: { organizerId: true },
    });

    if (!event) {
      throw new AppError(404, 'Event not found');
    }

    if (event.organizerId !== user.id) {
      throw new AppError(403, 'You can only generate reports for events you organize');
    }

    return;
  }

  if (user.roleName === UserRoleName.PLAYER && input.subjectUserId !== user.id) {
    throw new AppError(403, 'Players can only generate reports about their own participation');
  }

  const subject = await prisma.user.findUnique({
    where: { id: input.subjectUserId },
    select: { id: true },
  });

  if (!subject) {
    throw new AppError(404, 'User not found');
  }
}

async function writeReportFile(reportId: number, fileName: string, buffer: Buffer): Promise<string> {
  await ensureReportsDir();
  const storagePath = path.join(REPORTS_DIR, `${reportId}-${fileName}`);
  await fs.writeFile(storagePath, buffer);
  return storagePath;
}

async function generateAndPersistReport(
  reportId: number,
  input: CreateReportInput,
): Promise<ReportRequestRecord> {
  try {
    const buffer = await generateReportBuffer(input.reportKind, input.outputFormat, {
      eventId: input.eventId,
      subjectUserId: input.subjectUserId,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
    });

    const extension = getReportExtension(input.outputFormat);
    const baseName =
      input.reportKind === ReportKind.EVENT_ATTENDANCE
        ? `event-attendance-${input.eventId}`
        : `player-participation-${input.subjectUserId}`;
    const fileName = `${baseName}.${extension}`;
    const storagePath = await writeReportFile(reportId, fileName, buffer);

    return prisma.reportRequest.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.GENERATED,
        fileName,
        storagePath,
        generatedAt: new Date(),
        failedReason: null,
      },
      select: reportSelect,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate report';

    return prisma.reportRequest.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.FAILED,
        failedReason: message,
      },
      select: reportSelect,
    });
  }
}

export async function listReports(
  user: AuthenticatedUser,
  query: ListReportsQuery,
): Promise<PaginatedReports> {
  const where = { requestedByUserId: user.id };

  const [total, reports] = await prisma.$transaction([
    prisma.reportRequest.count({ where }),
    prisma.reportRequest.findMany({
      where,
      select: reportSelect,
      orderBy: { requestedAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return {
    reports,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
  };
}

export async function getReportById(id: number, user: AuthenticatedUser): Promise<ReportRequestRecord> {
  const report = await getReportByIdInternal(id);
  assertCanAccessReport(report, user);
  return report;
}

export async function createReport(
  user: AuthenticatedUser,
  input: CreateReportInput,
): Promise<ReportRequestRecord> {
  await assertCanCreateReport(input, user);

  const queued = await prisma.reportRequest.create({
    data: {
      requestedByUserId: user.id,
      subjectUserId: input.subjectUserId,
      eventId: input.eventId,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      reportKind: input.reportKind,
      outputFormat: input.outputFormat,
      deliveryChannel: input.deliveryChannel,
      recipientEmail: input.recipientEmail,
      status: ReportStatus.QUEUED,
    },
    select: reportSelect,
  });

  const generated = await generateAndPersistReport(queued.id, input);

  if (generated.status === ReportStatus.FAILED) {
    throw new AppError(500, generated.failedReason ?? 'Failed to generate report');
  }

  return generated;
}

export async function updateReport(
  id: number,
  input: UpdateReportInput,
  user: AuthenticatedUser,
): Promise<ReportRequestRecord> {
  const report = await getReportByIdInternal(id);
  assertCanAccessReport(report, user);

  return prisma.reportRequest.update({
    where: { id },
    data: input,
    select: reportSelect,
  });
}

export async function deleteReport(id: number, user: AuthenticatedUser): Promise<void> {
  const report = await getReportByIdInternal(id);
  assertCanAccessReport(report, user);

  if (report.storagePath) {
    try {
      await fs.unlink(report.storagePath);
    } catch {
      // Ignore missing files on delete.
    }
  }

  await prisma.reportRequest.delete({ where: { id } });
}

export async function getReportDownload(
  id: number,
  user: AuthenticatedUser,
): Promise<{ filePath: string; fileName: string; mimeType: string }> {
  const report = await getReportByIdInternal(id);
  assertCanAccessReport(report, user);

  if (report.status !== ReportStatus.GENERATED && report.status !== ReportStatus.EMAILED) {
    throw new AppError(409, 'Report file is not available for download');
  }

  if (!report.storagePath || !report.fileName) {
    throw new AppError(404, 'Report file not found');
  }

  try {
    await fs.access(report.storagePath);
  } catch {
    throw new AppError(404, 'Report file not found on disk');
  }

  return {
    filePath: report.storagePath,
    fileName: report.fileName,
    mimeType: getReportMimeType(report.outputFormat),
  };
}

export async function emailReport(
  id: number,
  user: AuthenticatedUser,
  input: EmailReportInput,
): Promise<ReportRequestRecord> {
  const report = await getReportByIdInternal(id);
  assertCanAccessReport(report, user);

  if (report.status !== ReportStatus.GENERATED && report.status !== ReportStatus.EMAILED) {
    throw new AppError(409, 'The report must be generated before it can be emailed');
  }

  const recipientEmail = input.recipientEmail ?? report.recipientEmail;

  if (!recipientEmail) {
    throw new AppError(400, 'Provide a recipient email address');
  }

  if (!report.storagePath || !report.fileName) {
    throw new AppError(404, 'Report file not found');
  }

  try {
    const fileBuffer = await fs.readFile(report.storagePath);
    await sendReportEmail({
      to: recipientEmail,
      subject: `QuestSync Report: ${report.reportKind}`,
      text: 'Your requested QuestSync report is attached.',
      fileName: report.fileName,
      fileBuffer,
      mimeType: getReportMimeType(report.outputFormat),
    });

    return prisma.reportRequest.update({
      where: { id },
      data: {
        status: ReportStatus.EMAILED,
        recipientEmail,
        emailedAt: new Date(),
        failedReason: null,
      },
      select: reportSelect,
    });
  } catch (error) {
    const message = error instanceof AppError ? error.message : 'Failed to send report by email';

    return prisma.reportRequest.update({
      where: { id },
      data: {
        status: ReportStatus.FAILED,
        failedReason: message,
      },
      select: reportSelect,
    });
  }
}
