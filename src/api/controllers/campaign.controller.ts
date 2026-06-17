import type { Request, Response } from 'express';
import { requireRequestContext } from '../middleware/tenant-context.js';
import { getRouteParam } from '../request-params.js';
import { CampaignService } from '../../services/campaigns/campaign.service.js';
import type { CreateCampaignInput, UpdateCampaignInput } from '../../services/campaigns/campaign.schemas.js';

const campaignService = new CampaignService();

export async function createCampaign(req: Request, res: Response): Promise<void> {
  const context = requireRequestContext(req);
  const campaign = await campaignService.createCampaign(context, req.body as CreateCampaignInput);
  res.status(201).json({ campaign });
}

export async function listCampaigns(req: Request, res: Response): Promise<void> {
  const context = requireRequestContext(req);
  const campaigns = await campaignService.listCampaigns(context);
  res.status(200).json({ campaigns });
}

export async function getCampaign(req: Request, res: Response): Promise<void> {
  const context = requireRequestContext(req);
  const campaign = await campaignService.getCampaign(context, getRouteParam(req, 'campaignId'));
  res.status(200).json({ campaign });
}

export async function updateCampaign(req: Request, res: Response): Promise<void> {
  const context = requireRequestContext(req);
  const campaign = await campaignService.updateCampaign(
    context,
    getRouteParam(req, 'campaignId'),
    req.body as UpdateCampaignInput,
  );
  res.status(200).json({ campaign });
}

export async function deleteCampaign(req: Request, res: Response): Promise<void> {
  const context = requireRequestContext(req);
  await campaignService.deleteCampaign(context, getRouteParam(req, 'campaignId'));
  res.status(204).send();
}
