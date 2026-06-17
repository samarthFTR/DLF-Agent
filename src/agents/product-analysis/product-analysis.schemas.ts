import { z } from 'zod';

export const productAnalysisOutputSchema = z.object({
  summary: z.string().min(1).describe('One-paragraph strategic product summary'),
  sellingPoints: z
    .array(
      z.object({
        point: z.string(),
        strength: z.enum(['high', 'medium', 'low']),
      }),
    )
    .min(1)
    .max(10),
  targetAudienceMotivations: z
    .array(z.string())
    .min(1)
    .max(8)
    .describe('What drives the target audience to buy'),
  painPoints: z
    .array(z.string())
    .min(1)
    .max(8)
    .describe('Customer problems this product solves'),
  objections: z
    .array(
      z.object({
        objection: z.string(),
        rebuttal: z.string(),
      }),
    )
    .max(6)
    .describe('Common purchase objections and how to address them'),
  marketingAngles: z
    .array(z.string())
    .min(1)
    .max(6)
    .describe('Distinct marketing angles or hooks to test'),
  sensitiveClaims: z
    .array(z.string())
    .describe('Any claims that could be legally or ethically sensitive and need human review'),
});

export type ProductAnalysisOutput = z.infer<typeof productAnalysisOutputSchema>;
