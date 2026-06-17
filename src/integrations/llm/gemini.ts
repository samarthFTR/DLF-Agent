import { GoogleGenAI, type GenerateContentConfig } from '@google/genai';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

let _client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!_client) {
    _client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return _client;
}

export type LlmGenerateOptions = {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
};

/**
 * Generate a structured JSON response from Gemini and validate it against a Zod schema.
 * Throws if the model returns malformed JSON or a value that fails validation.
 */
export async function generateStructuredOutput<T>(
  systemInstruction: string,
  userMessage: string,
  schema: z.ZodType<T, any, any>,
  options: LlmGenerateOptions = {},
): Promise<T> {
  const model = options.model ?? env.GEMINI_TEXT_MODEL;
  const client = getClient();

  const config: GenerateContentConfig = {
    systemInstruction,
    temperature: options.temperature ?? 0.4,
    maxOutputTokens: options.maxOutputTokens ?? 4096,
    responseMimeType: 'application/json',
  };

  logger.debug({ model, userMessage: userMessage.slice(0, 120) }, 'Calling Gemini');

  const response = await client.models.generateContent({
    model,
    contents: [{ role: 'user', parts: [{ text: userMessage }] }],
    config,
  });

  const text = response.text;

  if (!text) {
    throw new Error('Gemini returned an empty response');
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Gemini returned non-JSON text: ${text.slice(0, 200)}`);
  }

  const result = schema.safeParse(parsed);

  if (!result.success) {
    throw new Error(
      `Gemini output failed schema validation: ${result.error.issues.map((i) => i.message).join('; ')}`,
    );
  }

  return result.data;
}
