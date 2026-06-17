import type { Request, Response } from 'express';
import { AppError } from '../lib/errors.js';
import * as availabilityService from '../services/availabilityService.js';
import type {
  CreateAvailabilityInput,
  ListAvailabilityQuery,
  UpdateAvailabilityInput,
} from '../validators/availabilityValidator.js';

function requireUser(req: Request) {
  if (!req.user) {
    throw new AppError(401, 'Требуется авторизация');
  }

  return req.user;
}

export async function listAvailabilityWindows(req: Request, res: Response): Promise<void> {
  const windows = await availabilityService.listAvailabilityWindows(
    requireUser(req),
    req.query as unknown as ListAvailabilityQuery,
  );
  res.json({ windows });
}

export async function getAvailabilityWindowById(req: Request, res: Response): Promise<void> {
  const window = await availabilityService.getAvailabilityWindowById(
    Number(req.params.id),
    requireUser(req),
  );
  res.json({ window });
}

export async function createAvailabilityWindow(req: Request, res: Response): Promise<void> {
  const window = await availabilityService.createAvailabilityWindow(
    requireUser(req),
    req.body as CreateAvailabilityInput,
  );
  res.status(201).json({ window });
}

export async function updateAvailabilityWindow(req: Request, res: Response): Promise<void> {
  const window = await availabilityService.updateAvailabilityWindow(
    Number(req.params.id),
    req.body as UpdateAvailabilityInput,
    requireUser(req),
  );
  res.json({ window });
}

export async function deleteAvailabilityWindow(req: Request, res: Response): Promise<void> {
  await availabilityService.deleteAvailabilityWindow(Number(req.params.id), requireUser(req));
  res.status(204).send();
}
