import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { tenantContextMiddleware, requireRequestContext } from '../middleware/tenant-context.js';
import { validateRequest } from '../middleware/validate.js';
import { getRouteParam } from '../request-params.js';
import { AnalyticsService, importMetricsSchema } from '../../services/analytics/analytics.service.js';
import { auditLog } from '../middleware/audit.js';
import { z } from 'zod';

export const analyticsRoutes = Router();
analyticsRoutes.use(tenantContextMiddleware);

const analyticsService = new AnalyticsService();

const campaignAnalyticsParamsSchema = z.object({ campaignId: z.string().uuid() });

analyticsRoutes.get(
  '/campaigns/:campaignId/analytics',
  validateRequest({ params: campaignAnalyticsParamsSchema }),
  asyncHandler(async (req, res) => {
    const context = requireRequestContext(req);
    const events = await analyticsService.getCampaignAnalytics(context, getRouteParam(req, 'campaignId'));
    res.json({ events });
  }),
);

analyticsRoutes.get(
  '/analytics/recommendations',
  asyncHandler(async (req, res) => {
    const context = requireRequestContext(req);
    const recommendations = await analyticsService.getRecommendations(context);
    res.json({ recommendations });
  }),
);

analyticsRoutes.post(
  '/analytics/import',
  validateRequest({ body: importMetricsSchema }),
  auditLog({ action: 'IMPORT_ANALYTICS_METRICS', entityType: 'AnalyticsEvent' }),
  asyncHandler(async (req, res) => {
    const context = requireRequestContext(req);
    const result = await analyticsService.importMetrics(context, req.body as typeof importMetricsSchema._type);
    res.status(201).json(result);
  }),
);
