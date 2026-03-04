
'use server';
/**
 * @fileOverview Visitor Help Agent Flow.
 * Answers strictly from Product Feature Document.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

const ChatInputSchema = z.object({
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })),
  message: z.string()
});

const ChatOutputSchema = z.object({
  content: z.string(),
  suggestedAction: z.enum(['signup', 'demo', 'none']).default('none')
});

export async function visitorChat(input: z.infer<typeof ChatInputSchema>) {
  return visitorChatFlow(input);
}

const visitorChatFlow = ai.defineFlow(
  {
    name: 'visitorChatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    const { firestore } = initializeFirebase();
    const docRef = doc(firestore, 'systemConfig', 'product');
    let productDoc = 'No product information available.';
    
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        productDoc = docSnap.data().productDoc || productDoc;
      }
    } catch (e) {
      console.warn('Could not fetch product doc for chat context:', e);
    }

    const { output } = await ai.generate({
      system: `You are the "Feed Guide" AI agent for rankwithai.
      Your goal is to explain what rankwithai is and how it helps B2B businesses scale their search presence.
      
      STRICT KNOWLEDGE BOUNDARY:
      1. Use ONLY the following Product Feature Document as your source of truth.
      2. If information is not in the document, say "I'm sorry, I don't have that specific detail. Would you like to speak with our human team?"
      3. Do NOT guess internal implementation details or technical stack.
      4. Quote or reference specific sections of the doc when helpful.
      5. Stay friendly, professional, and slightly witty.
      
      PRODUCT DOCUMENT:
      ${productDoc}`,
      prompt: [
        ...input.history.map(h => ({ role: h.role, content: [{ text: h.content }] })),
        { text: input.message }
      ],
      output: { schema: ChatOutputSchema }
    });

    return output!;
  }
);
