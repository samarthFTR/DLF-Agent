export type PlatformConstraints = {
  maxCaptionLength: number;
  maxHashtags: number;
  toneDescriptor: string;
  ctaStyle: string;
};

export const PLATFORM_CONSTRAINTS: Record<string, PlatformConstraints> = {
  INSTAGRAM: {
    maxCaptionLength: 2200,
    maxHashtags: 30,
    toneDescriptor: 'visually compelling, lifestyle-focused, aspirational',
    ctaStyle: 'Link in bio, swipe up, or shop now',
  },
  LINKEDIN: {
    maxCaptionLength: 3000,
    maxHashtags: 5,
    toneDescriptor: 'professional, insightful, thought-leadership oriented',
    ctaStyle: 'Learn more, Download, or Visit our website',
  },
  FACEBOOK: {
    maxCaptionLength: 63206,
    maxHashtags: 10,
    toneDescriptor: 'friendly, community-oriented, conversational',
    ctaStyle: 'Shop Now, Learn More, or Sign Up',
  },
  X: {
    maxCaptionLength: 280,
    maxHashtags: 2,
    toneDescriptor: 'concise, punchy, trend-aware, witty',
    ctaStyle: 'Link only, keep it brief',
  },
};

/** Platform-specific image dimensions in pixels */
export const PLATFORM_IMAGE_SIZES: Record<string, { width: number; height: number; label: string }[]> = {
  INSTAGRAM: [
    { width: 1080, height: 1080, label: 'square' },
    { width: 1080, height: 1350, label: 'portrait' },
  ],
  LINKEDIN: [{ width: 1200, height: 627, label: 'feed' }],
  FACEBOOK: [{ width: 1200, height: 630, label: 'feed' }],
  X: [{ width: 1600, height: 900, label: 'feed' }],
};
