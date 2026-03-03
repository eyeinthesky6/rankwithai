
/**
 * Deterministic Auto-Fix Engine.
 * Repairs structural issues without using AI calls.
 */

import { generateSkeletons } from './templates';

export interface FixResult {
  fixedPage: any;
  summary: string;
}

export function autoFixPage(page: any, brandMemory: any): FixResult {
  const fixes: string[] = [];
  const fixedPage = JSON.parse(JSON.stringify(page)); // Deep clone
  
  // 1. Heading Normalization (Single H1)
  // Our templates already enforce this, but if a manual edit or bad AI batch happened:
  if (!fixedPage.h1 && fixedPage.seoTitle) {
    fixedPage.h1 = fixedPage.seoTitle.split('|')[0].trim();
    fixes.push('Generated missing H1 from SEO title');
  }

  // 2. Token Replacement (Zero AI)
  const tokens = {
    '{{service}}': brandMemory.services?.[0] || 'our services',
    '{{companyName}}': brandMemory.companyName || 'our company',
    '{{niche}}': brandMemory.niche || 'industry',
    '{{location}}': (page.context?.location) || brandMemory.locations?.[0] || 'your area',
    '{{industry}}': (page.context?.industry) || brandMemory.industries?.[0] || 'your industry'
  };

  const replaceInText = (text: string) => {
    let newText = text;
    Object.entries(tokens).forEach(([token, value]) => {
      if (newText.includes(token)) {
        newText = newText.replaceAll(token, value);
      }
    });
    return newText;
  };

  fixedPage.h1 = replaceInText(fixedPage.h1);
  fixedPage.sections = fixedPage.sections.map((s: any) => ({
    ...s,
    h2: replaceInText(s.h2),
    content: replaceInText(s.content)
  }));

  if (fixes.length === 0 && JSON.stringify(page) !== JSON.stringify(fixedPage)) {
    fixes.push('Resolved template placeholders ({{service}}, etc.)');
  }

  // 3. Structural Rebuild (If sections are missing)
  if (!fixedPage.sections || fixedPage.sections.length < 2) {
    // Attempt to find original skeleton to restore placeholders
    const skeletons = generateSkeletons(brandMemory, 100);
    const original = skeletons.find(s => s.slug === page.slug);
    if (original) {
      fixedPage.sections = original.sections.map(s => ({
        h2: s.h2,
        content: `<p>Detailed insights on ${s.h2.toLowerCase()} coming soon.</p>`
      }));
      fixes.push('Restored missing structural sections from templates');
    }
  }

  // 4. FAQ Normalization
  if (fixedPage.faqs) {
    fixedPage.faqs = fixedPage.faqs.filter((f: any) => f.question && f.answer);
  }

  // 5. Versioning
  fixedPage.version = (page.version || 1) + 1;
  fixedPage.qaStatus = 'FIXED';
  fixedPage.updatedAt = new Date().toISOString();

  return {
    fixedPage,
    summary: fixes.length > 0 ? fixes.join(', ') : 'Structural normalization performed'
  };
}
