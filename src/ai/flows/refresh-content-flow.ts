
'use server';
/**
 * @fileOverview AI flow for optimizing or repairing specific page parts.
 * Handles meta-tag rewrites, section improvement, and FAQ refreshes.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const RefreshContentInputSchema = z.object({
  actionType: z.enum(['REWRITE_SEO', 'REWRITE_SECTION', 'SHORTEN_SECTION', 'IMPROVE_FAQS']),
  context: z.object({
    currentTitle: z.string().optional(),
    currentMeta: z.string().optional(),
    currentContent: z.string().optional(),
    currentFaqs: z.array(z.object({
      question: z.string(),
      answer: z.string(),
    })).optional(),
    sectionHeading: z.string().optional(),
  }),
  brandMemory: z.any(),
});

export type RefreshContentInput = z.infer<typeof RefreshContentInputSchema>;

const RefreshContentOutputSchema = z.object({
  seoTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  content: z.string().optional(),
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
  prompt: `You are an expert SEO editor for "{{brandMemory.companyName}}".
Your task is to REPAIR or OPTIMIZE a specific part of a B2B page.

Action Requested: {{{actionType}}}

Identity Context:
- Services: {{brandMemory.services}}
- Tone: {{brandMemory.tone}}
- Differentiators: {{brandMemory.differentiators}}

Current Context:
{{#if context.currentTitle}}Title: {{{context.currentTitle}}}{{/if}}
{{#if context.currentMeta}}Meta: {{{context.currentMeta}}}{{/if}}
{{#if context.sectionHeading}}Section: {{{context.sectionHeading}}}{{/if}}
{{#if context.currentContent}}Content: {{{context.currentContent}}}{{/if}}

INSTRUCTIONS:
1. Adhere strictly to the requested Action Type.
2. Maintain technical accuracy. Do NOT invent fake stats, certifications, or case studies.
3. If rewriting content, use clean HTML (p, ul, li tags).
4. Keep output concise and professional.
5. Ensure the tone matches: {{brandMemory.tone}}.

{{#if (eq actionType "REWRITE_SEO")}}
Rewrite the Title and Meta Description to be more enticing and clickable for B2B search intent.
{{else if (eq actionType "REWRITE_SECTION")}}
Rewrite the body content for the section "{{context.sectionHeading}}". Make it more authoritative and helpful.
{{else if (eq actionType "SHORTEN_SECTION")}}
Summarize and clarify the content for "{{context.sectionHeading}}". Keep only the most impactful B2B insights.
{{else if (eq actionType "IMPROVE_FAQS")}}
Improve the FAQ answers to be more specific to the business's differentiators.
{{/if}}`,
});

export async function refreshContent(input: RefreshContentInput): Promise<RefreshContentOutput> {
  const { output } = await refreshContentPrompt(input);
  if (!output) throw new Error('Repair failed.');
  return output;
}
