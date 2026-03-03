
/**
 * Page Quality Validator.
 * Audits generated content for structural integrity.
 */

export interface ValidationIssue {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ValidationResult {
  score: number;
  status: 'OK' | 'NEEDS_FIX';
  issues: ValidationIssue[];
}

export function validatePageContent(page: any): ValidationResult {
  const issues: ValidationIssue[] = [];
  let score = 100;

  // 1. Title/H1 Checks
  if (!page.h1 || page.h1.trim().length < 5) {
    issues.push({ code: 'MISSING_H1', message: 'Missing or too short H1 title.', severity: 'high' });
    score -= 30;
  }

  // 2. Structural Checks
  if (!page.sections || page.sections.length < 2) {
    issues.push({ code: 'THIN_CONTENT', message: 'Insufficient content sections (min 2).', severity: 'medium' });
    score -= 20;
  }

  // 3. Section Content Checks
  page.sections?.forEach((section: any, idx: number) => {
    if (!section.h2 || section.h2.trim().length < 5) {
      issues.push({ code: 'EMPTY_HEADING', message: `Section ${idx + 1} is missing a valid H2.`, severity: 'medium' });
      score -= 10;
    }
    if (!section.content || section.content.trim().length < 100) {
      issues.push({ code: 'THIN_SECTION', message: `Section ${idx + 1} content is too thin.`, severity: 'low' });
      score -= 5;
    }
    
    // Check for placeholder tokens like {{service}}
    if (/\{\{.*?\}\}/.test(section.content) || /\{\{.*?\}\}/.test(section.h2)) {
      issues.push({ code: 'UNRESOLVED_PLACEHOLDER', message: `Section ${idx + 1} contains unresolved placeholders (e.g. {{token}}).`, severity: 'high' });
      score -= 25;
    }
  });

  // 4. FAQ Checks
  if (!page.faqs || page.faqs.length === 0) {
    issues.push({ code: 'MISSING_FAQS', message: 'No FAQ block found.', severity: 'low' });
    score -= 10;
  } else {
    page.faqs.forEach((faq: any, idx: number) => {
      if (!faq.question || !faq.answer) {
        issues.push({ code: 'INVALID_FAQ', message: `FAQ ${idx + 1} is missing a question or answer.`, severity: 'medium' });
        score -= 5;
      }
    });
  }

  // 5. Hallucination Safeguard (Basic)
  const fakePatterns = [
    /\d{1,3}\.?\d?% growth/i, // Generic growth %
    /\$\d+ million/i, // Fake big numbers
    /certified by the international/i, // Generic certifications
  ];

  const fullText = JSON.stringify(page).toLowerCase();
  fakePatterns.forEach(pattern => {
    if (pattern.test(fullText)) {
      issues.push({ code: 'HALLUCINATION_RISK', message: 'Potential hallucinated statistic or generic certification detected.', severity: 'medium' });
      score -= 15;
    }
  });

  return {
    score: Math.max(0, score),
    status: issues.length > 0 ? 'NEEDS_FIX' : 'OK',
    issues
  };
}
