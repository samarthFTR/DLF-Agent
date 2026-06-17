import '../setup-env.js';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prismaMock } from '../prisma-mock.js';

vi.mock('../../src/database/prisma.js', () => ({
  prisma: prismaMock,
  checkDatabaseReadiness: vi.fn().mockResolvedValue(true),
  disconnectPrisma: vi.fn(),
}));

vi.mock('../../src/integrations/storage/local-storage.js', () => ({
  LocalStorage: class {
    public saveBuffer = vi.fn().mockResolvedValue({
      storageKey: 'uploads/test/image.png',
      publicUrl: 'http://localhost:3000/assets/uploads/test/image.png',
    });

    public delete = vi.fn().mockResolvedValue(undefined);
  },
}));

const tenantId = '11111111-1111-4111-8111-111111111111';
const productId = '22222222-2222-4222-8222-222222222222';
const assetId = '33333333-3333-4333-8333-333333333333';

const png1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
  'base64',
);

describe('asset routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.product.findFirst.mockResolvedValue({
      id: productId,
      tenantId,
    });
  });

  it('uploads a product image and creates an asset record', async () => {
    prismaMock.asset.create.mockResolvedValue({
      id: assetId,
      tenantId,
      productId,
      campaignId: null,
      kind: 'SOURCE_PRODUCT_IMAGE',
      storageKey: 'uploads/test/image.png',
      publicUrl: 'http://localhost:3000/assets/uploads/test/image.png',
      mimeType: 'image/png',
      width: 1,
      height: 1,
      checksum: 'checksum',
      metadata: { originalName: 'image.png', size: png1x1.length },
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const { createApp } = await import('../../src/app.js');
    const response = await request(createApp())
      .post(`/api/v1/products/${productId}/images`)
      .set('x-tenant-id', tenantId)
      .attach('image', png1x1, { filename: 'image.png', contentType: 'image/png' });

    expect(response.status).toBe(201);
    expect(response.body.asset.id).toBe(assetId);
    expect(prismaMock.asset.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId,
          productId,
          mimeType: 'image/png',
          width: 1,
          height: 1,
        }),
      }),
    );
  });

  it('rejects unsupported image types', async () => {
    const { createApp } = await import('../../src/app.js');
    const response = await request(createApp())
      .post(`/api/v1/products/${productId}/images`)
      .set('x-tenant-id', tenantId)
      .attach('image', Buffer.from('hello'), {
        filename: 'note.txt',
        contentType: 'text/plain',
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('BAD_REQUEST');
  });

  it('lists product images', async () => {
    prismaMock.asset.findMany.mockResolvedValue([]);

    const { createApp } = await import('../../src/app.js');
    const response = await request(createApp())
      .get(`/api/v1/products/${productId}/images`)
      .set('x-tenant-id', tenantId);

    expect(response.status).toBe(200);
    expect(response.body.assets).toEqual([]);
  });
});

