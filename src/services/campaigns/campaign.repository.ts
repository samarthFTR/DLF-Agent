import type { CampaignStatus, Prisma, SocialPlatform } from '@prisma/client';
import { prisma } from '../../database/prisma.js';

export type CampaignCreateData = {
  tenantId: string;
  productId: string;
  createdBy?: string;
  name: string;
  platforms: string[];
  publishMode: string;
  scheduledAt?: string | null;
};

export type CampaignUpdateData = Partial<{
  name: string;
  platforms: string[];
  publishMode: string;
  scheduledAt: string | null;
  status: CampaignStatus;
  approvedBy: string | null;
  approvedAt: Date | null;
}>;

const campaignSelect = {
  id: true,
  tenantId: true,
  productId: true,
  name: true,
  status: true,
  platforms: true,
  publishMode: true,
  scheduledAt: true,
  approvedBy: true,
  approvedAt: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CampaignSelect;

export type CampaignRecord = Prisma.CampaignGetPayload<{ select: typeof campaignSelect }>;

export class CampaignRepository {
  public create(data: CampaignCreateData): Promise<CampaignRecord> {
    return prisma.campaign.create({
      data: {
        tenantId: data.tenantId,
        productId: data.productId,
        createdBy: data.createdBy,
        name: data.name,
        platforms: data.platforms as SocialPlatform[],
        publishMode: data.publishMode as Prisma.CampaignCreateInput['publishMode'],
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      },
      select: campaignSelect,
    });
  }

  public list(tenantId: string): Promise<CampaignRecord[]> {
    return prisma.campaign.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: campaignSelect,
    });
  }

  public listByProduct(tenantId: string, productId: string): Promise<CampaignRecord[]> {
    return prisma.campaign.findMany({
      where: { tenantId, productId },
      orderBy: { createdAt: 'desc' },
      select: campaignSelect,
    });
  }

  public findById(tenantId: string, campaignId: string): Promise<CampaignRecord | null> {
    return prisma.campaign.findFirst({
      where: { id: campaignId, tenantId },
      select: campaignSelect,
    });
  }

  public update(tenantId: string, campaignId: string, data: CampaignUpdateData): Promise<CampaignRecord> {
    const updateData: Prisma.CampaignUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.publishMode !== undefined) updateData.publishMode = data.publishMode as Prisma.CampaignUpdateInput['publishMode'];
    if (data.scheduledAt !== undefined) updateData.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.approvedBy !== undefined) updateData.approvedBy = data.approvedBy;
    if (data.approvedAt !== undefined) updateData.approvedAt = data.approvedAt;
    if (data.platforms !== undefined) {
      updateData.platforms = { set: data.platforms as SocialPlatform[] };
    }

    return prisma.campaign.update({
      where: { id: campaignId, tenantId },
      data: updateData,
      select: campaignSelect,
    });
  }

  public async delete(tenantId: string, campaignId: string): Promise<void> {
    await prisma.campaign.delete({
      where: { id: campaignId, tenantId },
    });
  }
}
