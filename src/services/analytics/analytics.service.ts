import { prisma } from '../../database/prisma.js';
import { AppError } from '../../utils/errors.js';
import { runAnalyticsAgent } from '../../agents/analytics/analytics.agent.js';
import type { RequestContext } from '../../types/request-context.js';
import { z } from 'zod';

export const importMetricsSchema = z.object({
  campaignId: z.string().uuid(),
  metrics: z.array(
    z.object({
      postId: z.string().uuid().optional(),
      platform: z.enum(['INSTAGRAM', 'LINKEDIN', 'FACEBOOK', 'X']),
      externalPostId: z.string().optional(),
      metricName: z.string().min(1),
      metricValue: z.number(),
      measuredAt: z.string().datetime(),
    }),
  ).min(1),
});

export type ImportMetricsInput = z.infer<typeof importMetricsSchema>;

export class AnalyticsService {
  /** Import raw metrics and trigger recommendation generation. */
  public async importMetrics(context: RequestContext, input: ImportMetricsInput) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: input.campaignId, tenantId: context.tenantId },
      select: { id: true, name: true, productId: true, platforms: true },
    });
    if (!campaign) throw new AppError(404, 'NOT_FOUND', 'Campaign not found');

    // Persist all metric events
    await prisma.analyticsEvent.createMany({
      data: input.metrics.map((m) => ({
        tenantId: context.tenantId,
        campaignId: input.campaignId,
        postId: m.postId ?? null,
        platform: m.platform,
        externalPostId: m.externalPostId ?? null,
        metricName: m.metricName,
        metricValue: m.metricValue,
        measuredAt: new Date(m.measuredAt),
        rawPayload: m as never,
      })),
    });

    // Generate recommendations via the analytics agent
    const agentOutput = await runAnalyticsAgent({
      campaignName: campaign.name,
      platforms: campaign.platforms as string[],
      metrics: input.metrics.map((m) => ({
        platform: m.platform,
        metricName: m.metricName,
        metricValue: m.metricValue,
        measuredAt: m.measuredAt,
      })),
    });

    // Persist recommendations
    const recommendations = await Promise.all(
      agentOutput.recommendations.map((rec) =>
        prisma.analyticsRecommendation.create({
          data: {
            tenantId: context.tenantId,
            campaignId: campaign.id,
            productId: campaign.productId,
            category: rec.category,
            summary: rec.summary,
            evidence: rec.evidence as never,
          },
        }),
      ),
    );

    return { imported: input.metrics.length, recommendations };
  }

  public async getCampaignAnalytics(context: RequestContext, campaignId: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, tenantId: context.tenantId },
    });
    if (!campaign) throw new AppError(404, 'NOT_FOUND', 'Campaign not found');

    return prisma.analyticsEvent.findMany({
      where: { campaignId, tenantId: context.tenantId },
      orderBy: { measuredAt: 'desc' },
    });
  }

  public async getRecommendations(context: RequestContext) {
    return prisma.analyticsRecommendation.findMany({
      where: { tenantId: context.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
