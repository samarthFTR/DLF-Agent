# Multi-Agent Workflow

## LangGraph State

```ts
type MarketingGraphState = {
  tenantId: string;
  campaignId: string;
  productId: string;
  platforms: SocialPlatform[];
  productInput?: ProductInputSnapshot;
  sourceImages?: AssetSnapshot[];
  brandGuidelines?: string | null;
  analyticsContext?: AnalyticsSummary;
  productAnalysis?: ProductAnalysisOutput;
  creativeStrategy?: CreativeStrategyOutput;
  captions?: PlatformCaptionOutput[];
  imageOutputs?: ImageProcessingOutput[];
  schedule?: PublishingScheduleOutput;
  analyticsRecommendations?: AnalyticsRecommendation[];
  qualityChecks?: QualityCheckResult[];
  errors?: AgentError[];
};
```

## Top-Level Graph

```text
load_context
  -> product_analysis_agent
  -> analytics_context_agent
  -> creative_strategy_agent
  -> caption_generation_agent
  -> image_processing_agent
  -> quality_gate
  -> persist_generated_campaign
  -> publishing_agent
  -> wait_for_publish_or_approval
  -> analytics_agent
```

## Agent 1: Product Analysis Agent

Input:

- Product name
- Product description
- Product features
- Product category
- Target audience
- Optional brand guidelines

Output:

- Product summary
- Ranked selling points
- Target audience motivations
- Customer pain points
- Objection handling
- Marketing angles
- Compliance-sensitive claims that need review

Design decision: this agent creates the shared strategic foundation. Later agents consume structured outputs instead of rereading raw product text repeatedly.

## Agent 2: Creative Strategy Agent

Input:

- Product analysis
- Brand guidelines
- Source image metadata
- Historical analytics summary

Output:

- Campaign theme options
- Selected theme
- Visual direction
- Platform creative briefs
- Image generation/editing prompts
- Negative prompts and brand constraints

Design decision: visual strategy is separated from caption generation because image prompts require different constraints than social copy.

## Agent 3: Caption Generation Agent

Input:

- Product analysis
- Creative strategy
- Platform list
- Brand guidelines
- Historical analytics summary

Output:

- Instagram caption with hashtags and CTA
- LinkedIn post with professional tone and CTA
- Facebook post with accessible community tone and CTA
- X/Twitter post with concise copy
- Caption alternatives for A/B testing

Design decision: platform adapters enforce length, hashtag count, and tone constraints after generation, so prompts are not the only guardrail.

## Agent 4: Image Processing Agent

Input:

- Source product images
- Creative strategy
- Platform list

Output:

- Stored source images
- AI-generated marketing creatives
- Platform-specific resized images
- Asset quality metadata

Initial platform sizes:

- Instagram square: `1080x1080`
- Instagram portrait: `1080x1350`
- LinkedIn feed: `1200x627`
- Facebook feed: `1200x630`
- X/Twitter feed: `1600x900`

Design decision: local storage is hidden behind a storage adapter so a later S3 migration does not affect agents or API handlers.

## Agent 5: Publishing Agent

Input:

- Approved generated content
- Social account connections
- Campaign publish mode
- Recommended schedule

Output:

- Publishing schedule
- Publish jobs
- External post IDs after publish
- Publish failure details

Design decision: publishing is handled through queued jobs because social APIs are slow, rate-limited, and failure-prone.

## Agent 6: Analytics Agent

Input:

- Published post IDs
- Platform analytics payloads
- Campaign metadata

Output:

- Normalized metrics
- Engagement summaries
- Winning hooks, CTAs, themes, and image formats
- Recommendations for future campaigns

Design decision: analytics are normalized into metric events instead of platform-specific tables so new social platforms can be added with less schema churn.

## Branching and Retry Rules

- Missing required product fields: stop with `needs_input`.
- Missing images: continue with captions and schedule, mark image generation as blocked.
- Brand guideline conflict: mark quality check as failed and require human review.
- Caption violates platform limits: retry caption generation once with validator feedback.
- Image generation fails: use provided image variants only and continue.
- Publish fails with transient platform error: retry through n8n or queue worker.
- Publish fails with auth error: mark social account reconnect required.

## Quality Gate

The quality gate validates:

- Required fields are present.
- Unsupported claims are flagged.
- Caption lengths fit platform limits.
- Hashtag counts fit platform policy.
- Brand guidelines are followed.
- Images exist at required dimensions.
- Publish jobs have idempotency keys.

