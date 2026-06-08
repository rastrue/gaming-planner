import type { Request, Response } from 'express';
import { AppError } from '../lib/errors.js';
import * as eventService from '../services/eventService.js';
import type { CreateEventInput, ListEventsQuery, UpdateEventInput } from '../validators/eventValidator.js';

export async function listEvents(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as ListEventsQuery;
  const result = await eventService.listEvents(query, req.user?.id);
  res.json(result);
}

export async function getEventById(req: Request, res: Response): Promise<void> {
  const event = await eventService.getEventById(Number(req.params.id));
  res.json({ event });
}

export async function createEvent(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }

  const event = await eventService.createEvent(req.body as CreateEventInput, req.user.id);
  res.status(201).json({ event });
}

export async function updateEvent(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }

  const event = await eventService.updateEvent(
    Number(req.params.id),
    req.body as UpdateEventInput,
    req.user.id,
  );
  res.json({ event });
}

export async function deleteEvent(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }

  await eventService.deleteEvent(Number(req.params.id), req.user.id);
  res.status(204).send();
}
