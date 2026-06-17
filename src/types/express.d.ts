import type { RequestContext } from './request-context.js';

declare namespace Express {
  export interface Request {
    id: string;
    context?: RequestContext;
  }
}
