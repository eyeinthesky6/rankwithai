/**
 * Deterministic Auto-Fix Engine.
 * Repairs structural issues, resolves tokens, and reconciles links without AI.
 */

import { generateSkeletons } from './templates';

export interface FixResult {
  fixedPage: any;
  summary: string;
}

export function autoFixPage(page: any, brandMemory: any): FixResult {
  const fixes: string[] = [];
  const fixedPage = JSON.parse(JSON.stringify(page)); // Deep clone
  
  // 1. Heading Normalization
  if (!fixedPage.h1 && fixedPage.seoTitle) {
    fixedPage.h1 = fixedPage.seoTitle.split('|')[0].trim();
    fixes.push('Generated H1 from SEO Title');
  }

  // 2. Token Replacement (Zero AI)
  // Maps all known template tokens to Brand Memory values
  const tokens: Record<string, string> = {
    '{{service}}': brandMemory.services?.[0] || 'our services',
    '{{companyName}}': brandMemory.companyName || 'our company',
    '{{niche}}': brandMemory.niche || 'industry',
    '{{location}}': (page.context?.location) || brandMemory.locations?.[0] || 'your area',
    '{{industry}}': (page.context?.industry) || brandMemory.industries?.[0] || 'your industry',
    '{{tone}}': brandMemory.tone || 'professional'
  };

  const replaceAllTokens = (text: string) => {
    if (!text) return '';
    let newText = text;
    Object.entries(tokens).forEach(([token, value]) => {
      newText = newText.split(token).join(value);
    });
    return newText;
  };

  // Apply resolution to all content fields
  fixedPage.h1 = replaceAllTokens(fixedPage.h1);
  fixedPage.seoTitle = replaceAllTokens(fixedPage.seoTitle);
  fixedPage.metaDescription = replaceAllTokens(fixedPage.metaDescription);
  
  fixedPage.sections = (fixedPage.sections || []).map((s: any) => ({
    ...s,
    h2: replaceAllTokens(s.h2),
    content: replaceAllTokens(s.content)
  }));

  // 3. Structural Rebuild (Restore missing sections from skeletons)
  const allSkeletons = generateSkeletons(brandMemory, 100);
  const originalSkeleton = allSkeletons.find(s => s.slug === page.slug);

  if (originalSkeleton) {
    // Ensure all internal links are reconciled
    fixedPage.internalLinks = originalSkeleton.internalLinks || [];
    
    // Check for missing sections from the skeleton
    originalSkeleton.sections.forEach(skelSection => {
      const exists = fixedPage.sections.some((s: any) => s.h2.includes(skelSection.h2) || skelSection.h2.includes(s.h2));
      if (!exists) {
        fixedPage.sections.push({
          h2: replaceAllTokens(skelSection.h2),
          content: `<p>Strategic insights regarding ${replaceAllTokens(skelSection.h2)} for your ${brandMemory.niche} needs.</p>`
        });
        fixes.push(`Restored section: ${skelSection.h2}`);
      }
    });
  }

  // 4. FAQ Sanitization
  if (fixedPage.faqs) {
    fixedPage.faqs = fixedPage.faqs
      .filter((f: any) => f.question && f.answer)
      .map((f: any) => ({
        question: replaceAllTokens(f.question),
        answer: replaceAllTokens(f.answer)
      }));
  }

  // 5. Metadata Update
  fixedPage.version = (page.version || 1) + 1;
  fixedPage.qaStatus = 'FIXED';
  fixedPage.updatedAt = new Date().toISOString();

  const finalSummary = fixes.length > 0 
    ? `Deterministic repairs: ${fixes.join(', ')}` 
    : 'Structural normalization and token resolution performed.';

  return {
    fixedPage,
    summary: finalSummary
  };
}
