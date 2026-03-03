'use server';
/**
 * @fileOverview A Genkit flow for generating a set of AI-optimized web pages for a project's feed based on structured Brand Memory.
 *
 * - generateFeedPages - A function that triggers the AI to generate 20-50 unique, optimized web pages.
 * - GenerateFeedPagesInput - The input type for the generateFeedPages function.
 * - GenerateFeedPagesOutput - The return type for the generateFeedPages function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BrandMemorySchema = z.object({
  services: z.array(z.string()).describe('List of services offered by the business.'),
  industries: z.array(z.string()).describe('List of industries the business serves.'),
  locations: z.array(z.string()).describe('List of geographical locations the business operates in.'),
  differentiators: z.array(z.string()).describe('Key factors that make the business stand out.'),
  tone: z.string().describe('The overall tone of voice for the content (e.g., professional, friendly, authoritative).'),
  faqs: z.array(z.object({
    question: z.string().describe('An FAQ question.'),
    answer: z.string().describe('The answer to the FAQ question.'),
  })).describe('Common questions and answers related to the business.'),
}).describe('Structured Brand Memory details for the business.');

const GenerateFeedPagesInputSchema = z.object({
  projectName: z.string().describe('The name of the business project.'),
  website: z.string().url().describe('The official website of the business.'),
  niche: z.string().describe('The target niche or industry of the business.'),
  brandMemory: BrandMemorySchema.describe('The structured Brand Memory for content generation.'),
}).describe('Input for generating a set of AI-optimized web pages.');
export type GenerateFeedPagesInput = z.infer<typeof GenerateFeedPagesInputSchema>;

const PageTypeSchema = z.enum([
  'Service Page',
  'Industry Page',
  'Location Page',
  'About Us',
  'Why Choose Us',
  'FAQ',
  'Contact Us',
  'Homepage'
]).describe('The type of content page being generated.');

const PageOutputSchema = z.object({
  pageSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).describe('A unique, kebab-case URL slug for the page.'),
  pageType: PageTypeSchema,
  title: z.string().max(70).describe('An SEO-friendly title for the page, under 70 characters.'),
  metaDescription: z.string().max(160).describe('An SEO-friendly meta description for the page, around 150-160 characters.'),
  htmlContent: z.string().describe('The full HTML body content of the page, without <html>, <head>, or <body> tags. Use semantic HTML (h1, p, ul, ol, strong, em, a) and focus on readability and clarity. Ensure no fake statistics or unverifiable claims. Prefer general statements.'),
  faqJson: z.array(z.object({
    question: z.string().describe('A relevant question for this specific page.'),
    answer: z.string().describe('The answer to the relevant question.'),
  })).describe('An array of relevant FAQs for this specific page, drawing from or expanding on the Brand Memory.'),
}).describe('Schema for a single AI-generated web page.');

const GenerateFeedPagesOutputSchema = z.array(PageOutputSchema)
  .min(20).max(50)
  .describe('An array of 20 to 50 unique, AI-optimized web pages.');
export type GenerateFeedPagesOutput = z.infer<typeof GenerateFeedPagesOutputSchema>;

export async function generateFeedPages(input: GenerateFeedPagesInput): Promise<GenerateFeedPagesOutput> {
  return generateFeedPagesFlow(input);
}

const generateFeedPagesPrompt = ai.definePrompt({
  name: 'generateFeedPagesPrompt',
  input: {schema: GenerateFeedPagesInputSchema},
  output: {schema: GenerateFeedPagesOutputSchema},
  prompt: `You are an expert content strategist and SEO specialist tasked with generating a set of unique, optimized web pages for a business's feed.
Your goal is to create between 20 and 50 distinct web pages, each with a unique slug, title, meta description, HTML content, and a set of relevant FAQs.
All content MUST strictly adhere to the provided Brand Memory and project details.

Strict Content Rules:
1.  **No Fake Statistics or Unverifiable Claims:** Do not invent numbers, statistics, or specific claims that cannot be verified. Stick to general statements and established facts from the Brand Memory.
2.  **Prefer General Statements + FAQs:** Focus on broad information, benefits, and address common questions through FAQs.
3.  **Use Brand Memory Strictly:** Only use information provided in the Brand Memory. Do not introduce new services, industries, locations, differentiators, or FAQs unless they are a logical extension or rephrasing of the provided data.
4.  **Clean, Readable, Non-Spammy Output:** Ensure the HTML content is well-structured, easy to read, uses semantic HTML tags (h1, p, ul, ol, strong, em, a), and avoids keyword stuffing or repetitive phrases.
5.  **Tone of Voice:** Maintain the specified tone of voice from the Brand Memory throughout all content.
6.  **Page Uniqueness:** Ensure each generated page is distinct in its primary focus and content, covering different aspects of the business based on the Brand Memory.

Project Details:
- Project Name: {{{projectName}}}
- Website: {{{website}}}
- Niche: {{{niche}}}

Brand Memory:
- Services: {{#each brandMemory.services}}- {{{this}}}
{{/each}}
- Industries Served: {{#each brandMemory.industries}}- {{{this}}}
{{/each}}
- Locations: {{#each brandMemory.locations}}- {{{this}}}
{{/each}}
- Differentiators: {{#each brandMemory.differentiators}}- {{{this}}}
{{/each}}
- Tone of Voice: {{{brandMemory.tone}}}
- Existing FAQs:
{{#each brandMemory.faqs}}
  - Q: {{{question}}}
    A: {{{answer}}}
{{/each}}

Generate a JSON array of 20 to 50 page objects. Each object in the array must strictly conform to the PageOutputSchema described below. Ensure page slugs are unique and in kebab-case. Each page should have relevant FAQs drawn from the Brand Memory or logically expanded based on the page's content, maintaining consistency with the overall brand. Prioritize creating a variety of page types including Service Pages, Industry Pages, Location Pages, and general informational pages like 'About Us' or 'Why Choose Us'.
`
});

const generateFeedPagesFlow = ai.defineFlow(
  {
    name: 'generateFeedPagesFlow',
    inputSchema: GenerateFeedPagesInputSchema,
    outputSchema: GenerateFeedPagesOutputSchema,
  },
  async (input) => {
    const {output} = await generateFeedPagesPrompt(input);
    if (!output) {
      throw new Error('Failed to generate feed pages.');
    }
    return output;
  }
);
