/**
 * Dynamic Sitemap Generator
 *
 * Generates a sitemap.xml for search engines and AI agents.
 * Includes all public pages, properties, and neighborhoods.
 */

import { MetadataRoute } from 'next'
import { prisma } from '@/lib/db'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://movdpro.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // Fetch all public buildings
  const buildings = await prisma.building.findMany({
    where: { isAvailable: true },
    select: {
      id: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: 'desc' },
  })

  const propertyPages: MetadataRoute.Sitemap = buildings.map((building) => ({
    url: `${BASE_URL}/property/${building.id}`,
    lastModified: building.updatedAt,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  // Fetch neighborhoods
  const neighborhoods = await prisma.neighborhood.findMany({
    select: {
      slug: true,
      updatedAt: true,
    },
  })

  const neighborhoodPages: MetadataRoute.Sitemap = neighborhoods.map((hood) => ({
    url: `${BASE_URL}/neighborhoods/${hood.slug}`,
    lastModified: hood.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Fetch public reports (shared client reports)
  const publicReports = await prisma.clientShareReport.findMany({
    where: { isActive: true },
    select: {
      shareId: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: 'desc' },
    take: 100, // Limit to recent reports
  })

  const reportPages: MetadataRoute.Sitemap = publicReports.map((report) => ({
    url: `${BASE_URL}/r/${report.shareId}`,
    lastModified: report.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }))

  return [
    ...staticPages,
    ...propertyPages,
    ...neighborhoodPages,
    ...reportPages,
  ]
}
