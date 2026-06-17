import { Worker } from 'bullmq';
import type { SocialPlatform } from '@prisma/client';
import { prisma } from '../database/prisma.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';
import {
  CAMPAIGN_GENERATION_QUEUE,
  type CampaignGenerationJobData,
} from './queues.js';
import { marketingPipelineGraph } from '../agents/graphs/marketing-pipeline.graph.js';

export function startCampaignGenerationWorker(): Worker {
  const worker = new Worker<CampaignGenerationJobData>(
    CAMPAIGN_GENERATION_QUEUE,
    async (job) => {
      const { tenantId, campaignId, agentRunId, productId, platforms } = job.data;

      logger.info({ jobId: job.id, campaignId, agentRunId }, 'Campaign generation job started');

      // Mark run as RUNNING
      await prisma.agentRun.update({
        where: { id: agentRunId },
        data: { status: 'RUNNING', startedAt: new Date(), currentAgent: 'load_context' },
      });

      await prisma.agentRunEvent.create({
        data: {
          agentRunId,
          agentName: 'orchestrator',
          eventType: 'run.started',
          payload: { jobId: job.id ?? null },
        },
      });

      try {
        const result = await marketingPipelineGraph.invoke({
          tenantId,
          campaignId,
          agentRunId,
          productId,
          platforms: platforms as SocialPlatform[],
        });

        const succeeded = result.qualityCheckPassed !== false;
        const finalStatus = succeeded ? 'SUCCEEDED' : 'FAILED';

        await prisma.agentRun.update({
          where: { id: agentRunId },
          data: {
            status: finalStatus,
            finishedAt: new Date(),
            currentAgent: null,
            outputSnapshot: {
              qualityCheckPassed: result.qualityCheckPassed ?? false,
              qualityCheckFindings: result.qualityCheckFindings ?? [],
              captionsGenerated: result.captions?.length ?? 0,
              resizedAssets: result.imageOutputs?.resizedAssets?.length ?? 0,
            },
          },
        });

        await prisma.agentRunEvent.create({
          data: {
            agentRunId,
            agentName: 'orchestrator',
            eventType: `run.${finalStatus.toLowerCase()}`,
            payload: { qualityCheckPassed: result.qualityCheckPassed ?? false },
          },
        });

        logger.info({ agentRunId, finalStatus }, 'Campaign generation job completed');
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);

        logger.error({ agentRunId, err }, 'Campaign generation job failed');

        await prisma.agentRun.update({
          where: { id: agentRunId },
          data: {
            status: 'FAILED',
            finishedAt: new Date(),
            currentAgent: null,
            error: { message, stack: err instanceof Error ? err.stack : undefined },
          },
        });

        await prisma.agentRunEvent.create({
          data: {
            agentRunId,
            agentName: 'orchestrator',
            eventType: 'run.failed',
            payload: { message },
          },
        });

        throw err; // BullMQ will retry per queue config
      }
    },
    {
      connection: { url: env.REDIS_URL },
      concurrency: 2,
    },
  );

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Campaign generation worker job failed');
  });

  return worker;
}
