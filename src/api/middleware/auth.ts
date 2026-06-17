import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/errors.js';

type JwtPayload = {
  sub: string;      // userId
  tenantId: string;
  role: 'admin' | 'member';
  iat: number;
  exp: number;
};

/**
 * JWT auth middleware.
 * Validates Bearer token from the Authorization header and populates req.context.
 * Must be applied BEFORE tenantContextMiddleware on protected routes.
 */
export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    next(new AppError(401, 'UNAUTHORIZED', 'Missing or invalid Authorization header'));
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;

    req.context = {
      tenantId: payload.tenantId,
      userId: payload.sub,
      role: payload.role,
    };

    next();
  } catch {
    next(new AppError(401, 'UNAUTHORIZED', 'Invalid or expired access token'));
  }
}

/**
 * Require admin role. Must be called after authMiddleware.
 */
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.context || req.context.role !== 'admin') {
    next(new AppError(403, 'FORBIDDEN', 'Admin access required'));
    return;
  }
  next();
}
