import { generateStructuredOutput } from '../../integrations/llm/gemini.js';
import { buildProductAnalysisPrompt } from '../prompts/product-analysis.prompt.js';
import {
  productAnalysisOutputSchema,
  type ProductAnalysisOutput,
} from './product-analysis.schemas.js';

export type ProductAnalysisInput = {
  name: string;
  description: string;
  features: string[];
  category: string;
  targetAudience: string;
  brandGuidelines?: string | null;
};

/**
 * Runs the Product Analysis Agent.
 * Calls Gemini with a structured prompt and validates the returned JSON.
 * Throws on model error or schema validation failure (caller should catch and log).
 */
export async function runProductAnalysisAgent(
  input: ProductAnalysisInput,
): Promise<ProductAnalysisOutput> {
  const { systemInstruction, userMessage } = buildProductAnalysisPrompt(input);

  return generateStructuredOutput(
    systemInstruction,
    userMessage,
    productAnalysisOutputSchema,
    { temperature: 0.4, maxOutputTokens: 2048 },
  );
}
