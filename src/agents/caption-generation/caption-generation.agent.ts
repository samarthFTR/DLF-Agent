import { generateStructuredOutput } from '../../integrations/llm/gemini.js';
import { buildCaptionGenerationPrompt } from '../prompts/caption-generation.prompt.js';
import {
  captionGenerationOutputSchema,
  type CaptionGenerationOutput,
} from './caption-generation.schemas.js';
import { validateCaptions } from './caption-validator.js';
import type { ProductAnalysisOutput } from '../product-analysis/product-analysis.schemas.js';
import type { CreativeStrategyOutput } from '../creative-strategy/creative-strategy.schemas.js';
import { logger } from '../../utils/logger.js';

const MAX_RETRIES = 1;

export type CaptionGenerationInput = {
  productName: string;
  platforms: string[];
  productAnalysis: ProductAnalysisOutput;
  creativeStrategy: CreativeStrategyOutput;
  brandGuidelines?: string | null;
};

/**
 * Runs the Caption Generation Agent.
 * Generates captions, validates against platform limits, and retries once on violation.
 */
export async function runCaptionGenerationAgent(
  input: CaptionGenerationInput,
): Promise<CaptionGenerationOutput> {
  let validationErrors: string[] = [];

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const { systemInstruction, userMessage } = buildCaptionGenerationPrompt({
      ...input,
      validationErrors: attempt > 0 ? validationErrors : undefined,
    });

    const output = await generateStructuredOutput(
      systemInstruction,
      userMessage,
      captionGenerationOutputSchema,
      { temperature: 0.7, maxOutputTokens: 4096 },
    );

    const errors = validateCaptions(output.captions);

    if (errors.length === 0) {
      return output;
    }

    validationErrors = errors.map((e) => `[${e.platform}] ${e.field}: ${e.message}`);
    logger.warn({ attempt, validationErrors }, 'Caption validation failed — retrying');
  }

  // After max retries, return the last result with truncation enforcement
  const { systemInstruction, userMessage } = buildCaptionGenerationPrompt({
    ...input,
    validationErrors,
  });

  const finalOutput = await generateStructuredOutput(
    systemInstruction,
    userMessage,
    captionGenerationOutputSchema,
    { temperature: 0.3, maxOutputTokens: 4096 },
  );

  return finalOutput;
}
