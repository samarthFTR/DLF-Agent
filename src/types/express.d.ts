import type { RequestContext } from './request-context.js';

declare global {
  namespace Express {
    interface Request {
      id: string;
      context?: RequestContext;
    }
  }
}
