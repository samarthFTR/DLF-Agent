import { prisma } from '../../database/prisma.js';
import { AppError } from '../../utils/errors.js';
import type { RequestContext } from '../../types/request-context.js';

export class GeneratedPostService {
  public async listPosts(context: RequestContext, campaignId: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, tenantId: context.tenantId },
    });
    if (!campaign) throw new AppError(404, 'NOT_FOUND', 'Campaign not found');

    return prisma.generatedPost.findMany({
      where: { campaignId, tenantId: context.tenantId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true, tenantId: true, campaignId: true, agentRunId: true,
        platform: true, status: true, caption: true, hashtags: true,
        callToAction: true, scheduledAt: true, promptVersion: true,
        modelMetadata: true, approvedBy: true, approvedAt: true,
        createdAt: true, updatedAt: true,
        assets: {
          select: {
            asset: {
              select: {
                id: true,
                kind: true,
                storageKey: true,
                publicUrl: true,
                mimeType: true,
                width: true,
                height: true,
              },
            },
          },
        },
      },
    });
  }

  public async getPost(context: RequestContext, postId: string) {
    const post = await prisma.generatedPost.findFirst({
      where: { id: postId, tenantId: context.tenantId },
      select: {
        id: true, tenantId: true, campaignId: true, agentRunId: true,
        platform: true, status: true, caption: true, hashtags: true,
        callToAction: true, scheduledAt: true, promptVersion: true,
        modelMetadata: true, approvedBy: true, approvedAt: true,
        createdAt: true, updatedAt: true,
        assets: {
          select: {
            asset: {
              select: {
                id: true,
                kind: true,
                storageKey: true,
                publicUrl: true,
                mimeType: true,
                width: true,
                height: true,
              },
            },
          },
        },
        versions: { orderBy: { versionNumber: 'asc' }, select: {
          id: true, versionNumber: true, caption: true, hashtags: true,
          callToAction: true, changeReason: true, createdAt: true,
        }},
      },
    });
    if (!post) throw new AppError(404, 'NOT_FOUND', 'Post not found');
    return post;
  }

  public async updatePost(
    context: RequestContext,
    postId: string,
    input: { caption?: string; hashtags?: string[]; callToAction?: string; changeReason: string },
  ) {
    const post = await this.getPost(context, postId);

    const lastVersion = await prisma.generatedPostVersion.findFirst({
      where: { postId },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });

    // Archive current version
    await prisma.generatedPostVersion.create({
      data: {
        postId,
        versionNumber: (lastVersion?.versionNumber ?? 0) + 1,
        caption: post.caption,
        hashtags: post.hashtags,
        callToAction: post.callToAction ?? null,
        changeReason: input.changeReason,
        changedBy: context.userId ?? null,
      },
    });

    return prisma.generatedPost.update({
      where: { id: postId },
      data: {
        caption: input.caption ?? post.caption,
        hashtags: input.hashtags ?? post.hashtags,
        callToAction: input.callToAction ?? post.callToAction,
        status: 'NEEDS_REVIEW',
      },
    });
  }

  public async approvePost(context: RequestContext, postId: string) {
    const post = await this.getPost(context, postId);

    if (post.status === 'APPROVED') {
      throw new AppError(409, 'CONFLICT', 'Post is already approved');
    }

    return prisma.generatedPost.update({
      where: { id: postId },
      data: {
        status: 'APPROVED',
        approvedBy: context.userId ?? null,
        approvedAt: new Date(),
      },
    });
  }
}
