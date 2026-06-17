import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { env } from '../../config/env.js';
import { AppError, isAppError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const normalizedError = normalizeError(error);

  if (normalizedError.statusCode >= 500) {
    logger.error({ error, requestId: req.id }, normalizedError.message);
  } else {
    logger.warn({ error, requestId: req.id }, normalizedError.message);
  }

  res.status(normalizedError.statusCode).json({
    error: {
      code: normalizedError.code,
      message: normalizedError.message,
      requestId: req.id,
      details: env.NODE_ENV === 'production' ? undefined : normalizedError.details,
    },
  });
}

function normalizeError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof ZodError) {
    return new AppError(400, 'VALIDATION_ERROR', 'Request validation failed', error.flatten());
  }

  return new AppError(500, 'INTERNAL_ERROR', 'Unexpected server error');
}

