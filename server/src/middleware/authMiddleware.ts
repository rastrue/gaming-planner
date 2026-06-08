import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../lib/errors.js';
import { verifyAccessToken } from '../lib/jwt.js';

export interface AuthenticatedUser {
  id: number;
  roleName: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

const AUTH_COOKIE_NAME = 'questsync_token';

export function getAuthCookieName(): string {
  return AUTH_COOKIE_NAME;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const bearerToken = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : undefined;
    const cookieToken =
      typeof req.cookies?.[AUTH_COOKIE_NAME] === 'string'
        ? req.cookies[AUTH_COOKIE_NAME]
        : undefined;
    const token = bearerToken ?? cookieToken;

    if (!token) {
      throw new AppError(401, 'Authentication required');
    }

    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.userId,
      roleName: payload.roleName,
    };
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }

    next(new AppError(401, 'Invalid or expired session'));
  }
}
