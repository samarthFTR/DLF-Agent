import { createServer } from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { disconnectPrisma } from './database/prisma.js';
import { logger } from './utils/logger.js';

const app = createApp();
const server = createServer(app);

server.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'API server listening');
});

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  logger.info({ signal }, 'Shutting down API server');

  server.close((error) => {
    void (async () => {
      if (error) {
        logger.error({ error }, 'Error while closing HTTP server');
        process.exitCode = 1;
      }

      await disconnectPrisma();
      process.exit();
    })();
  });
}

process.on('SIGINT', (signal) => {
  void shutdown(signal);
});

process.on('SIGTERM', (signal) => {
  void shutdown(signal);
});
