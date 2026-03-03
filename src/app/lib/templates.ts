
/**
 * Deterministic template engine for page skeletons.
 * Prevents unnecessary AI calls for structure and basic metadata.
 */

export interface PageSkeleton {
  slug: string;
  type: 'Service+Location' | 'Service+Industry' | 'BuyerQuestion';
  h1: string;
  seoTitle: string;
  metaDescription: string;
  sections: { h2: string; placeholder: string }[];
  context: any;
  internalLinks: string[];
}

export function generateSkeletons(brandMemory: any, count: number): PageSkeleton[] {
  const skeletons: PageSkeleton[] = [];
  const { services, locations, industries, faqs, companyName } = brandMemory;

  // 1. Service + Location (Priority if locations exist)
  if (locations?.length > 0) {
    for (const loc of locations) {
      for (const service of services) {
        if (skeletons.length >= count) break;
        const slug = `${service}-${loc}`.toLowerCase().replace(/ /g, '-');
        
        // Find related locations for internal linking
        const otherLocs = locations.filter((l: string) => l !== loc).slice(0, 3);
        const internalLinks = otherLocs.map((l: string) => `${service}-${l}`.toLowerCase().replace(/ /g, '-'));

        skeletons.push({
          slug,
          type: 'Service+Location',
          h1: `${service} in ${loc}`,
          seoTitle: `Best ${service} in ${loc} | ${companyName}`,
          metaDescription: `Looking for ${service} in ${loc}? ${companyName} provides professional solutions for your needs in ${loc}.`,
          sections: [
            { h2: `Why Choose ${companyName} for ${service} in ${loc}?`, placeholder: 'benefit_content' },
            { h2: `Our ${service} Process`, placeholder: 'process_content' },
            { h2: `Local Support for ${loc} Businesses`, placeholder: 'local_content' }
          ],
          context: { service, location: loc },
          internalLinks
        });
      }
    }
  }

  // 2. Service + Industry
  if (industries?.length > 0) {
    for (const ind of industries) {
      for (const service of services) {
        if (skeletons.length >= count) break;
        const slug = `${service}-for-${ind}`.toLowerCase().replace(/ /g, '-');
        
        // Find related industries for internal linking
        const otherInds = industries.filter((i: string) => i !== ind).slice(0, 3);
        const internalLinks = otherInds.map((i: string) => `${service}-for-${i}`.toLowerCase().replace(/ /g, '-'));

        skeletons.push({
          slug,
          type: 'Service+Industry',
          h1: `${service} for the ${ind} Industry`,
          seoTitle: `${service} Solutions for ${ind} | ${companyName}`,
          metaDescription: `Expert ${service} tailored specifically for ${ind} companies. Scale your ${ind} operations with ${companyName}.`,
          sections: [
            { h2: `Addressing ${ind} Challenges with ${service}`, placeholder: 'industry_pain_point' },
            { h2: `Specialized ${service} for ${ind}`, placeholder: 'specialized_solution' }
          ],
          context: { service, industry: ind },
          internalLinks
        });
      }
    }
  }

  // 3. Buyer Questions
  const questions = faqs?.map((f: any) => f.question) || [
    `How to choose the right ${services[0]} provider?`,
    `What are the benefits of professional ${services[0]}?`
  ];

  for (const q of questions) {
    if (skeletons.length >= count) break;
    const slug = q.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50);
    skeletons.push({
      slug,
      type: 'BuyerQuestion',
      h1: q,
      seoTitle: `${q} | ${companyName} Guide`,
      metaDescription: `Learn about ${q} and how ${companyName} can help you navigate these ${brandMemory.niche} challenges.`,
      sections: [
        { h2: 'Expert Insights', placeholder: 'expert_answer' },
        { h2: 'Key Considerations', placeholder: 'considerations' }
      ],
      context: { question: q },
      internalLinks: [] // Questions link to services generally
    });
  }

  return skeletons;
}
