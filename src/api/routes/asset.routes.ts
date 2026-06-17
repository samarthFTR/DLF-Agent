import { Router } from 'express';
import {
  deleteAsset,
  getAsset,
  listProductImages,
  uploadProductImage,
} from '../controllers/asset.controller.js';
import { tenantContextMiddleware } from '../middleware/tenant-context.js';
import { productImageUpload } from '../middleware/upload.js';
import { validateRequest } from '../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { assetParamsSchema, productImageParamsSchema } from '../../services/assets/asset.schemas.js';

export const assetRoutes = Router();

assetRoutes.use(tenantContextMiddleware);

assetRoutes
  .route('/products/:productId/images')
  .get(validateRequest({ params: productImageParamsSchema }), asyncHandler(listProductImages))
  .post(
    validateRequest({ params: productImageParamsSchema }),
    productImageUpload.single('image'),
    asyncHandler(uploadProductImage),
  );

assetRoutes
  .route('/assets/:assetId')
  .get(validateRequest({ params: assetParamsSchema }), asyncHandler(getAsset))
  .delete(validateRequest({ params: assetParamsSchema }), asyncHandler(deleteAsset));

