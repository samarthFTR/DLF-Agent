import { z } from 'zod';

export const campaignParamsSchema = z.object({
  campaignId: z.string().uuid(),
});

export const agentRunParamsSchema = z.object({
  campaignId: z.string().uuid(),
  runId: z.string().uuid(),
});

const socialPlatformValues = ['INSTAGRAM', 'LINKEDIN', 'FACEBOOK', 'X'] as const;
const publishModeValues = ['MANUAL', 'SCHEDULED', 'AUTO'] as const;

export const createCampaignSchema = z.object({
  productId: z.string().uuid(),
  name: z.string().trim().min(1).max(200),
  platforms: z
    .array(z.enum(socialPlatformValues))
    .min(1, 'At least one platform must be selected')
    .max(4),
  publishMode: z.enum(publishModeValues).optional().default('MANUAL'),
  scheduledAt: z.string().datetime().optional().nullable(),
});

export const updateCampaignSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    platforms: z.array(z.enum(socialPlatformValues)).min(1).max(4),
    publishMode: z.enum(publishModeValues),
    scheduledAt: z.string().datetime().optional().nullable(),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'At least one field must be provided');

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
