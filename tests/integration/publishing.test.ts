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
const campaignId = '33333333-3333-4333-8333-333333333333';
const postId = '22222222-2222-4222-8222-222222222222';
const socialAccountId = '55555555-5555-5555-5555-555555555555';
const publishJobId = '77777777-7777-7777-7777-777777777777';

const socialAccountRecord = {
  id: socialAccountId,
  tenantId,
  platform: 'INSTAGRAM',
  accountName: 'test_instagram',
  externalAccountId: 'ext_inst_123',
  encryptedAccessToken: 'encrypted_access_token',
  encryptedRefreshToken: null,
  tokenExpiresAt: null,
  scopes: ['instagram_basic'],
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const postRecord = {
  id: postId,
  tenantId,
  campaignId,
  platform: 'INSTAGRAM',
  status: 'APPROVED',
  caption: 'Launch time!',
  hashtags: ['launch'],
  callToAction: 'Shop now',
  scheduledAt: null,
  promptVersion: '1',
  modelMetadata: {},
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const publishJobRecord = {
  id: publishJobId,
  tenantId,
  campaignId,
  postId,
  socialAccountId,
  platform: 'INSTAGRAM',
  status: 'QUEUED',
  idempotencyKey: 'some_idempotency_key',
  scheduledAt: null,
  publishedAt: null,
  externalPostId: null,
  error: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('publishing routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists social accounts', async () => {
    prismaMock.socialAccount.findMany.mockResolvedValue([socialAccountRecord]);
    const { createApp } = await import('../../src/app.js');

    const response = await request(createApp())
      .get('/api/v1/social-accounts')
      .set('x-tenant-id', tenantId);

    expect(response.status).toBe(200);
    expect(response.body.accounts).toHaveLength(1);
    expect(response.body.accounts[0].accountName).toBe('test_instagram');
  });

  it('upserts a social account', async () => {
    prismaMock.socialAccount.upsert.mockResolvedValue(socialAccountRecord);
    const { createApp } = await import('../../src/app.js');

    const response = await request(createApp())
      .post('/api/v1/social-accounts')
      .set('x-tenant-id', tenantId)
      .send({
        platform: 'INSTAGRAM',
        accountName: 'test_instagram',
        externalAccountId: 'ext_inst_123',
        accessToken: 'access_token_123',
        scopes: ['instagram_basic'],
      });

    expect(response.status).toBe(201);
    expect(response.body.account.accountName).toBe('test_instagram');
    expect(prismaMock.socialAccount.upsert).toHaveBeenCalledOnce();
  });

  it('deletes a social account', async () => {
    prismaMock.socialAccount.findFirst.mockResolvedValue(socialAccountRecord);
    prismaMock.socialAccount.delete.mockResolvedValue(socialAccountRecord);
    const { createApp } = await import('../../src/app.js');

    const response = await request(createApp())
      .delete(`/api/v1/social-accounts/${socialAccountId}`)
      .set('x-tenant-id', tenantId);

    expect(response.status).toBe(204);
    expect(prismaMock.socialAccount.delete).toHaveBeenCalledOnce();
  });

  it('schedules a post for publishing', async () => {
    prismaMock.generatedPost.findFirst.mockResolvedValue(postRecord);
    prismaMock.socialAccount.findFirst.mockResolvedValue(socialAccountRecord);
    prismaMock.publishJob.upsert.mockResolvedValue(publishJobRecord);
    prismaMock.auditEvent.create.mockResolvedValue({});
    const { createApp } = await import('../../src/app.js');

    const response = await request(createApp())
      .post(`/api/v1/campaigns/${campaignId}/schedule`)
      .set('x-tenant-id', tenantId)
      .send({
        postId,
        socialAccountId,
      });

    expect(response.status).toBe(202);
    expect(response.body.publishJob.status).toBe('QUEUED');
    expect(prismaMock.publishJob.upsert).toHaveBeenCalledOnce();
    expect(prismaMock.auditEvent.create).toHaveBeenCalledOnce();
  });

  it('lists publish jobs for a campaign', async () => {
    prismaMock.publishJob.findMany.mockResolvedValue([publishJobRecord]);
    const { createApp } = await import('../../src/app.js');

    const response = await request(createApp())
      .get(`/api/v1/campaigns/${campaignId}/publish-jobs`)
      .set('x-tenant-id', tenantId);

    expect(response.status).toBe(200);
    expect(response.body.publishJobs).toHaveLength(1);
    expect(prismaMock.publishJob.findMany).toHaveBeenCalledOnce();
  });
});
