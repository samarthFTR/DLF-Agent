import { Prisma } from '@prisma/client';
import { AppError } from '../../utils/errors.js';
import type { RequestContext } from '../../types/request-context.js';
import type { CreateProductInput, UpdateProductInput } from './product.schemas.js';
import { ProductRepository } from './product.repository.js';

export class ProductService {
  public constructor(private readonly products = new ProductRepository()) {}

  public createProduct(context: RequestContext, input: CreateProductInput) {
    return this.products.create({
      tenantId: context.tenantId,
      createdBy: context.userId,
      ...input,
      brandGuidelines: input.brandGuidelines ?? null,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonObject,
    });
  }

  public listProducts(context: RequestContext) {
    return this.products.list(context.tenantId);
  }

  public async getProduct(context: RequestContext, productId: string) {
    const product = await this.products.findById(context.tenantId, productId);

    if (!product) {
      throw new AppError(404, 'NOT_FOUND', 'Product not found');
    }

    return product;
  }

  public async updateProduct(context: RequestContext, productId: string, input: UpdateProductInput) {
    await this.ensureProductExists(context, productId);

    try {
      return await this.products.update(context.tenantId, productId, {
        ...input,
        metadata: input.metadata as Prisma.InputJsonObject | undefined,
      });
    } catch (error) {
      throw mapPrismaError(error, 'Product not found');
    }
  }

  public async deleteProduct(context: RequestContext, productId: string): Promise<void> {
    await this.ensureProductExists(context, productId);

    try {
      await this.products.delete(context.tenantId, productId);
    } catch (error) {
      throw mapPrismaError(error, 'Product not found');
    }
  }

  private async ensureProductExists(context: RequestContext, productId: string): Promise<void> {
    const product = await this.products.findById(context.tenantId, productId);

    if (!product) {
      throw new AppError(404, 'NOT_FOUND', 'Product not found');
    }
  }
}

function mapPrismaError(error: unknown, notFoundMessage: string): AppError {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
    return new AppError(404, 'NOT_FOUND', notFoundMessage);
  }

  if (error instanceof AppError) {
    return error;
  }

  return new AppError(500, 'INTERNAL_ERROR', 'Product operation failed');
}
