import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../../utils/errors.js';

const tenantHeaderSchema = z.string().uuid();

export function tenantContextMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const tenantId = req.header('x-tenant-id');
  const parsedTenantId = tenantHeaderSchema.safeParse(tenantId);

  if (!parsedTenantId.success) {
    next(new AppError(401, 'UNAUTHORIZED', 'Missing or invalid x-tenant-id header'));
    return;
  }

  const userId = req.header('x-user-id');
  const parsedUserId = userId ? tenantHeaderSchema.safeParse(userId) : undefined;

  if (parsedUserId && !parsedUserId.success) {
    next(new AppError(401, 'UNAUTHORIZED', 'Invalid x-user-id header'));
    return;
  }

  req.context = {
    tenantId: parsedTenantId.data,
    userId: parsedUserId?.data,
  };
  next();
}

export function requireRequestContext(req: Request): NonNullable<Request['context']> {
  if (!req.context) {
    throw new AppError(500, 'INTERNAL_ERROR', 'Request context was not initialized');
  }

  return req.context;
}

