
'use server';
/**
 * @fileOverview AI flow for optimizing existing pages based on search metrics.
 * Handles meta-tag rewrites and FAQ refreshes.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const RefreshContentInputSchema = z.object({
  currentTitle: z.string(),
  currentMeta: z.string(),
  currentFaqs: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })),
  brandMemory: z.any(),
  targetMetric: z.enum(['CTR', 'RANK']),
  queries: z.array(z.string()).optional(),
});

export type RefreshContentInput = z.infer<typeof RefreshContentInputSchema>;

const RefreshContentOutputSchema = z.object({
  seoTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  faqs: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).optional(),
});

export type RefreshContentOutput = z.infer<typeof RefreshContentOutputSchema>;

const refreshContentPrompt = ai.definePrompt({
  name: 'refreshContentPrompt',
  input: { schema: RefreshContentInputSchema },
  output: { schema: RefreshContentOutputSchema },
  prompt: `You are an SEO optimization agent for "{{brandMemory.companyName}}".
Your task is to REFRESH specific parts of a page to improve search performance.

Current State:
Title: {{{currentTitle}}}
Meta: {{{currentMeta}}}
Target Issue: {{{targetMetric}}} (CTR means we need better clicks, RANK means we need more helpful content)

STRICT IDENTITY:
- Company: {{{brandMemory.companyName}}}
- Differentiators: {{{brandMemory.differentiators}}}
- Tone: {{{brandMemory.tone}}}

INSTRUCTIONS:
{{#if (eq targetMetric "CTR")}}
1. Rewrite the SEO Title and Meta Description to be more enticing and clickable.
2. Maintain technical accuracy. 
3. Include high-performing keywords if provided: {{#each queries}}{{{this}}}, {{/each}}.
{{else}}
1. Refresh the FAQ section. Add 1-2 more specific questions or update existing ones to be more authoritative.
2. Address these user queries if provided: {{#each queries}}{{{this}}}, {{/each}}.
{{/if}}

NO HALLUCINATIONS. NO FAKE STATS.`,
});

export async function refreshContent(input: RefreshContentInput): Promise<RefreshContentOutput> {
  const { output } = await refreshContentPrompt(input);
  if (!output) throw new Error('Refresh failed.');
  return output;
}
