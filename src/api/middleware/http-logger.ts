import pinoHttp from 'pino-http';
import type { IncomingMessage } from 'node:http';
import type { RequestHandler } from 'express';
import { logger } from '../../utils/logger.js';

type PinoHttpFactory = typeof pinoHttp extends (...args: infer Args) => infer Return
  ? (...args: Args) => Return
  : (options: Record<string, unknown>) => RequestHandler;

const createHttpLogger = pinoHttp as unknown as PinoHttpFactory;

export const httpLogger = createHttpLogger({
  logger,
  genReqId: (req: IncomingMessage & { id?: string }) => req.id,
  customProps: (req: IncomingMessage & { id?: string }) => ({
    requestId: req.id,
  }),
}) as RequestHandler;
