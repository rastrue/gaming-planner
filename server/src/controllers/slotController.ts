import type { Request, Response } from 'express';
import { AppError } from '../lib/errors.js';
import * as slotService from '../services/slotService.js';
import type { CreateSlotInput, UpdateSlotInput } from '../validators/slotValidator.js';

export async function listEventSlots(req: Request, res: Response): Promise<void> {
  const slots = await slotService.listEventSlots(Number(req.params.eventId));
  res.json({ slots });
}

export async function createEventSlot(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError(401, 'Требуется авторизация');
  }

  const slot = await slotService.createEventSlot(
    Number(req.params.eventId),
    req.body as CreateSlotInput,
    req.user.id,
  );
  res.status(201).json({ slot });
}

export async function updateEventSlot(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError(401, 'Требуется авторизация');
  }

  const slot = await slotService.updateEventSlot(
    Number(req.params.id),
    req.body as UpdateSlotInput,
    req.user.id,
  );
  res.json({ slot });
}

export async function deleteEventSlot(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError(401, 'Требуется авторизация');
  }

  await slotService.deleteEventSlot(Number(req.params.id), req.user.id);
  res.status(204).send();
}
