
'use server';
/**
 * Batch-processed content generation.
 * Fills deterministic skeletons in batches to reduce AI costs.
 * 
 * Rules:
 * - NO hallucinations.
 * - NO fake numbers.
 * - Strict adherence to style guide.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const BatchInputSchema = z.object({
  brandMemory: z.any(),
  skeletons: z.array(z.object({
    slug: z.string(),
    type: z.string(),
    h1: z.string(),
    sections: z.array(z.object({
      h2: z.string(),
      placeholder: z.string()
    })),
    context: z.any()
  })),
});

const BatchOutputSchema = z.array(z.object({
  slug: z.string(),
  summary: z.string().describe('AI-friendly summary, 40-60 words, explaining the page topic for search engines and AI crawlers.'),
  quickAnswer: z.string().describe('Direct answer block, 40-80 words, that AI systems can easily extract and cite.'),
  keyQuestions: z.array(z.object({
    question: z.string(),
    answer: z.string().describe('Short answer, 30-60 words per question')
  })).describe('3-5 key questions users might ask about this topic'),
  sections: z.array(z.object({
    h2: z.string(),
    content: z.string().describe('HTML content for this section. Use p, ul, li tags.')
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

Brand Identity:
Services: {{brandMemory.services}}
Differentiators: {{brandMemory.differentiators}}
Tone: {{brandMemory.tone}}
Industries: {{brandMemory.industries}}

INSTRUCTIONS:
1. For each skeleton, generate high-quality, authoritative body content for the provided H2s.
2. Content must be technical, helpful, and industry-specific.
3. DO NOT invent fake statistics, certifications, or specific numbers unless provided in brand memory.
4. Use valid HTML tags: <p>, <ul>, <li>, <strong>.
5. Focus on search intent and user value.

AI OPTIMIZATION (Critical for LLM citations):
- summary: Write a 40-60 word summary that directly explains what this page is about. Start with the key topic.
- quickAnswer: Provide a direct 40-80 word answer to the main question/topic. This is what AI systems will cite.
- keyQuestions: Generate 3-5 common questions users have about this topic with concise answers.
- faqs: Create 3-5 frequently asked questions with answers.

Skeletons to fill:
{{#each skeletons}}
- Page: {{h1}} ({{type}})
  H2s: {{#each sections}}{{h2}}, {{/each}}
  Context: {{context}}
{{/each}}`,
});

export async function generateBatchContent(brandMemory: any, skeletons: any[]) {
  const { output } = await batchContentPrompt({ brandMemory, skeletons });
  if (!output) throw new Error('Batch generation failed');
  return output;
}
