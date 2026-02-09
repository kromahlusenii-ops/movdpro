/**
 * Scraper Types - Shared interfaces for building scrapers
 */

export type DiscountType = 'months_free' | 'reduced_rent' | 'waived_fees' | 'gift_card' | 'other'

export interface ScrapedSpecial {
  title: string
  description: string
  discountType: DiscountType | null
  discountValue: number | null // Dollar amount or number of months
  conditions: string | null
  startDate: Date | null
  endDate: Date | null
  rawHtml: string | null
  // If targeting specific floor plans, include identifiers
  targetFloorPlanNames: string[] | null // e.g., ["1BR", "2BR"] or floor plan names
}

export interface ScrapedFloorPlan {
  name: string | null
  bedrooms: number // 0 for studio
  bathrooms: number
  sqftMin: number | null
  sqftMax: number | null
  rentMin: number
  rentMax: number
  availableCount: number
  photoUrl: string | null
}

export interface ScrapedBuilding {
  name: string
  address: string
  city: string
  state: string
  zipCode: string | null
  lat: number
  lng: number
  website: string | null
  phone: string | null
  primaryPhotoUrl: string | null
  photos: string[]
  amenities: string[]
  petPolicy: string | null
  parkingType: string | null
  listingUrl: string
  floorplansUrl: string | null
  yearBuilt: number | null
  totalUnits: number | null
  floorPlans: ScrapedFloorPlan[]
  specials: ScrapedSpecial[]
}

export interface ScrapeResult {
  buildings: ScrapedBuilding[]
  errors: string[]
  scrapedAt: Date
}

export interface Scraper {
  name: string
  slug: string
  scrape: () => Promise<ScrapeResult>
}
