import { z } from 'zod';

export const productParamsSchema = z.object({
  productId: z.string().uuid(),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().min(10).max(5000),
  features: z.array(z.string().trim().min(1).max(240)).min(1).max(50),
  category: z.string().trim().min(1).max(120),
  targetAudience: z.string().trim().min(1).max(1000),
  brandGuidelines: z.string().trim().max(5000).optional().nullable(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateProductSchema = createProductSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'At least one product field must be provided',
);

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

