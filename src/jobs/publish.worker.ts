import { Worker } from 'bullmq';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { PUBLISH_QUEUE, type PublishJobData } from './queues.js';
import { PublishingService } from '../services/publishing/publishing.service.js';

const publishingService = new PublishingService();

export function startPublishWorker(): Worker {
  const worker = new Worker<PublishJobData>(
    PUBLISH_QUEUE,
    async (job) => {
      const { publishJobId, tenantId } = job.data;
      logger.info({ jobId: job.id, publishJobId }, 'Publish job started');
      await publishingService.executeJob(publishJobId, tenantId);
      logger.info({ publishJobId }, 'Publish job completed');
    },
    {
      connection: { url: env.REDIS_URL },
      concurrency: 5,
    },
  );

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Publish worker job failed');
  });

  return worker;
}
