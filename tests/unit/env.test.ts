import '../setup-env.js';
import { describe, expect, it } from 'vitest';
import { loadEnv } from '../../src/config/env.js';

const validEnv = {
  NODE_ENV: 'test',
  PORT: '3000',
  API_BASE_URL: 'http://localhost:3000',
  FRONTEND_URL: 'http://localhost:5173',
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/ai_marketing_agent',
  JWT_ACCESS_SECRET: 'test-access-secret-value',
  JWT_REFRESH_SECRET: 'test-refresh-secret-value',
  TOKEN_ENCRYPTION_KEY: 'test-token-encryption-key',
  STORAGE_PROVIDER: 'local',
  LOCAL_STORAGE_ROOT: './storage',
  PUBLIC_ASSET_BASE_URL: 'http://localhost:3000/assets',
  LLM_DEFAULT_PROVIDER: 'gemini',
  GEMINI_TEXT_MODEL: 'gemini-2.5-flash',
  GEMINI_VISION_MODEL: 'gemini-2.5-flash',
  IMAGE_GENERATION_PROVIDER: 'gemini',
  REDIS_URL: 'redis://localhost:6379',
  N8N_BASE_URL: 'http://localhost:5678',
  N8N_WEBHOOK_SECRET: 'test-n8n-webhook-secret',
  INSTAGRAM_REDIRECT_URI: 'http://localhost:3000/api/v1/oauth/instagram/callback',
  LINKEDIN_REDIRECT_URI: 'http://localhost:3000/api/v1/oauth/linkedin/callback',
  FACEBOOK_REDIRECT_URI: 'http://localhost:3000/api/v1/oauth/facebook/callback',
  X_REDIRECT_URI: 'http://localhost:3000/api/v1/oauth/x/callback',
  LOG_LEVEL: 'info',
  RELEASE_VERSION: 'test',
};

describe('loadEnv', () => {
  it('loads typed environment config', () => {
    const env = loadEnv(validEnv);

    expect(env.PORT).toBe(3000);
    expect(env.LLM_DEFAULT_PROVIDER).toBe('gemini');
    expect(env.STORAGE_PROVIDER).toBe('local');
  });

  it('rejects invalid environment config', () => {
    expect(() => loadEnv({ ...validEnv, API_BASE_URL: 'invalid' })).toThrow(
      'Invalid environment configuration',
    );
  });
});
