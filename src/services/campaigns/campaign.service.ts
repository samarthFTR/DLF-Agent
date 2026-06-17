import { Prisma } from '@prisma/client';
import { AppError } from '../../utils/errors.js';
import type { RequestContext } from '../../types/request-context.js';
import type { CreateCampaignInput, UpdateCampaignInput } from './campaign.schemas.js';
import { CampaignRepository } from './campaign.repository.js';
import { ProductRepository } from '../products/product.repository.js';

export class CampaignService {
  public constructor(
    private readonly campaigns = new CampaignRepository(),
    private readonly products = new ProductRepository(),
  ) {}

  public async createCampaign(context: RequestContext, input: CreateCampaignInput) {
    // Ensure the referenced product belongs to this tenant
    const product = await this.products.findById(context.tenantId, input.productId);

    if (!product) {
      throw new AppError(404, 'NOT_FOUND', 'Product not found');
    }

    return this.campaigns.create({
      tenantId: context.tenantId,
      productId: input.productId,
      createdBy: context.userId,
      name: input.name,
      platforms: input.platforms,
      publishMode: input.publishMode,
      scheduledAt: input.scheduledAt,
    });
  }

  public listCampaigns(context: RequestContext) {
    return this.campaigns.list(context.tenantId);
  }

  public async getCampaign(context: RequestContext, campaignId: string) {
    const campaign = await this.campaigns.findById(context.tenantId, campaignId);

    if (!campaign) {
      throw new AppError(404, 'NOT_FOUND', 'Campaign not found');
    }

    return campaign;
  }

  public async updateCampaign(
    context: RequestContext,
    campaignId: string,
    input: UpdateCampaignInput,
  ) {
    await this.ensureCampaignExists(context, campaignId);

    try {
      return await this.campaigns.update(context.tenantId, campaignId, {
        name: input.name,
        platforms: input.platforms,
        publishMode: input.publishMode,
        scheduledAt: input.scheduledAt,
      });
    } catch (error) {
      throw mapPrismaError(error, 'Campaign not found');
    }
  }

  public async deleteCampaign(context: RequestContext, campaignId: string): Promise<void> {
    await this.ensureCampaignExists(context, campaignId);

    try {
      await this.campaigns.delete(context.tenantId, campaignId);
    } catch (error) {
      throw mapPrismaError(error, 'Campaign not found');
    }
  }

  private async ensureCampaignExists(context: RequestContext, campaignId: string): Promise<void> {
    const campaign = await this.campaigns.findById(context.tenantId, campaignId);

    if (!campaign) {
      throw new AppError(404, 'NOT_FOUND', 'Campaign not found');
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

  return new AppError(500, 'INTERNAL_ERROR', 'Campaign operation failed');
}
