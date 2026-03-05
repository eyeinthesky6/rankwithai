
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://rankwithai.com';

  // In a real production setup, we'd query all public pages across all projects.
  // For the MVP sitemap, we provide the root and standard paths.
  // Note: Individual feed pages are typically indexed via the customer's sitemap 
  // when using path mounting, or via their custom subdomain.

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];
}
