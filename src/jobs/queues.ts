import { Queue } from 'bullmq';
import { env } from '../config/env.js';

export const CAMPAIGN_GENERATION_QUEUE = `${env.QUEUE_PREFIX}-campaign-generation`;
export const PUBLISH_QUEUE = `${env.QUEUE_PREFIX}-publish`;

const connection = { url: env.REDIS_URL };

export const campaignGenerationQueue = new Queue(CAMPAIGN_GENERATION_QUEUE, { connection });
export const publishQueue = new Queue(PUBLISH_QUEUE, { connection });

export type CampaignGenerationJobData = {
  tenantId: string;
  campaignId: string;
  agentRunId: string;
  productId: string;
  platforms: string[];
};

export type PublishJobData = {
  publishJobId: string;
  tenantId: string;
};
