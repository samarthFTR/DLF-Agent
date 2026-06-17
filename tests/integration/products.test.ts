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

const productPayload = {
  name: 'Launch Bottle',
  description: 'A premium insulated bottle designed for everyday hydration.',
  features: ['Keeps drinks cold for 24 hours', 'Leakproof lid'],
  category: 'Drinkware',
  targetAudience: 'Urban professionals and students',
};

const productRecord = {
  id: productId,
  tenantId,
  ...productPayload,
  brandGuidelines: null,
  metadata: {},
  createdBy: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('product routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a tenant-scoped product', async () => {
    prismaMock.product.create.mockResolvedValue(productRecord);
    const { createApp } = await import('../../src/app.js');

    const response = await request(createApp())
      .post('/api/v1/products')
      .set('x-tenant-id', tenantId)
      .send(productPayload);

    expect(response.status).toBe(201);
    expect(response.body.product.id).toBe(productId);
    expect(prismaMock.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId,
          name: productPayload.name,
          category: productPayload.category,
        }),
      }),
    );
  });

  it('requires tenant context', async () => {
    const { createApp } = await import('../../src/app.js');

    const response = await request(createApp()).get('/api/v1/products');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 400 for invalid product input', async () => {
    const { createApp } = await import('../../src/app.js');

    const response = await request(createApp())
      .post('/api/v1/products')
      .set('x-tenant-id', tenantId)
      .send({ name: '' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('lists products', async () => {
    prismaMock.product.findMany.mockResolvedValue([productRecord]);
    const { createApp } = await import('../../src/app.js');

    const response = await request(createApp()).get('/api/v1/products').set('x-tenant-id', tenantId);

    expect(response.status).toBe(200);
    expect(response.body.products).toHaveLength(1);
    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId },
      }),
    );
  });
});

