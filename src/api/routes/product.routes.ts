import { Router } from 'express';
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
} from '../controllers/product.controller.js';
import { tenantContextMiddleware } from '../middleware/tenant-context.js';
import { validateRequest } from '../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { auditLog } from '../middleware/audit.js';
import {
  createProductSchema,
  productParamsSchema,
  updateProductSchema,
} from '../../services/products/product.schemas.js';

export const productRoutes = Router();

productRoutes.use(tenantContextMiddleware);

productRoutes
  .route('/products')
  .get(asyncHandler(listProducts))
  .post(
    validateRequest({ body: createProductSchema }),
    auditLog({ action: 'CREATE_PRODUCT', entityType: 'Product' }),
    asyncHandler(createProduct),
  );

productRoutes
  .route('/products/:productId')
  .get(validateRequest({ params: productParamsSchema }), asyncHandler(getProduct))
  .patch(
    validateRequest({ params: productParamsSchema, body: updateProductSchema }),
    auditLog({ action: 'UPDATE_PRODUCT', entityType: 'Product', entityIdParam: 'productId' }),
    asyncHandler(updateProduct),
  )
  .delete(
    validateRequest({ params: productParamsSchema }),
    auditLog({ action: 'DELETE_PRODUCT', entityType: 'Product', entityIdParam: 'productId' }),
    asyncHandler(deleteProduct),
  );

