
/**
 * Page Quality Validator.
 * Audits generated content for structural integrity.
 */

export interface ValidationResult {
  score: number;
  errors: string[];
}

export function validatePageContent(page: any): ValidationResult {
  const errors: string[] = [];
  let score = 100;

  // 1. Structural Checks
  if (!page.h1 || page.h1.trim().length < 5) {
    errors.push("Missing or too short H1 title.");
    score -= 30;
  }

  if (!page.sections || page.sections.length < 2) {
    errors.push("Insufficient content sections (min 2).");
    score -= 20;
  }

  // 2. Content Checks
  page.sections?.forEach((section: any, idx: number) => {
    if (!section.h2 || section.h2.trim().length < 5) {
      errors.push(`Section ${idx + 1} is missing a valid H2.`);
      score -= 10;
    }
    if (!section.content || section.content.trim().length < 100) {
      errors.push(`Section ${idx + 1} content is too thin.`);
      score -= 15;
    }
  });

  // 3. Hallucination Safeguard (Basic)
  const fakePatterns = [
    /\d{1,3}\.?\d?% growth/i, // Generic growth %
    /\$\d+ million/i, // Fake big numbers
    /certified by the international/i, // Generic certifications
  ];

  const fullText = JSON.stringify(page).toLowerCase();
  fakePatterns.forEach(pattern => {
    if (pattern.test(fullText)) {
      errors.push("Potential hallucinated statistic detected.");
      score -= 25;
    }
  });

  return {
    score: Math.max(0, score),
    errors
  };
}
