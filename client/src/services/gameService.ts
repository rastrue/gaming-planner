import type { CreateGameInput, Game, UpdateGameInput } from '../types/index';
import { apiRequest, apiRequestVoid } from './apiClient';

export async function getGames(): Promise<Game[]> {
  const data = await apiRequest<{ games: Game[] }>('/games');
  return data.games;
}

export async function getGameById(id: number): Promise<Game> {
  const data = await apiRequest<{ game: Game }>(`/games/${id}`);
  return data.game;
}

export async function createGame(input: CreateGameInput): Promise<Game> {
  const data = await apiRequest<{ game: Game }>('/games', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  return data.game;
}

export async function updateGame(id: number, input: UpdateGameInput): Promise<Game> {
  const data = await apiRequest<{ game: Game }>(`/games/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });

  return data.game;
}

export async function deleteGame(id: number): Promise<void> {
  await apiRequestVoid(`/games/${id}`, { method: 'DELETE' });
}
