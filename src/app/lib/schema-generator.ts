/**
 * Schema.org JSON-LD Generator
 * Generates structured data for AI crawlers and search engines.
 */

export interface SchemaOrgFAQ {
  question: string;
  answer: string;
}

export interface SchemaOrgArticle {
  headline: string;
  description: string;
  url: string;
  author?: {
    name: string;
  };
  publisher?: {
    name: string;
    logo?: string;
  };
  datePublished?: string;
  dateModified?: string;
}

export interface SchemaOrgOrganization {
  name: string;
  url: string;
  logo?: string;
  contactPoint?: {
    telephone?: string;
    contactType?: string;
  };
}

/**
 * Generates FAQPage schema for structured FAQ data
 */
export function generateFAQSchema(faqs: SchemaOrgFAQ[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

/**
 * Generates Article schema for blog posts and articles
 */
export function generateArticleSchema(article: SchemaOrgArticle) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.headline,
    "description": article.description,
    "url": article.url,
    "author": article.author ? {
      "@type": "Person",
      "name": article.author.name
    } : undefined,
    "publisher": article.publisher ? {
      "@type": "Organization",
      "name": article.publisher.name,
      "logo": article.publisher.logo ? {
        "@type": "ImageObject",
        "url": article.publisher.logo
      } : undefined
    } : undefined,
    "datePublished": article.datePublished,
    "dateModified": article.dateModified || article.datePublished,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": article.url
    }
  };
}

/**
 * Generates Organization schema
 */
export function generateOrganizationSchema(org: SchemaOrgOrganization) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": org.name,
    "url": org.url,
    "logo": org.logo,
    "contactPoint": org.contactPoint ? {
      "@type": "ContactPoint",
      "telephone": org.contactPoint.telephone,
      "contactType": org.contactPoint.contactType || "customer service"
    } : undefined
  };
}

/**
 * Generates BreadcrumbList schema
 */
export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}

/**
 * Generates complete page schema with all relevant types
 */
export function generatePageSchema(options: {
  pageUrl: string;
  title: string;
  description: string;
  publishedAt?: string;
  modifiedAt?: string;
  authorName?: string;
  publisherName?: string;
  publisherLogo?: string;
  organizationName?: string;
  organizationUrl?: string;
  organizationLogo?: string;
  faqs?: SchemaOrgFAQ[];
}) {
  const schemas: any[] = [];

  // Add Article schema for the main content
  schemas.push(generateArticleSchema({
    headline: options.title,
    description: options.description,
    url: options.pageUrl,
    author: options.authorName ? { name: options.authorName } : undefined,
    publisher: options.publisherName ? { 
      name: options.publisherName, 
      logo: options.publisherLogo 
    } : undefined,
    datePublished: options.publishedAt,
    dateModified: options.modifiedAt
  }));

  // Add FAQ schema if FAQs exist
  if (options.faqs && options.faqs.length > 0) {
    schemas.push(generateFAQSchema(options.faqs));
  }

  // Add Organization schema if org info exists
  if (options.organizationName) {
    schemas.push(generateOrganizationSchema({
      name: options.organizationName,
      url: options.organizationUrl || options.pageUrl,
      logo: options.organizationLogo
    }));
  }

  return schemas;
}
