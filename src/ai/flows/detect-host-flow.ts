
'use server';
/**
 * @fileOverview AI flow for detecting a website's hosting provider.
 * Analyzes headers to provide tailored publishing instructions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DetectHostInputSchema = z.object({
  url: z.string().url().describe('The website URL to analyze'),
});

const DetectHostOutputSchema = z.object({
  host: z.enum(['Cloudflare', 'Vercel', 'Netlify', 'WordPress', 'Nginx', 'Apache', 'Unknown']),
  headers: z.record(z.string()).describe('Selected identifying headers'),
  confidence: z.number().min(0).max(100),
  reasoning: z.string().describe('Short explanation of the detection')
});

export async function detectHost(input: z.infer<typeof DetectHostInputSchema>) {
  return detectHostFlow(input);
}

const detectHostFlow = ai.defineFlow(
  {
    name: 'detectHostFlow',
    inputSchema: DetectHostInputSchema,
    outputSchema: DetectHostOutputSchema,
  },
  async (input) => {
    try {
      // Best-effort header fetch
      const response = await fetch(input.url, { 
        method: 'HEAD', 
        headers: { 'User-Agent': 'rankwithai-bot/1.0' },
        next: { revalidate: 0 } 
      });
      
      const rawHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        rawHeaders[key] = value;
      });

      // Filter headers for the LLM to save tokens
      const interesting = ['server', 'x-vercel-id', 'x-nf-request-id', 'cf-ray', 'x-powered-by', 'via'];
      const filteredHeaders: Record<string, string> = {};
      interesting.forEach(k => {
        if (rawHeaders[k]) filteredHeaders[k] = rawHeaders[k];
      });

      const { output } = await ai.generate({
        prompt: `Analyze these HTTP headers for ${input.url} and identify the hosting platform.
        Headers: ${JSON.stringify(filteredHeaders)}`,
        output: { schema: DetectHostOutputSchema }
      });

      return {
        ...output!,
        headers: filteredHeaders // Return the filtered set for UI feedback
      };
    } catch (e: any) {
      return {
        host: 'Unknown',
        headers: {},
        confidence: 0,
        reasoning: `Could not reach site: ${e.message}`
      };
    }
  }
);
