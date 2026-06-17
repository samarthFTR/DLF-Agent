import { prisma } from '../../database/prisma.js';
import { logger } from '../../utils/logger.js';
import type { MarketingGraphState } from '../graphs/marketing-pipeline.state.js';

/**
 * persist_campaign node — writes GeneratedPosts, CreativeBriefs, resized asset records,
 * and updates the campaign status to NEEDS_REVIEW.
 */
export async function persistCampaignNode(
  state: MarketingGraphState,
): Promise<Partial<MarketingGraphState>> {
  logger.info({ campaignId: state.campaignId }, 'Node: persist_campaign');

  // Persist CreativeBriefs
  if (state.creativeStrategy?.platformBriefs) {
    for (const brief of state.creativeStrategy.platformBriefs) {
      await prisma.creativeBrief.create({
        data: {
          campaignId: state.campaignId,
          platform: brief.platform as never,
          theme: brief.theme,
          visualDirection: brief.visualDirection,
          imagePrompt: brief.imagePrompt,
          negativePrompt: brief.negativePrompt ?? null,
        },
      });
    }
  }

  // Persist GeneratedPosts
  if (state.captions) {
    for (const caption of state.captions) {
      await prisma.generatedPost.create({
        data: {
          tenantId: state.tenantId,
          campaignId: state.campaignId,
          agentRunId: state.agentRunId,
          platform: caption.platform as never,
          caption: caption.caption,
          hashtags: caption.hashtags,
          callToAction: caption.callToAction ?? null,
          promptVersion: '1.0.0',
          modelMetadata: {
            theme: state.creativeStrategy?.campaignTheme ?? '',
            tagline: state.creativeStrategy?.campaignTagline ?? '',
            alternativeCaption: caption.alternativeCaption ?? null,
          },
        },
      });
    }
  }

  // Persist resized asset records
  if (state.imageOutputs?.resizedAssets) {
    for (const resized of state.imageOutputs.resizedAssets) {
      await prisma.asset.create({
        data: {
          tenantId: state.tenantId,
          campaignId: state.campaignId,
          productId: state.productId,
          kind: 'RESIZED_CREATIVE',
          storageKey: resized.storageKey,
          mimeType: 'image/jpeg',
          width: resized.width,
          height: resized.height,
          metadata: {
            platform: resized.platform,
            label: resized.label,
            sourceAssetId: resized.sourceAssetId,
          },
        },
      });
    }
  }

  // Persist quality check record
  await prisma.qualityCheck.create({
    data: {
      campaignId: state.campaignId,
      checkName: 'pre-publish-quality-gate',
      status: state.qualityCheckPassed ? 'passed' : 'failed',
      severity: state.qualityCheckPassed ? 'info' : 'warn',
      findings: (state.qualityCheckFindings ?? []) as never,
    },
  });

  // Update campaign status
  await prisma.campaign.update({
    where: { id: state.campaignId },
    data: { status: 'NEEDS_REVIEW' },
  });

  logger.info({ campaignId: state.campaignId }, 'Campaign content persisted');

  return {};
}
