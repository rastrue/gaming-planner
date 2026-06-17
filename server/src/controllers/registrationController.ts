import type { Request, Response } from 'express';
import { AppError } from '../lib/errors.js';
import * as registrationService from '../services/registrationService.js';
import type {
  CreateRegistrationInput,
  ListRegistrationsQuery,
  UpdateRegistrationInput,
} from '../validators/registrationValidator.js';

function requireUser(req: Request) {
  if (!req.user) {
    throw new AppError(401, 'Требуется авторизация');
  }

  return req.user;
}

export async function listRegistrations(req: Request, res: Response): Promise<void> {
  const result = await registrationService.listRegistrations(
    requireUser(req),
    req.query as unknown as ListRegistrationsQuery,
  );
  res.json(result);
}

export async function getRegistrationById(req: Request, res: Response): Promise<void> {
  const registration = await registrationService.getRegistrationById(
    Number(req.params.id),
    requireUser(req),
  );
  res.json({ registration });
}

export async function createRegistration(req: Request, res: Response): Promise<void> {
  const registration = await registrationService.createRegistration(
    requireUser(req),
    req.body as CreateRegistrationInput,
  );
  res.status(201).json({ registration });
}

export async function updateRegistration(req: Request, res: Response): Promise<void> {
  const registration = await registrationService.updateRegistration(
    Number(req.params.id),
    req.body as UpdateRegistrationInput,
    requireUser(req),
  );
  res.json({ registration });
}

export async function deleteRegistration(req: Request, res: Response): Promise<void> {
  await registrationService.deleteRegistration(Number(req.params.id), requireUser(req));
  res.status(204).send();
}
