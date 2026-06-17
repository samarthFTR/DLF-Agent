import { StateGraph, END, START } from '@langchain/langgraph';
import { Annotation } from '@langchain/langgraph';
import type { SocialPlatform } from '@prisma/client';
import type { ProductAnalysisOutput } from '../product-analysis/product-analysis.schemas.js';
import type { CreativeStrategyOutput } from '../creative-strategy/creative-strategy.schemas.js';
import type { PlatformCaption } from '../caption-generation/caption-generation.schemas.js';
import type { ImageProcessingOutput } from '../image-processing/image-processing.schemas.js';
import type { AssetSnapshot, AgentError } from './marketing-pipeline.state.js';
import { loadContextNode } from '../nodes/load-context.node.js';
import { qualityGateNode } from '../nodes/quality-gate.node.js';
import { persistCampaignNode } from '../nodes/persist-campaign.node.js';
import { runProductAnalysisAgent } from '../product-analysis/product-analysis.agent.js';
import { runCreativeStrategyAgent } from '../creative-strategy/creative-strategy.agent.js';
import { runCaptionGenerationAgent } from '../caption-generation/caption-generation.agent.js';
import { runImageProcessingAgent } from '../image-processing/image-processing.agent.js';
import { logger } from '../../utils/logger.js';

// ── State Annotation ──────────────────────────────────────────────────────────

const GraphState = Annotation.Root({
  tenantId: Annotation<string>(),
  campaignId: Annotation<string>(),
  agentRunId: Annotation<string>(),
  productId: Annotation<string>(),
  platforms: Annotation<SocialPlatform[]>(),
  productName: Annotation<string | undefined>(),
  productDescription: Annotation<string | undefined>(),
  productFeatures: Annotation<string[] | undefined>(),
  productCategory: Annotation<string | undefined>(),
  targetAudience: Annotation<string | undefined>(),
  brandGuidelines: Annotation<string | null | undefined>(),
  sourceAssets: Annotation<AssetSnapshot[] | undefined>(),
  analyticsContext: Annotation<string | undefined>(),
  productAnalysis: Annotation<ProductAnalysisOutput | undefined>(),
  creativeStrategy: Annotation<CreativeStrategyOutput | undefined>(),
  captions: Annotation<PlatformCaption[] | undefined>(),
  imageOutputs: Annotation<ImageProcessingOutput | undefined>(),
  qualityCheckPassed: Annotation<boolean | undefined>(),
  qualityCheckFindings: Annotation<string[] | undefined>(),
  errors: Annotation<AgentError[] | undefined>(),
});

// ── Agent Node Wrappers ───────────────────────────────────────────────────────

async function productAnalysisNode(state: typeof GraphState.State) {
  logger.info({ campaignId: state.campaignId }, 'Node: product_analysis');

  const analysis = await runProductAnalysisAgent({
    name: state.productName!,
    description: state.productDescription!,
    features: state.productFeatures!,
    category: state.productCategory!,
    targetAudience: state.targetAudience!,
    brandGuidelines: state.brandGuidelines,
  });

  return { productAnalysis: analysis };
}

async function creativeStrategyNode(state: typeof GraphState.State) {
  logger.info({ campaignId: state.campaignId }, 'Node: creative_strategy');

  const strategy = await runCreativeStrategyAgent({
    productName: state.productName!,
    platforms: state.platforms as string[],
    productAnalysis: state.productAnalysis!,
    brandGuidelines: state.brandGuidelines,
    analyticsContext: state.analyticsContext,
  });

  return { creativeStrategy: strategy };
}

async function captionGenerationNode(state: typeof GraphState.State) {
  logger.info({ campaignId: state.campaignId }, 'Node: caption_generation');

  const output = await runCaptionGenerationAgent({
    productName: state.productName!,
    platforms: state.platforms as string[],
    productAnalysis: state.productAnalysis!,
    creativeStrategy: state.creativeStrategy!,
    brandGuidelines: state.brandGuidelines,
  });

  return { captions: output.captions };
}

async function imageProcessingNode(state: typeof GraphState.State) {
  logger.info({ campaignId: state.campaignId }, 'Node: image_processing');

  const output = await runImageProcessingAgent({
    platforms: state.platforms as string[],
    sourceAssets: state.sourceAssets ?? [],
    imageGenerationEnabled: state.creativeStrategy?.imageGenerationEnabled ?? false,
  });

  return { imageOutputs: output };
}

// ── Conditional Edge ──────────────────────────────────────────────────────────

function afterQualityGate(state: typeof GraphState.State): 'persist_campaign' | typeof END {
  return state.qualityCheckPassed ? 'persist_campaign' : END;
}

// ── Graph Assembly ────────────────────────────────────────────────────────────

const graph = new StateGraph(GraphState)
  .addNode('load_context', loadContextNode)
  .addNode('product_analysis', productAnalysisNode)
  .addNode('creative_strategy', creativeStrategyNode)
  .addNode('caption_generation', captionGenerationNode)
  .addNode('image_processing', imageProcessingNode)
  .addNode('quality_gate', qualityGateNode)
  .addNode('persist_campaign', persistCampaignNode)
  .addEdge(START, 'load_context')
  .addEdge('load_context', 'product_analysis')
  .addEdge('product_analysis', 'creative_strategy')
  .addEdge('creative_strategy', 'caption_generation')
  .addEdge('caption_generation', 'image_processing')
  .addEdge('image_processing', 'quality_gate')
  .addConditionalEdges('quality_gate', afterQualityGate, {
    persist_campaign: 'persist_campaign',
    [END]: END,
  })
  .addEdge('persist_campaign', END);

export const marketingPipelineGraph = graph.compile();

export type MarketingPipelineInput = {
  tenantId: string;
  campaignId: string;
  agentRunId: string;
  productId: string;
  platforms: SocialPlatform[];
};
