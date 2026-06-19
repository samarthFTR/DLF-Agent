import { createServer } from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { disconnectPrisma } from './database/prisma.js';
import { logger } from './utils/logger.js';
import { startCampaignGenerationWorker } from './jobs/campaign-generation.worker.js';
import { startPublishWorker } from './jobs/publish.worker.js';

const app = createApp();
const server = createServer(app);

const campaignWorker = startCampaignGenerationWorker();
const publishWorker = startPublishWorker();

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

      try {
        await campaignWorker.close();
        await publishWorker.close();
        logger.info('Workers closed gracefully');
      } catch (workerError) {
        logger.error({ error: workerError }, 'Error closing background workers');
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
