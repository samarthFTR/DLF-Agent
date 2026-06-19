import { resizeImage } from '../../integrations/image/sharp-resizer.js';
import { PLATFORM_IMAGE_SIZES } from '../../integrations/llm/platform-constraints.js';
import { generateImageFromPrompt } from '../../integrations/llm/gemini.js';
import { logger } from '../../utils/logger.js';
import { env } from '../../config/env.js';
import type { ImageProcessingOutput } from './image-processing.schemas.js';
import type { CreativeStrategyOutput } from '../creative-strategy/creative-strategy.schemas.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export type ImageProcessingInput = {
  platforms: string[];
  sourceAssets: {
    id: string;
    storageKey: string;
    mimeType: string;
  }[];
  imageGenerationEnabled: boolean;
  creativeStrategy?: CreativeStrategyOutput;
};

/**
 * Image Processing Agent.
 * - Generates creative images using Gemini's Imagen 3 model when enabled.
 * - Resizes generated/source images to all platform dimensions.
 * - Does not block the pipeline: failures per asset are recorded in `skipped`.
 */
export async function runImageProcessingAgent(
  input: ImageProcessingInput,
): Promise<ImageProcessingOutput> {
  const resizedAssets: ImageProcessingOutput['resizedAssets'] = [];
  const generatedAssets: ImageProcessingOutput['generatedAssets'] = [];
  const skipped: ImageProcessingOutput['skipped'] = [];
  let imageGenerationSkipped = true;

  // 1. Try to generate custom images for each platform if enabled
  if (input.imageGenerationEnabled && input.creativeStrategy?.platformBriefs) {
    imageGenerationSkipped = false;

    for (const platform of input.platforms) {
      const brief = input.creativeStrategy.platformBriefs.find((b) => b.platform === platform);
      if (brief && brief.imagePrompt) {
        try {
          logger.info({ platform, prompt: brief.imagePrompt }, 'Generating image for platform');
          
          const buffer = await generateImageFromPrompt(brief.imagePrompt, {
            aspectRatio: '1:1',
            negativePrompt: brief.negativePrompt,
          });

          const filename = `generated/${crypto.randomUUID()}.jpg`;
          const root = env.LOCAL_STORAGE_ROOT;
          await fs.mkdir(path.join(root, 'generated'), { recursive: true });
          await fs.writeFile(path.join(root, filename), buffer);

          generatedAssets.push({
            platform,
            storageKey: filename,
            promptUsed: brief.imagePrompt,
          });

          // Resize the generated creative image for this platform
          const sizes = PLATFORM_IMAGE_SIZES[platform] ?? [];
          for (const size of sizes) {
            const result = await resizeImage(filename, size.width, size.height, size.label);
            resizedAssets.push({
              platform,
              label: size.label,
              width: result.width,
              height: result.height,
              storageKey: result.storageKey,
            });
          }
        } catch (err) {
          const reason = err instanceof Error ? err.message : String(err);
          logger.warn({ platform, reason }, 'AI Image generation failed, falling back to source asset resizing');
          skipped.push({ platform, reason: `Generation failed: ${reason}` });

          // Fallback to resizing product source assets for this platform
          await resizeSourceAssetsForPlatform(platform);
        }
      } else {
        await resizeSourceAssetsForPlatform(platform);
      }
    }
  } else {
    // 2. Default to standard source product image resizing
    for (const platform of input.platforms) {
      await resizeSourceAssetsForPlatform(platform);
    }
  }

  // Helper function to resize source images
  async function resizeSourceAssetsForPlatform(platform: string): Promise<void> {
    if (input.sourceAssets.length === 0) {
      return;
    }

    for (const asset of input.sourceAssets) {
      const isImage = asset.mimeType.startsWith('image/');
      if (!isImage) {
        skipped.push({ assetId: asset.id, platform, reason: `Unsupported MIME type: ${asset.mimeType}` });
        continue;
      }

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
          skipped.push({ assetId: asset.id, platform, reason: `${platform}/${size.label}: ${reason}` });
        }
      }
    }
  }

  return {
    resizedAssets,
    generatedAssets,
    skipped,
    imageGenerationSkipped,
  };
}
