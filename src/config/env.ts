import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  API_BASE_URL: z.string().url(),
  FRONTEND_URL: z.string().url(),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),
  TOKEN_ENCRYPTION_KEY: z.string().min(16),
  STORAGE_PROVIDER: z.enum(['local']).default('local'),
  LOCAL_STORAGE_ROOT: z.string().default('./storage'),
  PUBLIC_ASSET_BASE_URL: z.string().url(),
  LLM_DEFAULT_PROVIDER: z.enum(['gemini']).default('gemini'),
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_TEXT_MODEL: z.string().default('gemini-2.5-flash'),
  GEMINI_VISION_MODEL: z.string().default('gemini-2.5-flash'),
  IMAGE_GENERATION_PROVIDER: z.string().default('gemini'),
  REDIS_URL: z.string().url(),
  QUEUE_PREFIX: z.string().default('ai-marketing-agent'),
  N8N_BASE_URL: z.string().url(),
  N8N_WEBHOOK_SECRET: z.string().min(16),
  INSTAGRAM_CLIENT_ID: z.string().optional().default(''),
  INSTAGRAM_CLIENT_SECRET: z.string().optional().default(''),
  INSTAGRAM_REDIRECT_URI: z.string().url(),
  LINKEDIN_CLIENT_ID: z.string().optional().default(''),
  LINKEDIN_CLIENT_SECRET: z.string().optional().default(''),
  LINKEDIN_REDIRECT_URI: z.string().url(),
  FACEBOOK_CLIENT_ID: z.string().optional().default(''),
  FACEBOOK_CLIENT_SECRET: z.string().optional().default(''),
  FACEBOOK_REDIRECT_URI: z.string().url(),
  X_CLIENT_ID: z.string().optional().default(''),
  X_CLIENT_SECRET: z.string().optional().default(''),
  X_REDIRECT_URI: z.string().url(),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional().default(''),
  RELEASE_VERSION: z.string().default('local'),
});

export type AppEnv = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const message = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${message}`);
  }

  return result.data;
}

export const env = loadEnv();

