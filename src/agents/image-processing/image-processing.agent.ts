import { resizeImage } from '../../integrations/image/sharp-resizer.js';
import { PLATFORM_IMAGE_SIZES } from '../../integrations/llm/platform-constraints.js';
import { logger } from '../../utils/logger.js';
import type { ImageProcessingOutput } from './image-processing.schemas.js';

export type ImageProcessingInput = {
  platforms: string[];
  sourceAssets: {
    id: string;
    storageKey: string;
    mimeType: string;
  }[];
  imageGenerationEnabled: boolean;
};

/**
 * Image Processing Agent.
 * - Resizes source images to all platform dimensions.
 * - Skips image generation (stubbed until Imagen integration is added).
 * - Does not block the pipeline: failures per asset are recorded in `skipped`.
 */
export async function runImageProcessingAgent(
  input: ImageProcessingInput,
): Promise<ImageProcessingOutput> {
  const resizedAssets: ImageProcessingOutput['resizedAssets'] = [];
  const skipped: ImageProcessingOutput['skipped'] = [];

  if (input.sourceAssets.length === 0) {
    logger.warn('Image processing: no source assets provided, skipping resize');
    return { resizedAssets, skipped, imageGenerationSkipped: true };
  }

  for (const asset of input.sourceAssets) {
    const isImage = asset.mimeType.startsWith('image/');

    if (!isImage) {
      skipped.push({ assetId: asset.id, reason: `Unsupported MIME type: ${asset.mimeType}` });
      continue;
    }

    for (const platform of input.platforms) {
      const sizes = PLATFORM_IMAGE_SIZES[platform] ?? [];

      for (const size of sizes) {
        try {
          const result = await resizeImage(asset.storageKey, size.width, size.height, size.label);

          resizedAssets.push({
            platform,
            label: size.label,
            width: result.width,
            height: result.height,
            storageKey: result.storageKey,
            sourceAssetId: asset.id,
          });
        } catch (err) {
          const reason = err instanceof Error ? err.message : String(err);
          logger.warn({ assetId: asset.id, platform, size, reason }, 'Resize failed');
          skipped.push({ assetId: asset.id, reason: `${platform}/${size.label}: ${reason}` });
        }
      }
    }
  }

  return {
    resizedAssets,
    skipped,
    imageGenerationSkipped: true, // AI generation stubbed — Imagen integration pending
  };
}
