import type { PriorityId, VibeId, AgeBracketId, BedroomId, BathroomId, LeaseLengthId, MoveStatusId, TransportationId } from '@/lib/constants'

export interface QuizAnswers {
  budgetMin: number
  budgetMax: number
  priorities: PriorityId[]
  vibes: VibeId[]  // Changed from single vibe to array
  workAddress?: string
  maxCommute?: number
  // Demographic fields
  ageBracket?: AgeBracketId
  bedrooms?: BedroomId
  bathrooms?: BathroomId
  leaseLength?: LeaseLengthId
  hasKids?: boolean
  hasDog?: boolean
  // New fields
  moveStatus?: MoveStatusId
  transportation?: TransportationId
  // Optional free-form context for better AI personalization
  additionalNotes?: string
  // Traffic source tracking (auto-captured from UTM parameters)
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmTerm?: string
  utmContent?: string
  referrer?: string
}

export interface NeighborhoodResult {
  id: string
  name: string
  slug: string
  matchScore: number
  rank: number
  grade: string
  infrastructureScore: number
  safetyScore: number
  livabilityScore: number
  trajectoryScore: number
  sentimentScore: number
  compositeScore: number
  walkScore: number | null
  transitScore: number | null
  bikeScore: number | null
  medianRent: number | null
  rentMin: number | null
  rentMax: number | null
  description: string | null
  warnings: string[]
  highlights: string[]
  centerLat: number
  centerLng: number
}

export interface QuizSession {
  id: string
  budgetMin: number
  budgetMax: number
  priorities: string[]
  vibe: string
  workAddress: string | null
  maxCommute: number | null
  paid: boolean
  email: string | null
  createdAt: Date
  expiresAt: Date | null
  results: NeighborhoodResult[]
}

export interface SentimentQuoteData {
  id: string
  source: 'reddit' | 'tiktok'
  content: string
  sentiment: 'positive' | 'negative' | 'neutral'
  theme: string | null
  postUrl: string | null
  postId: string | null
  author: string | null
  subreddit: string | null
  upvotes: number | null
  postDate: Date | null
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface QuizSubmitResponse {
  sessionId: string
  results: NeighborhoodResult[]
}

export interface CheckoutResponse {
  url: string
}

export type VenueCategory = 'restaurant' | 'bar' | 'cafe' | 'park' | 'gym' | 'grocery' | 'nightlife'

export interface LifestyleVenueData {
  id: string
  name: string
  category: VenueCategory
  subcategory: string | null
  address: string | null
  rating: number | null
  priceLevel: number | null
  description: string | null
  lat: number | null
  lng: number | null
  isHighlight: boolean
  tags: string[]
  photoUrl: string | null
  googlePlaceId: string | null
}

// Apartment listing types
export interface ApartmentListingData {
  id: string
  name: string
  address: string
  description: string | null
  rentMin: number
  rentMax: number
  bedrooms: string[]
  bathrooms: number | null
  sqftMin: number | null
  sqftMax: number | null
  amenities: string[]
  petPolicy: string | null
  parkingType: string | null
  rating: number | null
  reviewCount: number | null
  walkScore: number | null
  transitScore: number | null
  lat: number
  lng: number
  photoUrl: string | null
  photos: string[]
  listingUrl: string | null
  isAvailable: boolean
  tags: string[]
  // Match scoring (when personalized)
  matchScore?: number
  matchReasons?: string[]
}
