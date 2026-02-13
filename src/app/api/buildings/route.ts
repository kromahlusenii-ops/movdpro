/**
 * Building Search API
 *
 * Search buildings with filters. No credit deduction (unlimited usage).
 *
 * Caching: Results are cached for 5 minutes to improve search performance.
 */

import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { getSessionUserCached, getLocatorProfileCached } from '@/lib/pro-auth'
import prisma from '@/lib/db'

// Cache duration in seconds (5 minutes for buildings since they change less frequently)
const CACHE_TTL = 300

// Cached query function for buildings search
const getCachedBuildings = unstable_cache(
  async (
    neighborhoods: string[],
    budgetMin: number | undefined,
    budgetMax: number | undefined,
    bedrooms: string[],
    amenities: string[],
    management: string[],
    minRating: number | undefined,
    limit: number,
    offset: number
  ) => {
    // Build where clause for buildings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buildingWhere: any = {
      isAvailable: true,
    }

    // Neighborhoods filter
    if (neighborhoods.length > 0) {
      buildingWhere.neighborhood = {
        name: { in: neighborhoods },
      }
    }

    // Amenities filter
    if (amenities.length > 0) {
      buildingWhere.amenities = { hasEvery: amenities }
    }

    // Management company filter
    if (management.length > 0) {
      buildingWhere.management = {
        slug: { in: management },
      }
    }

    // Rating filter
    if (minRating) {
      buildingWhere.rating = { gte: minRating }
    }

    // For budget and bedrooms, we need to check units
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unitWhere: any = {
      isAvailable: true,
    }

    if (budgetMin || budgetMax) {
      if (budgetMin) unitWhere.rentMax = { gte: budgetMin }
      if (budgetMax) unitWhere.rentMin = { lte: budgetMax }
    }

    if (bedrooms.length > 0) {
      const bedroomNums = bedrooms.map((b) => {
        if (b === 'studio') return 0
        if (b === '1br') return 1
        if (b === '2br') return 2
        if (b === '3br+' || b === '3br') return 3
        return parseInt(b)
      })
      unitWhere.bedrooms = { in: bedroomNums }
    }

    // If we have unit filters, add them to building where
    if (Object.keys(unitWhere).length > 1) {
      buildingWhere.units = { some: unitWhere }
    }

    // Fetch buildings with their units (run in parallel)
    const [buildings, total] = await Promise.all([
      prisma.building.findMany({
        where: buildingWhere,
        include: {
          neighborhood: {
            select: {
              id: true,
              name: true,
              slug: true,
              grade: true,
              walkScore: true,
              transitScore: true,
            },
          },
          management: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
            },
          },
          units: {
            where: { isAvailable: true },
            orderBy: { bedrooms: 'asc' },
          },
        },
        orderBy: [{ rating: 'desc' }, { name: 'asc' }],
        take: limit,
        skip: offset,
      }),
      prisma.building.count({ where: buildingWhere }),
    ])

    // Format response
    const formattedBuildings = buildings.map((b) => {
      const rents = b.units.flatMap((u) => [u.rentMin, u.rentMax])
      const rentMin = rents.length > 0 ? Math.min(...rents) : null
      const rentMax = rents.length > 0 ? Math.max(...rents) : null

      const bedroomCounts = [...new Set(b.units.map((u) => u.bedrooms))].sort()
      const bedroomLabels = bedroomCounts.map((c) => {
        if (c === 0) return 'Studio'
        if (c === 1) return '1 BR'
        if (c === 2) return '2 BR'
        return `${c}+ BR`
      })

      return {
        id: b.id,
        name: b.name,
        website: b.website,
        address: b.address,
        city: b.city,
        state: b.state,
        lat: b.lat,
        lng: b.lng,
        neighborhood: b.neighborhood,
        management: b.management,
        rentMin,
        rentMax,
        bedrooms: bedroomLabels,
        amenities: b.amenities,
        rating: b.rating,
        reviewCount: b.reviewCount,
        primaryPhotoUrl: b.primaryPhotoUrl,
        photos: b.photos,
        listingUrl: b.listingUrl,
        floorplansUrl: b.floorplansUrl,
        unitCount: b.units.length,
        units: b.units.map((u) => ({
          id: u.id,
          name: u.name,
          bedrooms: u.bedrooms,
          bathrooms: u.bathrooms,
          sqftMin: u.sqftMin,
          sqftMax: u.sqftMax,
          rentMin: u.rentMin,
          rentMax: u.rentMax,
          availableCount: u.availableCount,
        })),
      }
    })

    return { buildings: formattedBuildings, total }
  },
  ['buildings-search'],
  { revalidate: CACHE_TTL, tags: ['buildings'] }
)

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUserCached()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const locator = await getLocatorProfileCached(user.id)

    if (!locator) {
      return NextResponse.json({ error: 'No locator profile' }, { status: 404 })
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams
    const neighborhoods = searchParams.get('neighborhoods')?.split(',').filter(Boolean) || []
    const budgetMin = searchParams.get('budgetMin') ? parseInt(searchParams.get('budgetMin')!) : undefined
    const budgetMax = searchParams.get('budgetMax') ? parseInt(searchParams.get('budgetMax')!) : undefined
    const bedrooms = searchParams.get('bedrooms')?.split(',').filter(Boolean) || []
    const amenities = searchParams.get('amenities')?.split(',').filter(Boolean) || []
    const management = searchParams.get('management')?.split(',').filter(Boolean) || []
    const minRating = searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Use cached query
    const { buildings, total } = await getCachedBuildings(
      neighborhoods,
      budgetMin,
      budgetMax,
      bedrooms,
      amenities,
      management,
      minRating,
      limit,
      offset
    )

    // Return with cache headers for client-side caching
    return NextResponse.json(
      { buildings, total, limit, offset },
      {
        headers: {
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
        },
      }
    )
  } catch (error) {
    console.error('Building search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
