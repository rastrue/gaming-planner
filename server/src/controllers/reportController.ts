import type { Request, Response } from 'express';
import { AppError } from '../lib/errors.js';
import * as reportService from '../services/reportService.js';
import type {
  CreateReportInput,
  EmailReportInput,
  ListReportsQuery,
  UpdateReportInput,
} from '../validators/reportValidator.js';

function requireUser(req: Request) {
  if (!req.user) {
    throw new AppError(401, 'Требуется авторизация');
  }

  return req.user;
}

export async function listReports(req: Request, res: Response): Promise<void> {
  const result = await reportService.listReports(
    requireUser(req),
    req.query as unknown as ListReportsQuery,
  );
  res.json(result);
}

export async function getReportById(req: Request, res: Response): Promise<void> {
  const report = await reportService.getReportById(Number(req.params.id), requireUser(req));
  res.json({ report });
}

export async function createReport(req: Request, res: Response): Promise<void> {
  const report = await reportService.createReport(
    requireUser(req),
    req.body as CreateReportInput,
  );
  res.status(201).json({ report });
}

export async function updateReport(req: Request, res: Response): Promise<void> {
  const report = await reportService.updateReport(
    Number(req.params.id),
    req.body as UpdateReportInput,
    requireUser(req),
  );
  res.json({ report });
}

export async function deleteReport(req: Request, res: Response): Promise<void> {
  await reportService.deleteReport(Number(req.params.id), requireUser(req));
  res.status(204).send();
}

export async function downloadReport(req: Request, res: Response): Promise<void> {
  const download = await reportService.getReportDownload(Number(req.params.id), requireUser(req));
  res.download(download.filePath, download.fileName, {
    headers: {
      'Content-Type': download.mimeType,
    },
  });
}

export async function emailReport(req: Request, res: Response): Promise<void> {
  const report = await reportService.emailReport(
    Number(req.params.id),
    requireUser(req),
    req.body as EmailReportInput,
  );
  res.json({ report });
}
