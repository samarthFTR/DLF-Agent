import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

export type ResizeResult = {
  storageKey: string;
  width: number;
  height: number;
};

/**
 * Resizes an image from its local storage path to the target dimensions.
 * Saves the result under storage/resized/ and returns the relative storage key.
 */
export async function resizeImage(
  sourceStorageKey: string,
  width: number,
  height: number,
  label: string,
): Promise<ResizeResult> {
  const root = env.LOCAL_STORAGE_ROOT;
  const sourcePath = path.join(root, sourceStorageKey);

  // Build a deterministic output key
  const ext = path.extname(sourceStorageKey) || '.jpg';
  const base = path.basename(sourceStorageKey, ext);
  const storageKey = `resized/${base}_${label}_${width}x${height}${ext}`;
  const outputPath = path.join(root, storageKey);

  // Ensure the output directory exists
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  await sharp(sourcePath)
    .resize(width, height, { fit: 'cover', position: 'centre' })
    .toFile(outputPath);

  logger.debug({ sourceStorageKey, storageKey, width, height }, 'Image resized');

  return { storageKey, width, height };
}
