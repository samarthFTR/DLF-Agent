import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { AppError } from '../../utils/errors.js';
import type { RequestContext } from '../../types/request-context.js';
import { LocalStorage } from '../../integrations/storage/local-storage.js';
import { ProductRepository } from '../products/product.repository.js';
import { AssetRepository } from './asset.repository.js';
import { getImageMetadata } from './image-metadata.js';

const allowedMimeTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

export type UploadProductImageInput = {
  productId: string;
  file: Express.Multer.File | undefined;
};

export class AssetService {
  public constructor(
    private readonly assets = new AssetRepository(),
    private readonly products = new ProductRepository(),
    private readonly storage = new LocalStorage(),
  ) {}

  public async uploadProductImage(context: RequestContext, input: UploadProductImageInput) {
    if (!input.file) {
      throw new AppError(400, 'BAD_REQUEST', 'Product image file is required');
    }

    const extension = allowedMimeTypes.get(input.file.mimetype);

    if (!extension) {
      throw new AppError(400, 'BAD_REQUEST', 'Unsupported image type');
    }

    await this.ensureProductExists(context, input.productId);

    const metadata = getImageMetadata(input.file.buffer);
    const storageKey = path
      .join('uploads', context.tenantId, input.productId, `${randomUUID()}.${extension}`)
      .replaceAll('\\', '/');
    const storedFile = await this.storage.saveBuffer(storageKey, input.file.buffer);

    return this.assets.createSourceProductImage({
      tenantId: context.tenantId,
      productId: input.productId,
      storageKey: storedFile.storageKey,
      publicUrl: storedFile.publicUrl,
      mimeType: input.file.mimetype,
      width: metadata.width,
      height: metadata.height,
      checksum: metadata.checksum,
      metadata: {
        originalName: input.file.originalname,
        size: input.file.size,
      },
    });
  }

  public async listProductImages(context: RequestContext, productId: string) {
    await this.ensureProductExists(context, productId);
    return this.assets.listProductImages(context.tenantId, productId);
  }

  public async getAsset(context: RequestContext, assetId: string) {
    const asset = await this.assets.findById(context.tenantId, assetId);

    if (!asset) {
      throw new AppError(404, 'NOT_FOUND', 'Asset not found');
    }

    return asset;
  }

  public async deleteAsset(context: RequestContext, assetId: string): Promise<void> {
    const asset = await this.getAsset(context, assetId);
    await this.assets.delete(context.tenantId, assetId);
    await this.storage.delete(asset.storageKey);
  }

  private async ensureProductExists(context: RequestContext, productId: string): Promise<void> {
    const product = await this.products.findById(context.tenantId, productId);

    if (!product) {
      throw new AppError(404, 'NOT_FOUND', 'Product not found');
    }
  }
}

