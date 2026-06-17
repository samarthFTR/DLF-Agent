import '../setup-env.js';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prismaMock } from '../prisma-mock.js';

vi.mock('../../src/database/prisma.js', () => ({
  prisma: prismaMock,
  checkDatabaseReadiness: vi.fn().mockResolvedValue(true),
  disconnectPrisma: vi.fn(),
}));

// Mock Gemini output generation
vi.mock('../../src/integrations/llm/gemini.ts', () => ({
  generateStructuredOutput: vi.fn().mockResolvedValue({
    recommendations: [
      {
        category: 'creative',
        summary: 'Instagram posts perform better with longer captions.',
        evidence: ['Instagram CTR was 4.2%'],
      },
    ],
  }),
}));

const tenantId = '11111111-1111-4111-8111-111111111111';
const campaignId = '33333333-3333-4333-8333-333333333333';
const productId = '22222222-2222-4222-8222-222222222222';

const campaignRecord = {
  id: campaignId,
  tenantId,
  productId,
  name: 'Summer Drop',
  platforms: ['INSTAGRAM'],
  publishMode: 'MANUAL',
  scheduledAt: null,
  approvedBy: null,
  approvedAt: null,
  createdBy: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const analyticsEventRecord = {
  id: '88888888-8888-8888-8888-888888888888',
  tenantId,
  campaignId,
  postId: null,
  platform: 'INSTAGRAM',
  externalPostId: null,
  metricName: 'CTR',
  metricValue: 4.2,
  measuredAt: new Date('2026-01-02T00:00:00.000Z'),
  rawPayload: {},
  createdAt: new Date('2026-01-02T00:00:00.000Z'),
};

const recommendationRecord = {
  id: '99999999-9999-9999-9999-999999999999',
  tenantId,
  campaignId,
  productId,
  category: 'creative',
  summary: 'Instagram posts perform better with longer captions.',
  evidence: ['Instagram CTR was 4.2%'],
  createdAt: new Date('2026-01-02T00:00:00.000Z'),
};

describe('analytics routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gets campaign analytics events', async () => {
    prismaMock.campaign.findFirst.mockResolvedValue(campaignRecord);
    prismaMock.analyticsEvent.findMany.mockResolvedValue([analyticsEventRecord]);
    const { createApp } = await import('../../src/app.js');

    const response = await request(createApp())
      .get(`/api/v1/campaigns/${campaignId}/analytics`)
      .set('x-tenant-id', tenantId);

    expect(response.status).toBe(200);
    expect(response.body.events).toHaveLength(1);
    expect(response.body.events[0].metricName).toBe('CTR');
    expect(prismaMock.analyticsEvent.findMany).toHaveBeenCalledOnce();
  });

  it('gets recommendations', async () => {
    prismaMock.analyticsRecommendation.findMany.mockResolvedValue([recommendationRecord]);
    const { createApp } = await import('../../src/app.js');

    const response = await request(createApp())
      .get('/api/v1/analytics/recommendations')
      .set('x-tenant-id', tenantId);

    expect(response.status).toBe(200);
    expect(response.body.recommendations).toHaveLength(1);
    expect(response.body.recommendations[0].summary).toContain('longer captions');
    expect(prismaMock.analyticsRecommendation.findMany).toHaveBeenCalledOnce();
  });

  it('imports metrics and generates recommendations', async () => {
    prismaMock.campaign.findFirst.mockResolvedValue(campaignRecord);
    prismaMock.analyticsEvent.createMany.mockResolvedValue({ count: 1 });
    prismaMock.analyticsRecommendation.create.mockResolvedValue(recommendationRecord);
    prismaMock.auditEvent.create.mockResolvedValue({});
    const { createApp } = await import('../../src/app.js');

    const response = await request(createApp())
      .post('/api/v1/analytics/import')
      .set('x-tenant-id', tenantId)
      .send({
        campaignId,
        metrics: [
          {
            platform: 'INSTAGRAM',
            metricName: 'CTR',
            metricValue: 4.2,
            measuredAt: '2026-01-02T00:00:00Z',
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body.imported).toBe(1);
    expect(response.body.recommendations).toHaveLength(1);
    expect(prismaMock.analyticsEvent.createMany).toHaveBeenCalledOnce();
    expect(prismaMock.analyticsRecommendation.create).toHaveBeenCalledOnce();
    expect(prismaMock.auditEvent.create).toHaveBeenCalledOnce();
  });
});
