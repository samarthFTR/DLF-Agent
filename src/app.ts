import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler } from './api/middleware/error-handler.js';
import { httpLogger } from './api/middleware/http-logger.js';
import { notFoundMiddleware } from './api/middleware/not-found.js';
import { requestIdMiddleware } from './api/middleware/request-id.js';
import { apiRoutes } from './api/routes/index.js';

export function createApp(): express.Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false }));
  app.use(requestIdMiddleware);
  app.use(httpLogger);

  // Serve storage directory statically for asset previews
  app.use('/assets', express.static(env.LOCAL_STORAGE_ROOT, {
    setHeaders: (res) => {
      res.set('Access-Control-Allow-Origin', env.FRONTEND_URL);
      res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    }
  }));

  app.use('/api/v1', apiRoutes);

  app.use(notFoundMiddleware);
  app.use(errorHandler);

  return app;
}

