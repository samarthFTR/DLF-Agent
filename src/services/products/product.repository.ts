import type { Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma.js';

export type ProductCreateData = {
  tenantId: string;
  createdBy?: string;
  name: string;
  description: string;
  features: string[];
  category: string;
  targetAudience: string;
  brandGuidelines?: string | null;
  metadata?: Prisma.InputJsonObject;
};

export type ProductUpdateData = Partial<
  Pick<
    ProductCreateData,
    'name' | 'description' | 'features' | 'category' | 'targetAudience' | 'brandGuidelines' | 'metadata'
  >
>;

const productSelect = {
  id: true,
  tenantId: true,
  name: true,
  description: true,
  features: true,
  category: true,
  targetAudience: true,
  brandGuidelines: true,
  metadata: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProductSelect;

export type ProductRecord = Prisma.ProductGetPayload<{ select: typeof productSelect }>;

export class ProductRepository {
  public create(data: ProductCreateData): Promise<ProductRecord> {
    return prisma.product.create({
      data: {
        tenantId: data.tenantId,
        createdBy: data.createdBy,
        name: data.name,
        description: data.description,
        features: data.features,
        category: data.category,
        targetAudience: data.targetAudience,
        brandGuidelines: data.brandGuidelines,
        metadata: data.metadata ?? {},
      },
      select: productSelect,
    });
  }

  public list(tenantId: string): Promise<ProductRecord[]> {
    return prisma.product.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: productSelect,
    });
  }

  public findById(tenantId: string, productId: string): Promise<ProductRecord | null> {
    return prisma.product.findFirst({
      where: { id: productId, tenantId },
      select: productSelect,
    });
  }

  public update(tenantId: string, productId: string, data: ProductUpdateData): Promise<ProductRecord> {
    const updateData: Prisma.ProductUpdateInput = {
      name: data.name,
      description: data.description,
      features: data.features,
      category: data.category,
      targetAudience: data.targetAudience,
      brandGuidelines: data.brandGuidelines,
      metadata: data.metadata,
    };

    return prisma.product.update({
      where: { id: productId, tenantId },
      data: updateData,
      select: productSelect,
    });
  }

  public async delete(tenantId: string, productId: string): Promise<void> {
    await prisma.product.delete({
      where: { id: productId, tenantId },
    });
  }
}
