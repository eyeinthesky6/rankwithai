
'use server';
/**
 * AI Setup Copilot Flow.
 * Proposes project and brand memory structure based on conversation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CopilotInputSchema = z.object({
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })),
  context: z.object({
    currentProject: z.any().optional(),
    currentBrandMemory: z.any().optional()
  })
});

const CopilotDraftSchema = z.object({
  projectDraft: z.object({
    name: z.string(),
    website: z.string(),
    niche: z.string()
  }).optional(),
  brandMemoryDraft: z.object({
    services: z.array(z.string()),
    industries: z.array(z.string()),
    differentiators: z.string(),
    tone: z.enum(['Professional', 'Technical', 'Conversational'])
  }).optional(),
  confidenceNotes: z.string().describe('Notes on what needs verification or "needs confirmation".')
});

const copilotPrompt = ai.definePrompt({
  name: 'copilotPrompt',
  input: { schema: CopilotInputSchema },
  output: { schema: CopilotDraftSchema },
  prompt: `You are the AI Setup Copilot for "rankwithai".
Your goal is to help B2B businesses set up their search presence profile.

Conversation History:
{{#each history}}
- {{role}}: {{content}}
{{/each}}

STRICT RULES:
1. Do NOT invent certifications or specific legal claims.
2. If you don't know a field, mark it "needs confirmation" in confidenceNotes.
3. Propose a structured draft as soon as you have enough info (Business name, niche, services).

Output a Draft JSON when ready.`,
});

export async function copilotChat(input: z.infer<typeof CopilotInputSchema>) {
  const { output } = await copilotPrompt(input);
  return output;
}
