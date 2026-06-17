import { z } from 'zod';

export const assetParamsSchema = z.object({
  assetId: z.string().uuid(),
});

export const productImageParamsSchema = z.object({
  productId: z.string().uuid(),
});

