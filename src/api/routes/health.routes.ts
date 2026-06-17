import { Router } from 'express';
import { env } from '../../config/env.js';
import { checkDatabaseReadiness } from '../../database/prisma.js';

export const healthRoutes = Router();

healthRoutes.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'ai-marketing-agent',
    version: env.RELEASE_VERSION,
  });
});

healthRoutes.get('/ready', (_req, res) => {
  void (async () => {
    const databaseReady = await checkDatabaseReadiness();
    const ready = databaseReady;

    res.status(ready ? 200 : 503).json({
      status: ready ? 'ready' : 'not_ready',
      checks: {
        database: databaseReady ? 'ok' : 'unavailable',
      },
    });
  })();
});

healthRoutes.get('/version', (_req, res) => {
  res.status(200).json({
    version: env.RELEASE_VERSION,
    nodeEnv: env.NODE_ENV,
  });
});
