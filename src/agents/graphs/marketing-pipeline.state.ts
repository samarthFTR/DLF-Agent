import type { SocialPlatform } from '@prisma/client';
import type { ProductAnalysisOutput } from '../product-analysis/product-analysis.schemas.js';
import type { CreativeStrategyOutput } from '../creative-strategy/creative-strategy.schemas.js';
import type { PlatformCaption } from '../caption-generation/caption-generation.schemas.js';
import type { ImageProcessingOutput } from '../image-processing/image-processing.schemas.js';

export type AssetSnapshot = {
  id: string;
  storageKey: string;
  mimeType: string;
};

export type AgentError = {
  agent: string;
  message: string;
  fatal: boolean;
};

/**
 * The shared state object that flows through the LangGraph marketing pipeline.
 * Each node reads from and writes to this object.
 */
export type MarketingGraphState = {
  // Identifiers
  tenantId: string;
  campaignId: string;
  agentRunId: string;
  productId: string;
  platforms: SocialPlatform[];

  // Loaded context
  productName?: string;
  productDescription?: string;
  productFeatures?: string[];
  productCategory?: string;
  targetAudience?: string;
  brandGuidelines?: string | null;
  sourceAssets?: AssetSnapshot[];
  analyticsContext?: string;

  // Agent outputs
  productAnalysis?: ProductAnalysisOutput;
  creativeStrategy?: CreativeStrategyOutput;
  captions?: PlatformCaption[];
  imageOutputs?: ImageProcessingOutput;

  // Quality and errors
  qualityCheckPassed?: boolean;
  qualityCheckFindings?: string[];
  errors?: AgentError[];
};
