/**
 * Listings Search API
 *
 * Search individual listings (units) with building and neighborhood context.
 * Returns listings that can be saved/sent to clients.
 *
 * Performance: Uses in-memory caching for <10ms response times instead of
 * ~1-2s database queries. Cache is refreshed every 5 minutes.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserCached, getLocatorProfileCached } from '@/lib/pro-auth'
import { searchListingsCached } from '@/lib/listings-cache'

export async function GET(request: NextRequest) {
  const requestStart = performance.now()

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

    // Use in-memory cached search for fast filtering
    const { listings, total } = await searchListingsCached({
      neighborhoods,
      budgetMin,
      budgetMax,
      bedrooms,
      buildings,
      limit,
      offset,
    })

    const elapsed = performance.now() - requestStart

    // Return with cache headers for client-side caching
    return NextResponse.json(
      { listings, total, limit, offset },
      {
        headers: {
          'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
          'X-Response-Time': `${elapsed.toFixed(0)}ms`,
        },
      }
    )
  } catch (error) {
    console.error('Listings search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
