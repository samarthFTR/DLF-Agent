import type { Request } from 'express';
import { AppError } from '../utils/errors.js';

export function getRouteParam(req: Request, name: string): string {
  const value = req.params[name];

  if (!value) {
    throw new AppError(400, 'BAD_REQUEST', `Missing route parameter: ${name}`);
  }

  return value;
}

