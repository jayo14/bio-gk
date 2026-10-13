import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://biogatekeeper.ng';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/api/', '/payment/return'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
