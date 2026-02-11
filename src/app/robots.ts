/**
 * Robots.txt Generator
 *
 * Configures crawling rules for search engines and AI agents.
 */

import { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://movdpro.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/property/*',
          '/neighborhoods/*',
          '/r/*', // Public shared reports
        ],
        disallow: [
          '/api/', // API endpoints
          '/dashboard/', // Authenticated dashboard
          '/clients/', // Private client data
          '/reports/', // Private reports
          '/search', // Requires auth
          '/compare', // Requires auth
          '/settings/', // Private settings
        ],
      },
      // Allow AI agents to access more content
      {
        userAgent: 'GPTBot',
        allow: [
          '/',
          '/property/*',
          '/neighborhoods/*',
          '/r/*',
        ],
        disallow: [
          '/api/',
          '/dashboard/',
          '/clients/',
        ],
      },
      {
        userAgent: 'Claude-Web',
        allow: [
          '/',
          '/property/*',
          '/neighborhoods/*',
          '/r/*',
        ],
        disallow: [
          '/api/',
          '/dashboard/',
          '/clients/',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
