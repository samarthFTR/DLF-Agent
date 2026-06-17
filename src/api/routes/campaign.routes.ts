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
import {
  listPosts,
  getPost,
  updatePost,
  approvePost,
} from '../controllers/generated-post.controller.js';
import { tenantContextMiddleware } from '../middleware/tenant-context.js';
import { validateRequest } from '../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import {
  campaignParamsSchema,
  agentRunParamsSchema,
  createCampaignSchema,
  updateCampaignSchema,
} from '../../services/campaigns/campaign.schemas.js';
import { z } from 'zod';
import { generationRateLimit } from '../middleware/rate-limit.js';
import { auditLog } from '../middleware/audit.js';

export const campaignRoutes = Router();

campaignRoutes.use(tenantContextMiddleware);

// Campaign CRUD
campaignRoutes
  .route('/campaigns')
  .get(asyncHandler(listCampaigns))
  .post(
    validateRequest({ body: createCampaignSchema }),
    auditLog({ action: 'CREATE_CAMPAIGN', entityType: 'Campaign' }),
    asyncHandler(createCampaign),
  );

campaignRoutes
  .route('/campaigns/:campaignId')
  .get(validateRequest({ params: campaignParamsSchema }), asyncHandler(getCampaign))
  .patch(
    validateRequest({ params: campaignParamsSchema, body: updateCampaignSchema }),
    auditLog({ action: 'UPDATE_CAMPAIGN', entityType: 'Campaign', entityIdParam: 'campaignId' }),
    asyncHandler(updateCampaign),
  )
  .delete(
    validateRequest({ params: campaignParamsSchema }),
    auditLog({ action: 'DELETE_CAMPAIGN', entityType: 'Campaign', entityIdParam: 'campaignId' }),
    asyncHandler(deleteCampaign),
  );

// Generate — triggers the AI pipeline, returns 202 with agent run
campaignRoutes
  .route('/campaigns/:campaignId/generate')
  .post(
    generationRateLimit,
    validateRequest({ params: campaignParamsSchema }),
    auditLog({ action: 'GENERATE_CAMPAIGN', entityType: 'Campaign', entityIdParam: 'campaignId' }),
    asyncHandler(createAgentRun),
  );

// Generated posts under a campaign
const postParamsSchema = z.object({ campaignId: z.string().uuid(), postId: z.string().uuid() });
const updatePostSchema = z.object({
  caption: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  callToAction: z.string().optional(),
  changeReason: z.string().min(1),
});

campaignRoutes
  .route('/campaigns/:campaignId/posts')
  .get(validateRequest({ params: campaignParamsSchema }), asyncHandler(listPosts));

campaignRoutes
  .route('/campaigns/:campaignId/posts/:postId')
  .get(validateRequest({ params: postParamsSchema }), asyncHandler(getPost))
  .patch(
    validateRequest({ params: postParamsSchema, body: updatePostSchema }),
    auditLog({ action: 'UPDATE_POST', entityType: 'GeneratedPost', entityIdParam: 'postId' }),
    asyncHandler(updatePost),
  );

campaignRoutes
  .route('/campaigns/:campaignId/posts/:postId/approve')
  .post(
    validateRequest({ params: postParamsSchema }),
    auditLog({ action: 'APPROVE_POST', entityType: 'GeneratedPost', entityIdParam: 'postId' }),
    asyncHandler(approvePost),
  );

// Agent runs nested under campaigns
campaignRoutes
  .route('/campaigns/:campaignId/runs')
  .get(validateRequest({ params: campaignParamsSchema }), asyncHandler(listAgentRuns))
  .post(
    generationRateLimit,
    validateRequest({ params: campaignParamsSchema }),
    auditLog({ action: 'GENERATE_CAMPAIGN', entityType: 'Campaign', entityIdParam: 'campaignId' }),
    asyncHandler(createAgentRun),
  );

campaignRoutes
  .route('/campaigns/:campaignId/runs/:runId')
  .get(validateRequest({ params: agentRunParamsSchema }), asyncHandler(getAgentRun));

campaignRoutes
  .route('/campaigns/:campaignId/runs/:runId/events')
  .get(validateRequest({ params: agentRunParamsSchema }), asyncHandler(getAgentRunEvents));

campaignRoutes
  .route('/campaigns/:campaignId/runs/:runId/cancel')
  .post(
    validateRequest({ params: agentRunParamsSchema }),
    auditLog({ action: 'CANCEL_RUN', entityType: 'AgentRun', entityIdParam: 'runId' }),
    asyncHandler(cancelAgentRun),
  );

