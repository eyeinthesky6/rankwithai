
'use server';
/**
 * @fileOverview Stricter Genkit flow for generating deterministic, SEO-optimized pages.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const BrandMemorySchema = z.object({
  companyName: z.string(),
  services: z.array(z.string()).min(1),
  industries: z.array(z.string()),
  locations: z.array(z.string()),
  differentiators: z.string(),
  tone: z.enum(['Professional', 'Technical', 'Conversational']),
  faqs: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })),
});

const GenerateFeedPagesInputSchema = z.object({
  brandMemory: BrandMemorySchema,
  count: z.number().min(5).max(50).default(10),
});

export type GenerateFeedPagesInput = z.infer<typeof GenerateFeedPagesInputSchema>;

const PageOutputSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  type: z.enum(['Service+Location', 'Service+Industry', 'BuyerQuestion']),
  seoTitle: z.string().max(70),
  metaDescription: z.string().max(160),
  h1: z.string(),
  sections: z.array(z.object({
    h2: z.string(),
    content: z.string(),
  })),
  faqs: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })),
  internalLinks: z.array(z.string()).describe('List of related page slugs for internal linking suggestions.'),
});

const GenerateFeedPagesOutputSchema = z.array(PageOutputSchema);
export type GenerateFeedPagesOutput = z.infer<typeof GenerateFeedPagesOutputSchema>;

const generateFeedPagesPrompt = ai.definePrompt({
  name: 'generateFeedPagesPrompt',
  input: { schema: GenerateFeedPagesInputSchema },
  output: { schema: GenerateFeedPagesOutputSchema },
  prompt: `You are an expert SEO strategist for "rankwithai". 
Generate {{count}} unique web pages based STRICTLY on the following Brand Memory:

Company: {{{brandMemory.companyName}}}
Services: {{#each brandMemory.services}}- {{{this}}}
{{/each}}
Industries: {{#each brandMemory.industries}}- {{{this}}}
{{/each}}
Locations: {{#each brandMemory.locations}}- {{{this}}}
{{/each}}
Differentiators: {{{brandMemory.differentiators}}}
Tone: {{{brandMemory.tone}}}

STRICT RULES:
1. DETERMINISTIC LOGIC: Create a mix of:
   - Service + Location (e.g., "Managed IT in New York")
   - Service + Industry (e.g., "Cybersecurity for Finance")
   - Buyer Question (e.g., "How to choose a Cloud provider")
2. NO HALLUCINATIONS: Do not invent statistics, awards, or specific claims not mentioned in differentiators.
3. NO KEYWORD STUFFING: Content must be clean, authoritative, and professional.
4. STRUCTURE: Every page needs a unique slug, SEO title (<70 chars), Meta Description (<160 chars), H1, multiple H2 sections, and a relevant FAQ block (3-5 items).
5. INTERNAL LINKING: Suggest 2-3 other logical slugs from this set for internal linking.

Generate the output as a JSON array of page objects.`,
});

export async function generateFeedPages(input: GenerateFeedPagesInput): Promise<GenerateFeedPagesOutput> {
  const { output } = await generateFeedPagesPrompt(input);
  if (!output) throw new Error('Failed to generate feed pages.');
  return output;
}
