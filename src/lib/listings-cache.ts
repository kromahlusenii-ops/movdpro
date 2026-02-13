/**
 * In-memory cache for listings data
 *
 * Since the dataset is small (628 units, 51 buildings), we can cache
 * the entire dataset in memory and filter client-side for much faster
 * response times.
 *
 * This reduces ~1-2s database queries to <10ms in-memory filtering.
 */

import prisma from './db'

// Types
interface CachedSpecial {
  id: string
  title: string
}

interface CachedListing {
  id: string
  unitNumber: string | null
  name: string | null
  bedrooms: number
  bathrooms: number
  sqftMin: number | null
  sqftMax: number | null
  rentMin: number
  rentMax: number
  isAvailable: boolean
  building: {
    id: string
    name: string
    address: string
    city: string
    state: string
    lat: number
    lng: number
    primaryPhotoUrl: string | null
    amenities: string[]
    rating: number | null
    reviewCount: number | null
    listingUrl: string | null
    floorplansUrl: string | null
    specials: CachedSpecial[]
  }
  neighborhood: {
    id: string
    name: string
    slug: string
    grade: string
    walkScore: number | null
    transitScore: number | null
  }
  management: {
    id: string
    name: string
    slug: string
    logoUrl: string | null
  } | null
  hasActiveDeals: boolean
}

interface ListingsCache {
  listings: CachedListing[]
  total: number
  loadedAt: number
}

// Cache configuration
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes
let cache: ListingsCache | null = null
let loadPromise: Promise<ListingsCache> | null = null

/**
 * Load all available listings into memory cache
 */
async function loadListingsCache(): Promise<ListingsCache> {
  console.log('[ListingsCache] Loading all listings into memory...')
  const start = performance.now()

  const listings = await prisma.unit.findMany({
    where: { isAvailable: true },
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
          isAvailable: true,
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
          specials: {
            where: {
              isActive: true,
              OR: [
                { endDate: null },
                { endDate: { gte: new Date() } },
              ],
            },
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
    orderBy: [{ rentMin: 'asc' }],
  })

  // Format listings
  const formattedListings: CachedListing[] = listings
    .filter(l => l.building.isAvailable) // Only include listings from available buildings
    .map((listing) => ({
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
        specials: listing.building.specials,
      },
      hasActiveDeals: listing.building.specials.length > 0,
      neighborhood: listing.building.neighborhood,
      management: listing.building.management,
    }))

  const elapsed = performance.now() - start
  console.log(`[ListingsCache] Loaded ${formattedListings.length} listings in ${elapsed.toFixed(0)}ms`)

  return {
    listings: formattedListings,
    total: formattedListings.length,
    loadedAt: Date.now(),
  }
}

/**
 * Get the listings cache, loading if necessary
 */
async function getCache(): Promise<ListingsCache> {
  const now = Date.now()

  // Check if cache is valid
  if (cache && (now - cache.loadedAt) < CACHE_TTL_MS) {
    return cache
  }

  // Prevent multiple simultaneous loads
  if (loadPromise) {
    return loadPromise
  }

  // Load fresh cache
  loadPromise = loadListingsCache()
    .then((newCache) => {
      cache = newCache
      loadPromise = null
      return newCache
    })
    .catch((error) => {
      loadPromise = null
      throw error
    })

  return loadPromise
}

/**
 * Invalidate the cache (call after data changes)
 */
export function invalidateListingsCache(): void {
  cache = null
  loadPromise = null
  console.log('[ListingsCache] Cache invalidated')
}

/**
 * Preload the cache (call on server startup or route warmup)
 */
export async function preloadListingsCache(): Promise<void> {
  await getCache()
}

// Filter options interface
interface FilterOptions {
  neighborhoods?: string[]
  budgetMin?: number
  budgetMax?: number
  bedrooms?: string[]
  buildings?: string[]
  hasDeals?: boolean
  limit?: number
  offset?: number
}

/**
 * Search listings with in-memory filtering
 * Returns filtered results in <10ms instead of ~1-2s
 */
export async function searchListingsCached(options: FilterOptions): Promise<{
  listings: CachedListing[]
  total: number
}> {
  const {
    neighborhoods = [],
    budgetMin,
    budgetMax,
    bedrooms = [],
    buildings = [],
    hasDeals,
    limit = 20,
    offset = 0,
  } = options

  const start = performance.now()
  const data = await getCache()

  // Apply filters in memory
  let filtered = data.listings

  // Neighborhood filter
  if (neighborhoods.length > 0) {
    filtered = filtered.filter(l => neighborhoods.includes(l.neighborhood.name))
  }

  // Budget filter - show listings that overlap with the user's budget range
  // A listing matches if: rentMin <= budgetMax AND rentMax >= budgetMin
  if (budgetMin || budgetMax) {
    filtered = filtered.filter(l => {
      const minOk = !budgetMax || l.rentMin <= budgetMax
      const maxOk = !budgetMin || l.rentMax >= budgetMin
      return minOk && maxOk
    })
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
    filtered = filtered.filter(l => bedroomNums.includes(l.bedrooms))
  }

  // Building filter
  if (buildings.length > 0) {
    filtered = filtered.filter(l => buildings.includes(l.building.id))
  }

  // Active deals filter
  if (hasDeals) {
    filtered = filtered.filter(l => l.hasActiveDeals)
  }

  const total = filtered.length

  // Pagination
  const paginated = filtered.slice(offset, offset + limit)

  const elapsed = performance.now() - start
  console.log(`[ListingsCache] Search completed in ${elapsed.toFixed(2)}ms (${total} results)`)

  return {
    listings: paginated,
    total,
  }
}

// Export cache status for debugging
export function getCacheStatus(): { loaded: boolean; age: number | null; size: number | null } {
  if (!cache) {
    return { loaded: false, age: null, size: null }
  }
  return {
    loaded: true,
    age: Date.now() - cache.loadedAt,
    size: cache.total,
  }
}
