// Shared types for the MOVD Pro application

// =============================================================================
// Building & Listing Types
// =============================================================================

export interface Building {
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

export interface Neighborhood {
  id: string
  name: string
  slug: string
  grade: string
  walkScore: number | null
  transitScore: number | null
}

export interface Management {
  id: string
  name: string
  slug: string
  logoUrl: string | null
}

export interface Listing {
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
  building: Building
  neighborhood: Neighborhood
  management: Management | null
}

// =============================================================================
// Client Types
// =============================================================================

export interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  status: string
  budgetMin: number | null
  budgetMax: number | null
  bedrooms: string[]
  neighborhoods: string[]
  vibes: string[]
  priorities: string[]
  moveInDate: Date | null
  hasDog: boolean
  hasCat: boolean
  hasKids: boolean
  worksFromHome: boolean
  needsParking: boolean
  notes: string | null
  source: string | null
  contactPreference: string | null
  savedListings?: { listingId: string }[]
  createdAt: Date
  updatedAt: Date
}

export interface ClientSummary {
  id: string
  name: string
  savedListings?: { listingId: string }[]
}

// =============================================================================
// Search & Filter Types
// =============================================================================

export interface SearchFilters {
  neighborhoods: string[]
  budgetMin: number
  budgetMax: number
  bedrooms: string[]
  buildings: string[]
  hasDeals: boolean
}

export interface SelectOption {
  value: string
  label: string
}

// =============================================================================
// API Response Types
// =============================================================================

export interface ListingsResponse {
  listings: Listing[]
  total: number
}

export interface ClientsResponse {
  clients: Client[]
}

export interface BuildingsResponse {
  buildings: Building[]
  total: number
}

// =============================================================================
// Locator Types
// =============================================================================

export interface LocatorProfile {
  id: string
  companyName: string | null
  companyLogo: string | null
  subscriptionStatus: string
  trialEndsAt: Date | null
  creditsRemaining: number
  intakeSlug: string | null
  intakeEnabled: boolean
}

// =============================================================================
// Constants
// =============================================================================

export const NEIGHBORHOOD_OPTIONS: SelectOption[] = [
  { value: 'South End', label: 'South End' },
  { value: 'NoDa', label: 'NoDa' },
  { value: 'Plaza Midwood', label: 'Plaza Midwood' },
  { value: 'Dilworth', label: 'Dilworth' },
  { value: 'Uptown Charlotte', label: 'Uptown' },
  { value: 'Elizabeth', label: 'Elizabeth' },
  { value: 'Myers Park', label: 'Myers Park' },
  { value: 'University City', label: 'University City' },
  { value: 'Ballantyne', label: 'Ballantyne' },
  { value: 'SouthPark', label: 'SouthPark' },
  { value: 'Steele Creek', label: 'Steele Creek' },
]

export const BEDROOM_OPTIONS: SelectOption[] = [
  { value: 'studio', label: 'Studio' },
  { value: '1br', label: '1 BR' },
  { value: '2br', label: '2 BR' },
  { value: '3br+', label: '3+ BR' },
]

export const GRADE_LABELS: Record<string, string> = {
  'A+': 'Excellent',
  'A': 'Excellent',
  'A-': 'Very Good',
  'B+': 'Good',
  'B': 'Good',
  'B-': 'Above Average',
  'C+': 'Average',
  'C': 'Average',
  'C-': 'Below Average',
  'D': 'Poor',
  'F': 'Very Poor',
}

// =============================================================================
// Utility Functions
// =============================================================================

export function formatBedrooms(bedrooms: number): string {
  if (bedrooms === 0) return 'Studio'
  if (bedrooms === 1) return '1 BR'
  if (bedrooms === 2) return '2 BR'
  return `${bedrooms} BR`
}

export function formatRent(min: number, max?: number): string {
  if (!max || min === max) return `$${min.toLocaleString()}`
  return `$${min.toLocaleString()} - $${max.toLocaleString()}`
}
