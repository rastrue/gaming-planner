import { UserRoleName } from '@prisma/client';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { AppError } from '../lib/errors.js';
import { verifyAccessToken } from '../lib/jwt.js';

export interface AuthenticatedUser {
  id: number;
  roleName: UserRoleName;
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

function extractAccessToken(req: Request): string | undefined {
  const bearerToken = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : undefined;
  const cookieToken =
    typeof req.cookies?.[AUTH_COOKIE_NAME] === 'string'
      ? req.cookies[AUTH_COOKIE_NAME]
      : undefined;

  return bearerToken ?? cookieToken;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const token = extractAccessToken(req);

    if (!token) {
      throw new AppError(401, 'Authentication required');
    }

    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.userId,
      roleName: payload.roleName as UserRoleName,
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

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const token = extractAccessToken(req);

    if (!token) {
      next();
      return;
    }

    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.userId,
      roleName: payload.roleName as UserRoleName,
    };
    next();
  } catch {
    next();
  }
}

export function requireRoles(...allowedRoles: UserRoleName[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, 'Authentication required'));
      return;
    }

    if (!allowedRoles.includes(req.user.roleName)) {
      next(new AppError(403, 'Insufficient permissions for this action'));
      return;
    }

    next();
  };
}

export function requireOrganizer(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, (authError) => {
    if (authError) {
      next(authError);
      return;
    }

    requireRoles(UserRoleName.ORGANIZER)(req, res, next);
  });
}

export function requirePlayer(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, (authError) => {
    if (authError) {
      next(authError);
      return;
    }

    requireRoles(UserRoleName.PLAYER)(req, res, next);
  });
}

export const organizerGuard: RequestHandler[] = [
  requireAuth,
  requireRoles(UserRoleName.ORGANIZER),
];

export const playerGuard: RequestHandler[] = [requireAuth, requireRoles(UserRoleName.PLAYER)];
