import { z } from 'zod';

const platformBriefSchema = z.object({
  platform: z.enum(['INSTAGRAM', 'LINKEDIN', 'FACEBOOK', 'X']),
  theme: z.string().min(1).describe('Campaign theme for this platform'),
  visualDirection: z.string().min(1).describe('Visual and aesthetic direction'),
  imagePrompt: z.string().min(1).describe('Prompt for image generation'),
  negativePrompt: z.string().optional().describe('What to avoid in the image'),
});

export const creativeStrategyOutputSchema = z.object({
  campaignTheme: z.string().min(1).describe('Overarching campaign theme across platforms'),
  campaignTagline: z.string().min(1).describe('Short, memorable tagline'),
  colorMood: z.string().describe('Colour palette direction (e.g. warm earthy tones, cool blues)'),
  platformBriefs: z.array(platformBriefSchema).min(1),
  imageGenerationEnabled: z
    .boolean()
    .describe('Whether AI image generation should be attempted'),
});

export type CreativeStrategyOutput = z.infer<typeof creativeStrategyOutputSchema>;
export type PlatformBrief = z.infer<typeof platformBriefSchema>;
