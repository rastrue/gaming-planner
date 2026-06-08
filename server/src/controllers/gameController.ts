import type { Request, Response } from 'express';
import * as gameService from '../services/gameService.js';
import type { CreateGameInput, UpdateGameInput } from '../validators/gameValidator.js';

export async function listGames(_req: Request, res: Response): Promise<void> {
  const games = await gameService.listGames();
  res.json({ games });
}

export async function getGameById(req: Request, res: Response): Promise<void> {
  const game = await gameService.getGameById(Number(req.params.id));
  res.json({ game });
}

export async function createGame(req: Request, res: Response): Promise<void> {
  const game = await gameService.createGame(req.body as CreateGameInput);
  res.status(201).json({ game });
}

export async function updateGame(req: Request, res: Response): Promise<void> {
  const game = await gameService.updateGame(Number(req.params.id), req.body as UpdateGameInput);
  res.json({ game });
}

export async function deleteGame(req: Request, res: Response): Promise<void> {
  await gameService.deleteGame(Number(req.params.id));
  res.status(204).send();
}
