import { generateStructuredOutput } from '../../integrations/llm/gemini.js';
import type { ProductAnalysisOutput } from '../product-analysis/product-analysis.schemas.js';
import { z } from 'zod';

const analyticsRecommendationSchema = z.object({
  recommendations: z.array(
    z.object({
      category: z.string(),
      summary: z.string(),
      evidence: z.array(z.string()),
    }),
  ),
});

type AnalyticsRecommendationOutput = z.infer<typeof analyticsRecommendationSchema>;

export type AnalyticsInput = {
  campaignName: string;
  platforms: string[];
  metrics: Array<{
    platform: string;
    metricName: string;
    metricValue: number;
    measuredAt: string;
  }>;
};

/**
 * Analytics Agent — summarises campaign metrics and generates improvement recommendations.
 */
export async function runAnalyticsAgent(
  input: AnalyticsInput,
): Promise<AnalyticsRecommendationOutput> {
  const systemInstruction = `You are a social media analytics expert.
Analyse the provided campaign metrics and produce actionable recommendations for future campaigns.
Return ONLY valid JSON. No markdown.`;

  const metricsText = input.metrics
    .map((m) => `[${m.platform}] ${m.metricName}: ${m.metricValue} (${m.measuredAt})`)
    .join('\n');

  const userMessage = `Analyse the following campaign metrics and return recommendations.

Campaign: ${input.campaignName}
Platforms: ${input.platforms.join(', ')}

Metrics:
${metricsText}

Return JSON:
{
  "recommendations": [
    { "category": "string", "summary": "string", "evidence": ["string"] }
  ]
}`;

  return generateStructuredOutput(
    systemInstruction,
    userMessage,
    analyticsRecommendationSchema,
    { temperature: 0.3, maxOutputTokens: 2048 },
  );
}
