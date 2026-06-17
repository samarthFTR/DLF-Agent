import { AssetKind, type Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma.js';

const assetSelect = {
  id: true,
  tenantId: true,
  productId: true,
  campaignId: true,
  kind: true,
  storageKey: true,
  publicUrl: true,
  mimeType: true,
  width: true,
  height: true,
  checksum: true,
  metadata: true,
  createdAt: true,
} satisfies Prisma.AssetSelect;

export type AssetRecord = Prisma.AssetGetPayload<{ select: typeof assetSelect }>;

export type CreateSourceImageAssetData = {
  tenantId: string;
  productId: string;
  storageKey: string;
  publicUrl: string;
  mimeType: string;
  width?: number;
  height?: number;
  checksum: string;
  metadata?: Prisma.InputJsonObject;
};

export class AssetRepository {
  public createSourceProductImage(data: CreateSourceImageAssetData): Promise<AssetRecord> {
    return prisma.asset.create({
      data: {
        tenantId: data.tenantId,
        productId: data.productId,
        kind: AssetKind.SOURCE_PRODUCT_IMAGE,
        storageKey: data.storageKey,
        publicUrl: data.publicUrl,
        mimeType: data.mimeType,
        width: data.width,
        height: data.height,
        checksum: data.checksum,
        metadata: data.metadata ?? {},
      },
      select: assetSelect,
    });
  }

  public listProductImages(tenantId: string, productId: string): Promise<AssetRecord[]> {
    return prisma.asset.findMany({
      where: {
        tenantId,
        productId,
        kind: AssetKind.SOURCE_PRODUCT_IMAGE,
      },
      orderBy: { createdAt: 'desc' },
      select: assetSelect,
    });
  }

  public findById(tenantId: string, assetId: string): Promise<AssetRecord | null> {
    return prisma.asset.findFirst({
      where: { tenantId, id: assetId },
      select: assetSelect,
    });
  }

  public async delete(tenantId: string, assetId: string): Promise<void> {
    await prisma.asset.delete({
      where: { id: assetId, tenantId },
    });
  }
}
