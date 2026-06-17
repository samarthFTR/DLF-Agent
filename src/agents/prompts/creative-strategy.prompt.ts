import type { ProductAnalysisOutput } from '../product-analysis/product-analysis.schemas.js';

export function buildCreativeStrategyPrompt(input: {
  productName: string;
  platforms: string[];
  productAnalysis: ProductAnalysisOutput;
  brandGuidelines?: string | null;
  analyticsContext?: string;
}): { systemInstruction: string; userMessage: string } {
  const systemInstruction = `You are a creative director specialising in social media marketing campaigns.
Your task is to develop a cohesive visual and creative strategy for a multi-platform campaign.
Return ONLY a valid JSON object. No markdown or explanation.`;

  const userMessage = `Develop a creative strategy for the following product and marketing analysis.

Product: ${input.productName}
Target Platforms: ${input.platforms.join(', ')}

Product Summary: ${input.productAnalysis.summary}

Top Marketing Angles:
${input.productAnalysis.marketingAngles.map((a, i) => `${i + 1}. ${a}`).join('\n')}

Top Selling Points:
${input.productAnalysis.sellingPoints
  .filter((sp) => sp.strength === 'high')
  .map((sp) => `- ${sp.point}`)
  .join('\n')}
${input.brandGuidelines ? `\nBrand Guidelines:\n${input.brandGuidelines}` : ''}
${input.analyticsContext ? `\nHistorical Analytics Insights:\n${input.analyticsContext}` : ''}

Return a JSON object with these fields:
{
  "campaignTheme": "string",
  "campaignTagline": "string",
  "colorMood": "string",
  "imageGenerationEnabled": boolean,
  "platformBriefs": [
    {
      "platform": "INSTAGRAM|LINKEDIN|FACEBOOK|X",
      "theme": "string",
      "visualDirection": "string",
      "imagePrompt": "string",
      "negativePrompt": "string (optional)"
    }
  ]
}
Only include briefs for the requested platforms: ${input.platforms.join(', ')}.`;

  return { systemInstruction, userMessage };
}
