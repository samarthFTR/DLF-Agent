import crypto from 'node:crypto';
import { prisma } from '../../database/prisma.js';
import { AppError } from '../../utils/errors.js';
import { encryptToken, decryptToken } from '../../utils/token-encryption.js';
import { socialAdapters } from '../../integrations/social/social-account.adapter.js';
import type { RequestContext } from '../../types/request-context.js';
import { publishQueue } from '../../jobs/queues.js';

export class PublishingService {
  /** Create a publish job for an approved post, idempotent by key. */
  public async schedulePost(
    context: RequestContext,
    input: {
      postId: string;
      socialAccountId: string;
      scheduledAt?: string | null;
    },
  ) {
    const post = await prisma.generatedPost.findFirst({
      where: { id: input.postId, tenantId: context.tenantId },
    });
    if (!post) throw new AppError(404, 'NOT_FOUND', 'Post not found');
    if (post.status !== 'APPROVED') {
      throw new AppError(409, 'CONFLICT', 'Post must be approved before scheduling');
    }

    const socialAccount = await prisma.socialAccount.findFirst({
      where: { id: input.socialAccountId, tenantId: context.tenantId },
    });
    if (!socialAccount) throw new AppError(404, 'NOT_FOUND', 'Social account not found');

    // Deterministic idempotency key
    const idempotencyKey = crypto
      .createHash('sha256')
      .update(`${input.postId}:${input.socialAccountId}`)
      .digest('hex');

    // Upsert — safe to call multiple times
    const job = await prisma.publishJob.upsert({
      where: { idempotencyKey },
      create: {
        tenantId: context.tenantId,
        campaignId: post.campaignId,
        postId: input.postId,
        socialAccountId: input.socialAccountId,
        platform: socialAccount.platform,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
        idempotencyKey,
        status: 'QUEUED',
      },
      update: {}, // already exists — no-op
    });

    // Enqueue for the worker unless it's already past a terminal state
    if (job.status === 'QUEUED') {
      const delay = input.scheduledAt
        ? Math.max(0, new Date(input.scheduledAt).getTime() - Date.now())
        : 0;

      await publishQueue.add(
        'publish',
        { publishJobId: job.id, tenantId: context.tenantId },
        { delay, attempts: 3, backoff: { type: 'exponential', delay: 10000 } },
      );
    }

    return job;
  }

  /** List publish jobs for a campaign. */
  public async listJobs(context: RequestContext, campaignId: string) {
    return prisma.publishJob.findMany({
      where: { campaignId, tenantId: context.tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Execute a publish job directly (called by the worker). */
  public async executeJob(publishJobId: string, tenantId: string) {
    const job = await prisma.publishJob.findFirst({
      where: { id: publishJobId, tenantId },
      include: {
        post: true,
        socialAccount: true,
      },
    });

    if (!job) throw new Error(`Publish job not found: ${publishJobId}`);

    await prisma.publishJob.update({
      where: { id: publishJobId },
      data: { status: 'PUBLISHING' },
    });

    const accessToken = decryptToken(job.socialAccount.encryptedAccessToken);
    const adapter = socialAdapters[job.platform];

    if (!adapter) throw new Error(`No adapter for platform: ${job.platform}`);

    const result = await adapter.publishPost({
      caption: job.post.caption,
      hashtags: job.post.hashtags,
      callToAction: job.post.callToAction,
      accessToken,
      externalAccountId: job.socialAccount.externalAccountId,
    });

    await prisma.publishJob.update({
      where: { id: publishJobId },
      data: {
        status: 'PUBLISHED',
        externalPostId: result.externalPostId,
        publishedAt: result.publishedAt,
      },
    });

    await prisma.generatedPost.update({
      where: { id: job.postId },
      data: { status: 'PUBLISHED' },
    });

    return result;
  }
}
