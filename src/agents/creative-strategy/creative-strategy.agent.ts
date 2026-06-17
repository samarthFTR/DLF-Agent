import { generateStructuredOutput } from '../../integrations/llm/gemini.js';
import { buildCreativeStrategyPrompt } from '../prompts/creative-strategy.prompt.js';
import {
  creativeStrategyOutputSchema,
  type CreativeStrategyOutput,
} from './creative-strategy.schemas.js';
import type { ProductAnalysisOutput } from '../product-analysis/product-analysis.schemas.js';

export type CreativeStrategyInput = {
  productName: string;
  platforms: string[];
  productAnalysis: ProductAnalysisOutput;
  brandGuidelines?: string | null;
  analyticsContext?: string;
};

export async function runCreativeStrategyAgent(
  input: CreativeStrategyInput,
): Promise<CreativeStrategyOutput> {
  const { systemInstruction, userMessage } = buildCreativeStrategyPrompt(input);

  return generateStructuredOutput(
    systemInstruction,
    userMessage,
    creativeStrategyOutputSchema,
    { temperature: 0.7, maxOutputTokens: 3072 },
  );
}
