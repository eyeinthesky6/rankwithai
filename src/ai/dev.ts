
import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-brand-memory-flow.ts';
import '@/ai/flows/generate-feed-pages.ts';
import '@/ai/flows/refresh-content-flow.ts';
import '@/ai/flows/verify-domain-dns.ts';
import '@/ai/flows/detect-host-flow.ts';
