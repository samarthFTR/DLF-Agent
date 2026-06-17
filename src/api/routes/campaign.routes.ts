import { Router } from 'express';
import {
  createCampaign,
  deleteCampaign,
  getCampaign,
  listCampaigns,
  updateCampaign,
} from '../controllers/campaign.controller.js';
import {
  createAgentRun,
  cancelAgentRun,
  getAgentRun,
  getAgentRunEvents,
  listAgentRuns,
} from '../controllers/agent-run.controller.js';
import { tenantContextMiddleware } from '../middleware/tenant-context.js';
import { validateRequest } from '../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import {
  campaignParamsSchema,
  agentRunParamsSchema,
  createCampaignSchema,
  updateCampaignSchema,
} from '../../services/campaigns/campaign.schemas.js';

export const campaignRoutes = Router();

campaignRoutes.use(tenantContextMiddleware);

// Campaign CRUD
campaignRoutes
  .route('/campaigns')
  .get(asyncHandler(listCampaigns))
  .post(validateRequest({ body: createCampaignSchema }), asyncHandler(createCampaign));

campaignRoutes
  .route('/campaigns/:campaignId')
  .get(validateRequest({ params: campaignParamsSchema }), asyncHandler(getCampaign))
  .patch(
    validateRequest({ params: campaignParamsSchema, body: updateCampaignSchema }),
    asyncHandler(updateCampaign),
  )
  .delete(validateRequest({ params: campaignParamsSchema }), asyncHandler(deleteCampaign));

// Agent runs nested under campaigns
campaignRoutes
  .route('/campaigns/:campaignId/runs')
  .get(validateRequest({ params: campaignParamsSchema }), asyncHandler(listAgentRuns))
  .post(validateRequest({ params: campaignParamsSchema }), asyncHandler(createAgentRun));

campaignRoutes
  .route('/campaigns/:campaignId/runs/:runId')
  .get(validateRequest({ params: agentRunParamsSchema }), asyncHandler(getAgentRun));

campaignRoutes
  .route('/campaigns/:campaignId/runs/:runId/events')
  .get(validateRequest({ params: agentRunParamsSchema }), asyncHandler(getAgentRunEvents));

campaignRoutes
  .route('/campaigns/:campaignId/runs/:runId/cancel')
  .post(validateRequest({ params: agentRunParamsSchema }), asyncHandler(cancelAgentRun));
