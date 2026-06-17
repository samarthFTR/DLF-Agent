import '../setup-env.js';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/database/prisma.js', () => ({
  checkDatabaseReadiness: vi.fn().mockResolvedValue(true),
  disconnectPrisma: vi.fn(),
}));

describe('health routes', () => {
  it('returns service health', async () => {
    const { createApp } = await import('../../src/app.js');
    const app = createApp();

    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: 'ok',
      service: 'ai-marketing-agent',
      version: 'test',
    });
    expect(response.headers['x-request-id']).toBeDefined();
  });

  it('returns readiness checks', async () => {
    const { createApp } = await import('../../src/app.js');
    const app = createApp();

    const response = await request(app).get('/api/v1/ready');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ready',
      checks: {
        database: 'ok',
      },
    });
  });
});

