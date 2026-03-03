'use server';
/**
 * @fileOverview A Genkit flow for suggesting initial Brand Memory content for a business.
 *
 * - suggestBrandMemory - A function that suggests Brand Memory content based on business details.
 * - SuggestBrandMemoryInput - The input type for the suggestBrandMemory function.
 * - SuggestBrandMemoryOutput - The return type for the suggestBrandMemory function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SuggestBrandMemoryInputSchema = z.object({
  businessName: z.string().describe('The name of the business.'),
  website: z.string().url().describe('The website URL of the business.'),
  niche: z.string().describe('The target niche or industry of the business.'),
});
export type SuggestBrandMemoryInput = z.infer<typeof SuggestBrandMemoryInputSchema>;

const SuggestBrandMemoryOutputSchema = z.object({
  services: z.array(z.string()).describe('A list of services the business offers.'),
  industries: z.array(z.string()).describe('A list of industries the business serves.'),
  locations: z.array(z.string()).describe('A list of geographical locations where the business operates.'),
  differentiators: z.array(z.string()).describe('A list of unique selling propositions or what makes the business stand out.'),
  tone: z.string().describe('The suggested tone of voice for the business communication (e.g., professional, friendly, innovative, authoritative).'),
  faqs: z.array(z.object({
    question: z.string().describe('A common question about the business.'),
    answer: z.string().describe('A concise answer to the common question.'),
  })).describe('A list of frequently asked questions and their answers relevant to the business.'),
});
export type SuggestBrandMemoryOutput = z.infer<typeof SuggestBrandMemoryOutputSchema>;

export async function suggestBrandMemory(input: SuggestBrandMemoryInput): Promise<SuggestBrandMemoryOutput> {
  return suggestBrandMemoryFlow(input);
}

const suggestBrandMemoryPrompt = ai.definePrompt({
  name: 'suggestBrandMemoryPrompt',
  input: { schema: SuggestBrandMemoryInputSchema },
  output: { schema: SuggestBrandMemoryOutputSchema },
  prompt: `You are an expert marketing strategist specialized in helping B2B businesses quickly define their brand memory based on minimal information.
Your goal is to suggest comprehensive Brand Memory content for a business, covering services, industries, locations, differentiators, tone, and frequently asked questions (FAQs).
Use the provided business name, website, and niche to generate highly relevant and accurate suggestions.
Ensure all generated content is based strictly on the provided input, avoids fake statistics or unverifiable claims, and prefers general statements.

**Business Information:**
Business Name: {{{businessName}}}
Website: {{{website}}}
Niche: {{{niche}}}

Please generate the Brand Memory content in JSON format, adhering to the following structure:
{{jsonSchema SuggestBrandMemoryOutputSchema}}`,
});

const suggestBrandMemoryFlow = ai.defineFlow(
  {
    name: 'suggestBrandMemoryFlow',
    inputSchema: SuggestBrandMemoryInputSchema,
    outputSchema: SuggestBrandMemoryOutputSchema,
  },
  async (input) => {
    const { output } = await suggestBrandMemoryPrompt(input);
    return output!;
  }
);
