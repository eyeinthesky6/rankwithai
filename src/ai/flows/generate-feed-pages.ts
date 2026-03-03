
'use server';
/**
 * @fileOverview Stricter Genkit flow for generating deterministic, SEO-optimized pages.
 * Ensures combinations of Service+Location, Service+Industry, and Buyer Questions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const BrandMemorySchema = z.object({
  companyName: z.string(),
  services: z.array(z.string()).min(1),
  industries: z.array(z.string()),
  locations: z.array(z.string()),
  differentiators: z.string(),
  certifications: z.string().optional(),
  competitors: z.string().optional(),
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
    content: z.string().describe('HTML formatted content for the section.'),
  })),
  faqs: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })),
  internalLinks: z.array(z.string()).describe('Slugs of OTHER pages in this generated set that this page should logically link to.'),
});

const GenerateFeedPagesOutputSchema = z.array(PageOutputSchema);
export type GenerateFeedPagesOutput = z.infer<typeof GenerateFeedPagesOutputSchema>;

const generateFeedPagesPrompt = ai.definePrompt({
  name: 'generateFeedPagesPrompt',
  input: { schema: GenerateFeedPagesInputSchema },
  output: { schema: GenerateFeedPagesOutputSchema },
  prompt: `You are an expert SEO strategist for "{{brandMemory.companyName}}".
Generate a set of {{count}} high-quality, authoritative web pages based STRICTLY on the following Brand Memory:

Company: {{{brandMemory.companyName}}}
Services: {{#each brandMemory.services}}- {{{this}}}
{{/each}}
Industries: {{#each brandMemory.industries}}- {{{this}}}
{{/each}}
Locations: {{#each brandMemory.locations}}- {{{this}}}
{{/each}}
Differentiators: {{{brandMemory.differentiators}}}
Certifications: {{{brandMemory.certifications}}}
Tone: {{{brandMemory.tone}}}

STRICT STRATEGY:
Produce a deterministic mix of:
1. Service + Location (e.g. "Managed IT in New York") - Prioritize if locations exist.
2. Service + Industry (e.g. "Cybersecurity for Finance") - Prioritize if industries exist.
3. Buyer Question (e.g. "How to choose a B2B Cloud provider?") - Address pain points in the niche.

CONTENT GUIDELINES:
- NO HALLUCINATIONS: Do not invent statistics, awards, or specific claims (like "founded in 1995" or "1000+ clients") unless explicitly in the differentiators.
- NO KEYWORD STUFFING: Natural, semantic content that provides actual value.
- STRUCTURE: Every page must have:
  - Unique slug (kebab-case)
  - SEO Title (<70 chars)
  - Meta Description (<160 chars)
  - H1
  - 3+ Sections (H2 + body)
  - 3-5 FAQs
  - Internal links to 2-3 other slugs in this current generation set.

Generate the output as a JSON array of page objects.`,
});

export async function generateFeedPages(input: GenerateFeedPagesInput): Promise<GenerateFeedPagesOutput> {
  const { output } = await generateFeedPagesPrompt(input);
  if (!output) throw new Error('Failed to generate feed pages.');
  return output;
}
