/**
 * Page Quality Validator.
 * Audits generated content for structural integrity and SEO readiness.
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
    issues.push({ code: 'MISSING_H1', message: 'Missing or insufficient H1 title.', severity: 'high' });
    score -= 30;
  }

  // 2. Structural Checks (Minimal template requirements)
  const minSections = page.type === 'BuyerQuestion' ? 2 : 3;
  if (!page.sections || page.sections.length < minSections) {
    issues.push({ code: 'THIN_CONTENT', message: `Insufficient content sections for type ${page.type} (min ${minSections}).`, severity: 'medium' });
    score -= 20;
  }

  // 3. Section & Token Checks
  page.sections?.forEach((section: any, idx: number) => {
    if (!section.h2 || section.h2.trim().length < 5) {
      issues.push({ code: 'EMPTY_HEADING', message: `Section ${idx + 1} is missing a valid H2 heading.`, severity: 'medium' });
      score -= 10;
    }
    if (!section.content || section.content.trim().length < 100) {
      issues.push({ code: 'THIN_SECTION', message: `Section ${idx + 1} content is below 100 characters.`, severity: 'low' });
      score -= 5;
    }
    
    // Check for placeholder tokens
    const tokenRegex = /\{\{.*?\}\}/g;
    const hasTokens = tokenRegex.test(section.content) || tokenRegex.test(section.h2);
    if (hasTokens) {
      issues.push({ code: 'UNRESOLVED_PLACEHOLDER', message: `Section ${idx + 1} contains unresolved placeholders (e.g. {{service}}).`, severity: 'high' });
      score -= 25;
    }
  });

  // 4. FAQ Checks
  if (!page.faqs || page.faqs.length === 0) {
    issues.push({ code: 'MISSING_FAQS', message: 'No FAQ data found for schema generation.', severity: 'medium' });
    score -= 15;
  } else {
    page.faqs.forEach((faq: any, idx: number) => {
      if (!faq.question || !faq.answer || faq.question.length < 5 || faq.answer.length < 10) {
        issues.push({ code: 'INVALID_FAQ', message: `FAQ ${idx + 1} has incomplete or invalid content.`, severity: 'medium' });
        score -= 5;
      }
    });
  }

  // 5. AI Optimization Checks (new fields for LLM citation)
  if (!page.summary || page.summary.trim().length < 30) {
    issues.push({ code: 'MISSING_SUMMARY', message: 'AI summary is missing or too short for optimal LLM citation.', severity: 'medium' });
    score -= 10;
  }
  
  if (!page.quickAnswer || page.quickAnswer.trim().length < 30) {
    issues.push({ code: 'MISSING_QUICK_ANSWER', message: 'Quick answer block is missing or too short for AI extraction.', severity: 'medium' });
    score -= 10;
  }
  
  if (!page.keyQuestions || page.keyQuestions.length < 3) {
    issues.push({ code: 'MISSING_KEY_QUESTIONS', message: 'Key questions section should have at least 3 questions for AI optimization.', severity: 'low' });
    score -= 5;
  } else {
    page.keyQuestions.forEach((kq: any, idx: number) => {
      if (!kq.question || !kq.answer || kq.question.length < 5 || kq.answer.length < 20) {
        issues.push({ code: 'INVALID_KEY_QUESTION', message: `Key question ${idx + 1} has incomplete content.`, severity: 'low' });
        score -= 3;
      }
    });
  }

  // 6. Hallucination Safeguard (Pattern checks)
  const fakePatterns = [
    /\d{1,3}\.?\d?% growth/i,
    /\$\d+ million/i,
    /certified by the international/i,
  ];

  const fullText = JSON.stringify(page).toLowerCase();
  fakePatterns.forEach(pattern => {
    if (pattern.test(fullText)) {
      issues.push({ code: 'HALLUCINATION_RISK', message: 'Detected generic growth statistic or certification that may be hallucinated.', severity: 'medium' });
      score -= 10;
    }
  });

  return {
    score: Math.max(0, score),
    status: issues.some(i => i.severity === 'high' || i.severity === 'medium') ? 'NEEDS_FIX' : 'OK',
    issues
  };
}
