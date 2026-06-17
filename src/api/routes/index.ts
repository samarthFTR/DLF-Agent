import { Router } from 'express';
import { assetRoutes } from './asset.routes.js';
import { campaignRoutes } from './campaign.routes.js';
import { healthRoutes } from './health.routes.js';
import { productRoutes } from './product.routes.js';

export const apiRoutes = Router();

apiRoutes.use(healthRoutes);
apiRoutes.use(productRoutes);
apiRoutes.use(assetRoutes);
apiRoutes.use(campaignRoutes);
