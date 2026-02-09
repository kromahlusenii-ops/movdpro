/**
 * Listings Search API
 *
 * Search individual listings (units) with building and neighborhood context.
 * Returns listings that can be saved/sent to clients.
 *
 * Caching: Results are cached for 60 seconds to improve search performance.
 */

import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { getSessionUserCached, getLocatorProfileCached } from '@/lib/pro-auth'
import prisma from '@/lib/db'

// Cache duration in seconds
const CACHE_TTL = 60

// Cached query function for listings search
const getCachedListings = unstable_cache(
  async (
    neighborhoods: string[],
    budgetMin: number | undefined,
    budgetMax: number | undefined,
    bedrooms: string[],
    buildings: string[],
    limit: number,
    offset: number,
    includeCount: boolean
  ) => {
    // Build where clause for units (listings)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unitWhere: any = {
      isAvailable: true,
    }

    // Budget filter
    if (budgetMin) {
      unitWhere.rentMin = { gte: budgetMin }
    }
    if (budgetMax) {
      unitWhere.rentMax = { lte: budgetMax }
    }

    // Bedrooms filter
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

    // Building filters (neighborhood)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buildingWhere: any = {
      isAvailable: true,
    }

    if (neighborhoods.length > 0) {
      buildingWhere.neighborhood = {
        name: { in: neighborhoods },
      }
    }

    if (buildings.length > 0) {
      buildingWhere.id = { in: buildings }
    }

    // Apply building filters to unit query
    if (Object.keys(buildingWhere).length > 1) {
      unitWhere.building = buildingWhere
    }

    // Fetch listings — only count when needed (first page / filter change)
    const listingsPromise = prisma.unit.findMany({
      where: unitWhere,
      select: {
        id: true,
        unitNumber: true,
        name: true,
        bedrooms: true,
        bathrooms: true,
        sqftMin: true,
        sqftMax: true,
        rentMin: true,
        rentMax: true,
        isAvailable: true,
        building: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
            lat: true,
            lng: true,
            primaryPhotoUrl: true,
            amenities: true,
            rating: true,
            reviewCount: true,
            listingUrl: true,
            floorplansUrl: true,
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
          },
        },
      },
      orderBy: [{ rentMin: 'asc' }],
      take: limit,
      skip: offset,
    })

    const [listings, total] = await Promise.all([
      listingsPromise,
      includeCount ? prisma.unit.count({ where: unitWhere }) : Promise.resolve(-1),
    ])

    // Format response - each listing with full context
    const formattedListings = listings.map((listing) => ({
      id: listing.id,
      unitNumber: listing.unitNumber,
      name: listing.name,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      sqftMin: listing.sqftMin,
      sqftMax: listing.sqftMax,
      rentMin: listing.rentMin,
      rentMax: listing.rentMax,
      isAvailable: listing.isAvailable,
      building: {
        id: listing.building.id,
        name: listing.building.name,
        address: listing.building.address,
        city: listing.building.city,
        state: listing.building.state,
        lat: listing.building.lat,
        lng: listing.building.lng,
        primaryPhotoUrl: listing.building.primaryPhotoUrl,
        amenities: listing.building.amenities,
        rating: listing.building.rating,
        reviewCount: listing.building.reviewCount,
        listingUrl: listing.building.listingUrl,
        floorplansUrl: listing.building.floorplansUrl,
      },
      neighborhood: listing.building.neighborhood,
      management: listing.building.management,
    }))

    return { listings: formattedListings, total }
  },
  ['listings-search'],
  { revalidate: CACHE_TTL, tags: ['listings'] }
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
    const buildings = searchParams.get('buildings')?.split(',').filter(Boolean) || []
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')
    const skipCount = searchParams.get('skipCount') === 'true'

    // Use cached query — skip count on pagination (offset > 0) unless explicitly requested
    const { listings, total } = await getCachedListings(
      neighborhoods,
      budgetMin,
      budgetMax,
      bedrooms,
      buildings,
      limit,
      offset,
      !skipCount
    )

    // Return with cache headers for client-side caching
    return NextResponse.json(
      { listings, total, limit, offset },
      {
        headers: {
          'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
        },
      }
    )
  } catch (error) {
    console.error('Listings search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
