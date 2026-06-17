import { prisma } from '../../database/prisma.js';
import { logger } from '../../utils/logger.js';
import type { MarketingGraphState } from '../graphs/marketing-pipeline.state.js';

/**
 * load_context node — loads product, source assets, and analytics summary from the DB.
 */
export async function loadContextNode(
  state: MarketingGraphState,
): Promise<Partial<MarketingGraphState>> {
  logger.info({ campaignId: state.campaignId }, 'Node: load_context');

  const product = await prisma.product.findFirst({
    where: { id: state.productId, tenantId: state.tenantId },
    select: {
      name: true,
      description: true,
      features: true,
      category: true,
      targetAudience: true,
      brandGuidelines: true,
    },
  });

  if (!product) {
    throw new Error(`Product not found: ${state.productId}`);
  }

  const assets = await prisma.asset.findMany({
    where: {
      productId: state.productId,
      tenantId: state.tenantId,
      kind: 'SOURCE_PRODUCT_IMAGE',
    },
    select: { id: true, storageKey: true, mimeType: true },
    orderBy: { createdAt: 'asc' },
  });

  // Latest analytics recommendation as free-text context
  const recommendation = await prisma.analyticsRecommendation.findFirst({
    where: { tenantId: state.tenantId, productId: state.productId },
    orderBy: { createdAt: 'desc' },
    select: { summary: true },
  });

  return {
    productName: product.name,
    productDescription: product.description,
    productFeatures: product.features as string[],
    productCategory: product.category,
    targetAudience: product.targetAudience,
    brandGuidelines: product.brandGuidelines,
    sourceAssets: assets,
    analyticsContext: recommendation?.summary,
  };
}
