
'use server';
/**
 * @fileOverview DNS Verification Flow.
 * Verifies TXT records for domain ownership and CNAME for routing.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { promises as dns } from 'node:dns';

const VerifyDnsInputSchema = z.object({
  domain: z.string().describe('The domain to verify (e.g., feeds.customer.com)'),
  token: z.string().optional().describe('The verification token for TXT check'),
  checkType: z.enum(['TXT', 'CNAME']).default('TXT')
});

const VerifyDnsOutputSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  foundRecords: z.array(z.string()).optional()
});

export async function verifyDomainDns(input: z.infer<typeof VerifyDnsInputSchema>) {
  return verifyDomainDnsFlow(input);
}

const verifyDomainDnsFlow = ai.defineFlow(
  {
    name: 'verifyDomainDnsFlow',
    inputSchema: VerifyDnsInputSchema,
    outputSchema: VerifyDnsOutputSchema,
  },
  async (input) => {
    try {
      if (input.checkType === 'TXT') {
        const verificationDomain = `_aifeed-verify.${input.domain}`;
        const records = await dns.resolveTxt(verificationDomain);
        const flattened = records.flat();
        
        const verified = flattened.some(r => r === input.token);
        
        return {
          success: verified,
          foundRecords: flattened,
          error: verified ? undefined : `Token not found in TXT records for ${verificationDomain}`
        };
      } else {
        const records = await dns.resolveCname(input.domain);
        // Best effort: check if it points to a rankwithai domain or similar
        // In a real setup, we'd check against our load balancer target
        const targetHost = 'feeds.rankwithai.com';
        const matches = records.some(r => r.toLowerCase().includes('rankwithai'));
        
        return {
          success: matches,
          foundRecords: records,
          error: matches ? undefined : `CNAME for ${input.domain} does not point to ${targetHost}`
        };
      }
    } catch (e: any) {
      return {
        success: false,
        error: e.code === 'ENODATA' || e.code === 'ENOTFOUND' 
          ? `No records found for ${input.checkType === 'TXT' ? '_aifeed-verify.' : ''}${input.domain}`
          : e.message
      };
    }
  }
);
