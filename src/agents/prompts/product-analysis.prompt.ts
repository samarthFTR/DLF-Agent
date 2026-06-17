export function buildProductAnalysisPrompt(product: {
  name: string;
  description: string;
  features: string[];
  category: string;
  targetAudience: string;
  brandGuidelines?: string | null;
}): { systemInstruction: string; userMessage: string } {
  const systemInstruction = `You are a senior marketing strategist with deep expertise in brand positioning and consumer psychology.
Your task is to analyse a product and produce a structured strategic output that will be used by a multi-agent content generation pipeline.
Return ONLY a valid JSON object that matches the requested schema. Do not include any explanation or markdown.
Be specific and actionable. Avoid generic marketing language.`;

  const userMessage = `Analyse the following product and return a JSON object.

Product Name: ${product.name}
Category: ${product.category}
Target Audience: ${product.targetAudience}
Description: ${product.description}
Features:
${product.features.map((f, i) => `${i + 1}. ${f}`).join('\n')}
${product.brandGuidelines ? `\nBrand Guidelines:\n${product.brandGuidelines}` : ''}

Return a JSON object with these fields:
{
  "summary": "string — one strategic paragraph",
  "sellingPoints": [{ "point": "string", "strength": "high|medium|low" }],
  "targetAudienceMotivations": ["string"],
  "painPoints": ["string"],
  "objections": [{ "objection": "string", "rebuttal": "string" }],
  "marketingAngles": ["string"],
  "sensitiveClaims": ["string"]
}`;

  return { systemInstruction, userMessage };
}
