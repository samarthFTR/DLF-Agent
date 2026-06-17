import type { PlatformCaption } from './caption-generation.schemas.js';
import { PLATFORM_CONSTRAINTS } from '../../integrations/llm/platform-constraints.js';

export type CaptionValidationError = {
  platform: string;
  field: string;
  message: string;
};

/**
 * Validates generated captions against platform limits.
 * Returns an array of errors (empty = valid).
 */
export function validateCaptions(captions: PlatformCaption[]): CaptionValidationError[] {
  const errors: CaptionValidationError[] = [];

  for (const cap of captions) {
    const constraints = PLATFORM_CONSTRAINTS[cap.platform];

    if (!constraints) continue;

    if (cap.caption.length > constraints.maxCaptionLength) {
      errors.push({
        platform: cap.platform,
        field: 'caption',
        message: `Caption length ${cap.caption.length} exceeds ${constraints.maxCaptionLength} char limit`,
      });
    }

    if (cap.hashtags.length > constraints.maxHashtags) {
      errors.push({
        platform: cap.platform,
        field: 'hashtags',
        message: `${cap.hashtags.length} hashtags exceeds limit of ${constraints.maxHashtags}`,
      });
    }
  }

  return errors;
}
