import { z } from 'zod';

export const imageProcessingOutputSchema = z.object({
  resizedAssets: z.array(
    z.object({
      platform: z.string(),
      label: z.string(),
      width: z.number(),
      height: z.number(),
      storageKey: z.string(),
      sourceAssetId: z.string().optional(),
    }),
  ),
  generatedAssets: z.array(
    z.object({
      platform: z.string(),
      storageKey: z.string(),
      promptUsed: z.string(),
    }),
  ),
  skipped: z.array(
    z.object({
      assetId: z.string().optional(),
      platform: z.string().optional(),
      reason: z.string(),
    }),
  ),
  imageGenerationSkipped: z.boolean(),
});

export type ImageProcessingOutput = z.infer<typeof imageProcessingOutputSchema>;
