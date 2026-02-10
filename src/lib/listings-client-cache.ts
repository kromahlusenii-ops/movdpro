/**
 * Client-side listings cache
 *
 * Shared module that caches listings data in memory on the client.
 * Used by both the preloader (runs on dashboard mount) and
 * the search page (uses cached data instantly).
 */

export interface CachedListing {
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
  hasActiveDeals: boolean
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
    specials?: { id: string; title: string }[]
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
}

interface ListingsClientCache {
  listings: CachedListing[]
  total: number
  timestamp: number
}

// Module-level cache
let cache: ListingsClientCache | null = null
let loadingPromise: Promise<ListingsClientCache | null> | null = null
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Check if cache is valid
 */
export function isCacheValid(): boolean {
  return cache !== null && (Date.now() - cache.timestamp) < CACHE_TTL
}

/**
 * Get cached listings if available
 */
export function getCachedListings(): ListingsClientCache | null {
  if (isCacheValid()) {
    return cache
  }
  return null
}

/**
 * Set the cache directly
 */
export function setCachedListings(listings: CachedListing[], total: number): void {
  cache = {
    listings,
    total,
    timestamp: Date.now(),
  }
}

/**
 * Preload listings into cache
 * Returns immediately if cache is valid or already loading
 */
export async function preloadListings(): Promise<void> {
  // Already have valid cache
  if (isCacheValid()) {
    return
  }

  // Already loading
  if (loadingPromise) {
    await loadingPromise
    return
  }

  // Start loading
  loadingPromise = (async () => {
    try {
      // Fetch first batch
      const res = await fetch('/api/listings?limit=20&offset=0')
      if (!res.ok) return null

      const data = await res.json()

      cache = {
        listings: data.listings,
        total: data.total,
        timestamp: Date.now(),
      }

      return cache
    } catch (error) {
      console.error('[ListingsPreload] Failed to preload:', error)
      return null
    } finally {
      loadingPromise = null
    }
  })()

  await loadingPromise
}

/**
 * Invalidate the cache
 */
export function invalidateClientCache(): void {
  cache = null
  loadingPromise = null
}
