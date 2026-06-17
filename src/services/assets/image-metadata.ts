import { createHash } from 'node:crypto';
import { imageSize } from 'image-size';

export type ImageMetadata = {
  checksum: string;
  width?: number;
  height?: number;
};

export function getImageMetadata(buffer: Buffer): ImageMetadata {
  const checksum = createHash('sha256').update(buffer).digest('hex');
  const dimensions = imageSize(buffer);

  return {
    checksum,
    width: dimensions.width,
    height: dimensions.height,
  };
}

