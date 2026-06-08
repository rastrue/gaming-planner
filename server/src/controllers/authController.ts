import type { CookieOptions, Request, Response } from 'express';
import { signAccessToken } from '../lib/jwt.js';
import { getAuthCookieName, requireAuth } from '../middleware/authMiddleware.js';
import * as authService from '../services/authService.js';
import type { LoginInput, RegisterInput } from '../validators/authValidator.js';

const isProduction = process.env.NODE_ENV === 'production';

function getCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
}

function setSessionCookie(res: Response, user: authService.PublicUser): void {
  const token = signAccessToken({
    userId: user.id,
    roleName: user.role.name,
  });

  res.cookie(getAuthCookieName(), token, getCookieOptions());
}

function clearSessionCookie(res: Response): void {
  res.clearCookie(getAuthCookieName(), {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
  });
}

export async function register(req: Request, res: Response): Promise<void> {
  const user = await authService.registerUser(req.body as RegisterInput);
  setSessionCookie(res, user);
  res.status(201).json({ user });
}

export async function login(req: Request, res: Response): Promise<void> {
  const user = await authService.loginUser(req.body as LoginInput);
  setSessionCookie(res, user);
  res.json({ user });
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await authService.getUserById(req.user!.id);
  res.json({ user });
}

export function logout(_req: Request, res: Response): void {
  clearSessionCookie(res);
  res.status(204).send();
}

export { requireAuth };
