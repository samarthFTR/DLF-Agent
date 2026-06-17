import { Router } from 'express';
import { assetRoutes } from './asset.routes.js';
import { campaignRoutes } from './campaign.routes.js';
import { healthRoutes } from './health.routes.js';
import { productRoutes } from './product.routes.js';
import { publishingRoutes } from './publishing.routes.js';
import { analyticsRoutes } from './analytics.routes.js';
import { globalRateLimit } from '../middleware/rate-limit.js';

export const apiRoutes = Router();

// Health check does not need rate limiting
apiRoutes.use(healthRoutes);

// Apply global rate limit to other API routes
apiRoutes.use(globalRateLimit);

apiRoutes.use(productRoutes);
apiRoutes.use(assetRoutes);
apiRoutes.use(campaignRoutes);
apiRoutes.use(publishingRoutes);
apiRoutes.use(analyticsRoutes);
