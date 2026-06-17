import { z } from 'zod';

const platformCaptionSchema = z.object({
  platform: z.enum(['INSTAGRAM', 'LINKEDIN', 'FACEBOOK', 'X']),
  caption: z.string().min(1),
  hashtags: z.array(z.string()).default([]),
  callToAction: z.string().optional(),
  alternativeCaption: z.string().optional().describe('A/B test alternative'),
});

export const captionGenerationOutputSchema = z.object({
  captions: z.array(platformCaptionSchema).min(1),
});

export type CaptionGenerationOutput = z.infer<typeof captionGenerationOutputSchema>;
export type PlatformCaption = z.infer<typeof platformCaptionSchema>;
