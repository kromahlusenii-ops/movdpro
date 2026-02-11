/**
 * RSS Feed for Property Listings
 *
 * Provides an RSS feed of new and updated property listings
 * for AI agents, aggregators, and feed readers.
 */

import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://movdpro.com'

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function formatRfc822Date(date: Date): string {
  return date.toUTCString()
}

export async function GET() {
  try {
    // Fetch recent available units with building data
    const units = await prisma.unit.findMany({
      where: { isAvailable: true },
      include: {
        building: {
          include: {
            neighborhood: true,
            management: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    })

    const items = units.map((unit) => {
      const title = unit.name
        ? `${unit.name} at ${unit.building.name}`
        : `${unit.bedrooms === 0 ? 'Studio' : `${unit.bedrooms}BR`} at ${unit.building.name}`

      const description = [
        `${unit.bedrooms === 0 ? 'Studio' : `${unit.bedrooms} bedroom`}`,
        `${unit.bathrooms} bathroom apartment`,
        unit.sqftMin ? `${unit.sqftMin.toLocaleString()} sqft` : null,
        `$${unit.rentMin.toLocaleString()}${unit.rentMin !== unit.rentMax ? ` - $${unit.rentMax.toLocaleString()}` : ''}/month`,
        `in ${unit.building.neighborhood.name}, Charlotte NC`,
        unit.building.amenities.length > 0
          ? `Amenities: ${unit.building.amenities.slice(0, 5).join(', ')}`
          : null,
      ]
        .filter(Boolean)
        .join('. ')

      return `
    <item>
      <title>${escapeXml(title)}</title>
      <link>${BASE_URL}/property/${unit.building.id}</link>
      <guid isPermaLink="true">${BASE_URL}/listing/${unit.id}</guid>
      <description>${escapeXml(description)}</description>
      <pubDate>${formatRfc822Date(unit.updatedAt)}</pubDate>
      <category>${escapeXml(unit.building.neighborhood.name)}</category>
      ${unit.building.management ? `<category>${escapeXml(unit.building.management.name)}</category>` : ''}
      <enclosure url="${unit.building.primaryPhotoUrl || `${BASE_URL}/images/placeholder.png`}" type="image/jpeg" />
      <movd:bedrooms>${unit.bedrooms}</movd:bedrooms>
      <movd:bathrooms>${unit.bathrooms}</movd:bathrooms>
      <movd:rentMin>${unit.rentMin}</movd:rentMin>
      <movd:rentMax>${unit.rentMax}</movd:rentMax>
      ${unit.sqftMin ? `<movd:sqft>${unit.sqftMin}</movd:sqft>` : ''}
      <movd:neighborhood>${escapeXml(unit.building.neighborhood.name)}</movd:neighborhood>
      <movd:grade>${unit.building.neighborhood.grade}</movd:grade>
      <movd:address>${escapeXml(unit.building.address)}</movd:address>
      <movd:available>${unit.isAvailable}</movd:available>
    </item>`
    })

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:movd="https://movdpro.com/ns/rss">
  <channel>
    <title>MOVD Pro - Charlotte Apartment Listings</title>
    <link>${BASE_URL}</link>
    <description>New and updated apartment listings in Charlotte, NC from MOVD Pro - the professional apartment locator tool.</description>
    <language>en-us</language>
    <lastBuildDate>${formatRfc822Date(new Date())}</lastBuildDate>
    <ttl>60</ttl>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${BASE_URL}/images/logo.png</url>
      <title>MOVD Pro</title>
      <link>${BASE_URL}</link>
    </image>
    ${items.join('\n')}
  </channel>
</rss>`

    return new NextResponse(rss, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('RSS feed generation error:', error)
    return new NextResponse('Error generating feed', { status: 500 })
  }
}
