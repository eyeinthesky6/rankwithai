# AI Crawler Optimization Guide

This document describes the page structure optimizations for AI crawler indexing and AI answer citations (ChatGPT, Perplexity, Gemini, Claude).

## Overview

The page generation system has been enhanced with AI-friendly sections that make it easy for AI systems to extract and cite content. The existing design remains intact while adding new structured data and semantic HTML.

---

## 1. Files Modified

| File | Changes |
|------|---------|
| [`src/ai/flows/generate-feed-pages.ts`](src/ai/flows/generate-feed-pages.ts) | Added AI-optimized output schema: `summary`, `quickAnswer`, `keyQuestions` |
| [`src/app/lib/generation-service.ts`](src/app/lib/generation-service.ts) | Updated to store new AI fields in Firestore |
| [`src/app/lib/quality-validator.ts`](src/app/lib/quality-validator.ts) | Added validation for AI fields |
| [`src/app/lib/schema-generator.ts`](src/app/lib/schema-generator.ts) | **NEW** - Schema.org JSON-LD generator |
| [`src/app/feed/[projectSlug]/[pageSlug]/page.tsx`](src/app/feed/[projectSlug]/[pageSlug]/page.tsx) | Updated with semantic HTML and new AI sections |

---

## 2. Generator Logic Changes

### AI Content Generation Flow

The AI prompt now generates these additional fields:

```typescript
{
  summary: string;        // 40-60 words, AI-friendly summary
  quickAnswer: string;   // 40-80 words, direct answer for citations
  keyQuestions: [         // 3-5 questions with answers
    { question: string; answer: string; }
  ];
  sections: [...];        // Existing detailed content
  faqs: [...];           // Existing FAQ data
}
```

### Quality Validation

The quality validator now checks:
- `MISSING_SUMMARY` - AI summary missing or too short
- `MISSING_QUICK_ANSWER` - Quick answer block missing
- `INVALID_KEY_QUESTION` - Key question has incomplete content

---

## 3. Example Generated Page Structure

### HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Schema.org JSON-LD -->
  <script type="application/ld+json">
  [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "SEO Services in New York",
      "description": "Expert SEO services...",
      "url": "https://example.com/seo-services-new-york",
      "publisher": { "@type": "Organization", "name": "Company Name" }
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "What is SEO?", "acceptedAnswer": { "@type": "Answer", "text": "..." } }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Company Name",
      "url": "https://example.com"
    }
  ]
  </script>
</head>
<body>
  <article>
    <header>
      <!-- Existing: Type Badge -->
      <span class="text-[10px] font-bold uppercase tracking-widest text-primary">
        Service+Location
      </span>
      
      <!-- 1. TITLE (unchanged) -->
      <h1>SEO Services in New York</h1>
      
      <!-- 2. SUMMARY BLOCK (new) -->
      <p class="ai-summary">
        AI search optimization improves how websites appear in AI-generated answers 
        from systems like ChatGPT, Gemini and Perplexity. Structured content, clear 
        definitions and entity coverage increase the chances of being cited by AI systems.
      </p>
      
      <!-- Existing: Meta Description -->
      <p class="text-lg text-slate-500">Looking for SEO services in New York?...</p>
    </header>

    <!-- 3. DIRECT ANSWER BLOCK (new) -->
    <section class="ai-answer">
      <h2>Quick Answer</h2>
      <p>
        SEO services in New York help businesses improve their online visibility through
        search engine optimization techniques. These services include keyword research,
        on-page optimization, content strategy, and link building to drive organic traffic
        and increase conversions for local businesses.
      </p>
    </section>

    <!-- 4. KEY QUESTIONS SECTION (new) -->
    <section class="ai-questions">
      <h2>Key Questions</h2>
      
      <article class="ai-question">
        <h3>What is SEO?</h3>
        <p>Search engine optimization (SEO) is the practice of optimizing websites...</p>
      </article>
      
      <article class="ai-question">
        <h3>How does SEO work?</h3>
        <p>SEO works by improving various aspects of your website to make it more...</p>
      </article>
      
      <article class="ai-question">
        <h3>Why is SEO important?</h3>
        <p>SEO is crucial because it helps your business appear in search results...</p>
      </article>
    </section>

    <!-- Existing: Main Content Sections -->
    <section>
      <h2>Why Choose Our SEO Services in New York?</h2>
      <div class="prose">...content...</div>
    </section>

    <!-- 5. EXPLANATION SECTION (new) -->
    <section>
      <h2>Detailed Explanation</h2>
      <div class="prose">
        <h3>Why Choose Our SEO Services in New York?</h3>
        <div>...content...</div>
        
        <h3>Our SEO Process</h3>
        <div>...content...</div>
        
        <h3>Local Support for New York Businesses</h3>
        <div>...content...</div>
      </div>
    </section>

    <!-- 6. FAQ SECTION (enhanced) -->
    <section class="ai-faq">
      <h2>Frequently Asked Questions</h2>
      
      <article>
        <h3>How long does SEO take to show results?</h3>
        <p>SEO typically takes 3-6 months to see significant results...</p>
      </article>
      
      <article>
        <h3>What is the cost of SEO services?</h3>
        <p>SEO service costs vary based on scope and competition...</p>
      </article>
      
      <article>
        <h3>Do you offer local SEO?</h3>
        <p>Yes, we specialize in local SEO for New York businesses...</p>
      </article>
    </section>
  </article>
</body>
</html>
```

---

## 4. Schema Markup Generated

Each page automatically includes these schema types:

| Schema Type | Purpose |
|------------|---------|
| **Article** | Main content for SEO and AI understanding |
| **FAQPage** | FAQ data for rich snippets |
| **Organization** | Company information for entity recognition |

---

## 5. CSS Classes for AI Extraction

The following classes are available for AI crawler optimization:

| Class | Element |
|-------|---------|
| `ai-summary` | Summary block below title |
| `ai-answer` | Quick answer section |
| `ai-question` | Individual key questions |
| `ai-faq` | FAQ section |

These classes can be targeted by AI crawlers for content extraction.

---

## 6. Semantic HTML Structure

The generated pages now use proper semantic elements:

```html
<article>
  <header>
    <h1>Title</h1>
  </header>
  
  <section class="ai-answer">
    <h2>Quick Answer</h2>
  </section>
  
  <section class="ai-questions">
    <h2>Key Questions</h2>
    <article class="ai-question">
      <h3>Question</h3>
    </article>
  </section>
  
  <section>
    <h2>Detailed Explanation</h2>
  </section>
  
  <section class="ai-faq">
    <h2>Frequently Asked Questions</h2>
    <article>
      <h3>Question</h3>
    </article>
  </section>
</article>
```

---

## 7. Backward Compatibility

- Existing pages without new AI fields will render without the new sections
- New pages generated will include all AI optimization features
- No changes to routing, database schema, or generation workflow
- Original design and layout preserved
