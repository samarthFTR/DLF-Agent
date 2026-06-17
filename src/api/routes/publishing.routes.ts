import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { tenantContextMiddleware } from '../middleware/tenant-context.js';
import { requireRequestContext } from '../middleware/tenant-context.js';
import { validateRequest } from '../middleware/validate.js';
import { getRouteParam } from '../request-params.js';
import { SocialAccountService } from '../../services/social-accounts/social-account.service.js';
import { PublishingService } from '../../services/publishing/publishing.service.js';
import { z } from 'zod';
import { auditLog } from '../middleware/audit.js';

export const publishingRoutes = Router();
publishingRoutes.use(tenantContextMiddleware);

const socialAccountService = new SocialAccountService();
const publishingService = new PublishingService();

// ── Social Accounts ───────────────────────────────────────────────────────────

publishingRoutes.get(
  '/social-accounts',
  asyncHandler(async (req, res) => {
    const context = requireRequestContext(req);
    const accounts = await socialAccountService.list(context);
    res.json({ accounts });
  }),
);

const upsertAccountSchema = z.object({
  platform: z.enum(['INSTAGRAM', 'LINKEDIN', 'FACEBOOK', 'X']),
  accountName: z.string().min(1),
  externalAccountId: z.string().min(1),
  accessToken: z.string().min(1),
  refreshToken: z.string().optional(),
  tokenExpiresAt: z.string().datetime().optional(),
  scopes: z.array(z.string()).default([]),
});

publishingRoutes.post(
  '/social-accounts',
  validateRequest({ body: upsertAccountSchema }),
  auditLog({ action: 'UPSERT_SOCIAL_ACCOUNT', entityType: 'SocialAccount' }),
  asyncHandler(async (req, res) => {
    const context = requireRequestContext(req);
    const account = await socialAccountService.upsertAccount(context, req.body as z.infer<typeof upsertAccountSchema>);
    res.status(201).json({ account });
  }),
);

publishingRoutes.delete(
  '/social-accounts/:accountId',
  auditLog({ action: 'DELETE_SOCIAL_ACCOUNT', entityType: 'SocialAccount', entityIdParam: 'accountId' }),
  asyncHandler(async (req, res) => {
    const context = requireRequestContext(req);
    await socialAccountService.deleteAccount(context, getRouteParam(req, 'accountId'));
    res.status(204).send();
  }),
);

// ── Publishing ────────────────────────────────────────────────────────────────

const schedulePostSchema = z.object({
  postId: z.string().uuid(),
  socialAccountId: z.string().uuid(),
  scheduledAt: z.string().datetime().optional().nullable(),
});

const campaignPublishParamsSchema = z.object({ campaignId: z.string().uuid() });

publishingRoutes.post(
  '/campaigns/:campaignId/schedule',
  validateRequest({ params: campaignPublishParamsSchema, body: schedulePostSchema }),
  auditLog({ action: 'SCHEDULE_PUBLISH_JOB', entityType: 'PublishJob' }),
  asyncHandler(async (req, res) => {
    const context = requireRequestContext(req);
    const job = await publishingService.schedulePost(context, req.body as z.infer<typeof schedulePostSchema>);
    res.status(202).json({ publishJob: job });
  }),
);

publishingRoutes.get(
  '/campaigns/:campaignId/publish-jobs',
  validateRequest({ params: campaignPublishParamsSchema }),
  asyncHandler(async (req, res) => {
    const context = requireRequestContext(req);
    const jobs = await publishingService.listJobs(context, getRouteParam(req, 'campaignId'));
    res.json({ publishJobs: jobs });
  }),
);
