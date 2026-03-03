
'use server';
/**
 * Batch-processed content generation.
 * Fills deterministic skeletons in batches to reduce AI costs.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { PageSkeleton } from '@/app/lib/templates';

const BatchInputSchema = z.object({
  brandMemory: z.any(),
  skeletons: z.array(z.any()),
});

const BatchOutputSchema = z.array(z.object({
  slug: z.string(),
  sections: z.array(z.object({
    h2: z.string(),
    content: z.string()
  })),
  faqs: z.array(z.object({
    question: z.string(),
    answer: z.string()
  }))
}));

const batchContentPrompt = ai.definePrompt({
  name: 'batchContentPrompt',
  input: { schema: BatchInputSchema },
  output: { schema: BatchOutputSchema },
  prompt: `You are an SEO content specialist for "{{brandMemory.companyName}}".
Fill in the content for these {{skeletons.length}} page skeletons.

Brand Context:
Services: {{brandMemory.services}}
Differentiators: {{brandMemory.differentiators}}
Tone: {{brandMemory.tone}}

For each skeleton, generate high-quality, authoritative body content for the provided H2s.
NO HALLUCINATIONS. No fake numbers. Keep it technical and helpful.

Skeletons:
{{#each skeletons}}
- Page: {{h1}} ({{type}})
  H2s: {{#each sections}}{{h2}}, {{/each}}
{{/each}}`,
});

export async function generateBatchContent(brandMemory: any, skeletons: PageSkeleton[]) {
  const { output } = await batchContentPrompt({ brandMemory, skeletons });
  if (!output) throw new Error('Batch generation failed');
  return output;
}
