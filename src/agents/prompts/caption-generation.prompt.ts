import type { ProductAnalysisOutput } from '../product-analysis/product-analysis.schemas.js';
import type { CreativeStrategyOutput } from '../creative-strategy/creative-strategy.schemas.js';
import { PLATFORM_CONSTRAINTS } from '../../integrations/llm/platform-constraints.js';

export function buildCaptionGenerationPrompt(input: {
  productName: string;
  platforms: string[];
  productAnalysis: ProductAnalysisOutput;
  creativeStrategy: CreativeStrategyOutput;
  brandGuidelines?: string | null;
  validationErrors?: string[];
}): { systemInstruction: string; userMessage: string } {
  const systemInstruction = `You are an expert social media copywriter.
Your task is to write platform-specific social media posts for a product launch campaign.
Return ONLY a valid JSON object. No markdown or explanation.
Respect the character limits and hashtag rules for each platform strictly.`;

  const platformDetails = input.platforms
    .map((p) => {
      const c = PLATFORM_CONSTRAINTS[p];
      if (!c) {
        return `${p}: no constraints defined`;
      }
      return `${p}: max ${c.maxCaptionLength} chars, max ${c.maxHashtags} hashtags, tone: ${c.toneDescriptor}, CTA style: ${c.ctaStyle}`;
    })
    .join('\n');

  const retryNote =
    input.validationErrors && input.validationErrors.length > 0
      ? `\n⚠️ Previous attempt had these violations — fix them:\n${input.validationErrors.join('\n')}`
      : '';

  const userMessage = `Write social media captions for: ${input.productName}

Campaign Theme: ${input.creativeStrategy.campaignTheme}
Tagline: ${input.creativeStrategy.campaignTagline}
Product Summary: ${input.productAnalysis.summary}
Top Selling Points: ${input.productAnalysis.sellingPoints
    .slice(0, 3)
    .map((sp) => sp.point)
    .join(', ')}
${input.brandGuidelines ? `Brand Guidelines: ${input.brandGuidelines}` : ''}
${retryNote}

Platform Rules:
${platformDetails}

Return a JSON object:
{
  "captions": [
    {
      "platform": "INSTAGRAM|LINKEDIN|FACEBOOK|X",
      "caption": "string",
      "hashtags": ["string"],
      "callToAction": "string (optional)",
      "alternativeCaption": "string (optional A/B variant)"
    }
  ]
}
Only include captions for: ${input.platforms.join(', ')}.`;

  return { systemInstruction, userMessage };
}
