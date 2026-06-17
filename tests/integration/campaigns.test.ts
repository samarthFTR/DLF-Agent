import '../setup-env.js';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prismaMock } from '../prisma-mock.js';

vi.mock('../../src/database/prisma.js', () => ({
  prisma: prismaMock,
  checkDatabaseReadiness: vi.fn().mockResolvedValue(true),
  disconnectPrisma: vi.fn(),
}));

const tenantId = '11111111-1111-4111-8111-111111111111';
const productId = '22222222-2222-4222-8222-222222222222';
const campaignId = '33333333-3333-4333-8333-333333333333';
const runId = '44444444-4444-4444-8444-444444444444';

const productRecord = {
  id: productId,
  tenantId,
  name: 'Launch Bottle',
  description: 'A premium insulated bottle.',
  features: ['Cold 24h'],
  category: 'Drinkware',
  targetAudience: 'Urban professionals',
  brandGuidelines: null,
  metadata: {},
  createdBy: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const campaignRecord = {
  id: campaignId,
  tenantId,
  productId,
  name: 'Summer Drop',
  status: 'DRAFT',
  platforms: ['INSTAGRAM', 'LINKEDIN'],
  publishMode: 'MANUAL',
  scheduledAt: null,
  approvedBy: null,
  approvedAt: null,
  createdBy: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const runRecord = {
  id: runId,
  tenantId,
  campaignId,
  status: 'QUEUED',
  graphName: 'marketing-pipeline',
  graphVersion: '0.1.0',
  currentAgent: null,
  llmProvider: 'gemini',
  llmModel: 'gemini-1.5-pro',
  inputSnapshot: {},
  outputSnapshot: {},
  error: null,
  startedAt: null,
  finishedAt: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

const eventRecord = {
  id: '55555555-5555-4555-8555-555555555555',
  agentRunId: runId,
  agentName: 'orchestrator',
  eventType: 'run.queued',
  payload: {},
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('campaign routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires tenant context', async () => {
    const { createApp } = await import('../../src/app.js');
    const response = await request(createApp()).get('/api/v1/campaigns');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 404 when product does not belong to tenant on create', async () => {
    prismaMock.product.findFirst.mockResolvedValue(null);
    const { createApp } = await import('../../src/app.js');

    const response = await request(createApp())
      .post('/api/v1/campaigns')
      .set('x-tenant-id', tenantId)
      .send({
        productId,
        name: 'Summer Drop',
        platforms: ['INSTAGRAM'],
        publishMode: 'MANUAL',
      });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('creates a campaign', async () => {
    prismaMock.product.findFirst.mockResolvedValue(productRecord);
    prismaMock.campaign.create.mockResolvedValue(campaignRecord);
    const { createApp } = await import('../../src/app.js');

    const response = await request(createApp())
      .post('/api/v1/campaigns')
      .set('x-tenant-id', tenantId)
      .send({
        productId,
        name: 'Summer Drop',
        platforms: ['INSTAGRAM', 'LINKEDIN'],
        publishMode: 'MANUAL',
      });

    expect(response.status).toBe(201);
    expect(response.body.campaign.id).toBe(campaignId);
    expect(prismaMock.campaign.create).toHaveBeenCalledOnce();
  });

  it('returns 400 for invalid campaign input', async () => {
    const { createApp } = await import('../../src/app.js');

    const response = await request(createApp())
      .post('/api/v1/campaigns')
      .set('x-tenant-id', tenantId)
      .send({ name: '' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('lists campaigns', async () => {
    prismaMock.campaign.findMany.mockResolvedValue([campaignRecord]);
    const { createApp } = await import('../../src/app.js');

    const response = await request(createApp())
      .get('/api/v1/campaigns')
      .set('x-tenant-id', tenantId);

    expect(response.status).toBe(200);
    expect(response.body.campaigns).toHaveLength(1);
  });

  it('gets a campaign by id', async () => {
    prismaMock.campaign.findFirst.mockResolvedValue(campaignRecord);
    const { createApp } = await import('../../src/app.js');

    const response = await request(createApp())
      .get(`/api/v1/campaigns/${campaignId}`)
      .set('x-tenant-id', tenantId);

    expect(response.status).toBe(200);
    expect(response.body.campaign.name).toBe('Summer Drop');
  });

  it('returns 404 for unknown campaign', async () => {
    prismaMock.campaign.findFirst.mockResolvedValue(null);
    const { createApp } = await import('../../src/app.js');

    const response = await request(createApp())
      .get(`/api/v1/campaigns/${campaignId}`)
      .set('x-tenant-id', tenantId);

    expect(response.status).toBe(404);
  });
});

describe('agent run routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates an agent run (202 Accepted)', async () => {
    prismaMock.campaign.findFirst.mockResolvedValue(campaignRecord);
    prismaMock.agentRun.create.mockResolvedValue(runRecord);
    prismaMock.agentRunEvent.create.mockResolvedValue(eventRecord);
    const { createApp } = await import('../../src/app.js');

    const response = await request(createApp())
      .post(`/api/v1/campaigns/${campaignId}/runs`)
      .set('x-tenant-id', tenantId);

    expect(response.status).toBe(202);
    expect(response.body.run.status).toBe('QUEUED');
    expect(prismaMock.agentRunEvent.create).toHaveBeenCalledOnce();
  });

  it('lists runs for a campaign', async () => {
    prismaMock.campaign.findFirst.mockResolvedValue(campaignRecord);
    prismaMock.agentRun.findMany.mockResolvedValue([runRecord]);
    const { createApp } = await import('../../src/app.js');

    const response = await request(createApp())
      .get(`/api/v1/campaigns/${campaignId}/runs`)
      .set('x-tenant-id', tenantId);

    expect(response.status).toBe(200);
    expect(response.body.runs).toHaveLength(1);
  });

  it('cancels a queued run', async () => {
    prismaMock.agentRun.findFirst.mockResolvedValue(runRecord);
    prismaMock.agentRun.update.mockResolvedValue({ ...runRecord, status: 'CANCELLED' });
    prismaMock.agentRunEvent.create.mockResolvedValue(eventRecord);
    const { createApp } = await import('../../src/app.js');

    const response = await request(createApp())
      .post(`/api/v1/campaigns/${campaignId}/runs/${runId}/cancel`)
      .set('x-tenant-id', tenantId);

    expect(response.status).toBe(200);
    expect(response.body.run.status).toBe('CANCELLED');
  });

  it('returns 409 when cancelling an already-terminal run', async () => {
    prismaMock.agentRun.findFirst.mockResolvedValue({ ...runRecord, status: 'SUCCEEDED' });
    const { createApp } = await import('../../src/app.js');

    const response = await request(createApp())
      .post(`/api/v1/campaigns/${campaignId}/runs/${runId}/cancel`)
      .set('x-tenant-id', tenantId);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('CONFLICT');
  });

  it('gets run events', async () => {
    prismaMock.agentRun.findFirst.mockResolvedValue(runRecord);
    prismaMock.agentRunEvent.findMany.mockResolvedValue([eventRecord]);
    const { createApp } = await import('../../src/app.js');

    const response = await request(createApp())
      .get(`/api/v1/campaigns/${campaignId}/runs/${runId}/events`)
      .set('x-tenant-id', tenantId);

    expect(response.status).toBe(200);
    expect(response.body.events).toHaveLength(1);
    expect(response.body.events[0].eventType).toBe('run.queued');
  });
});
