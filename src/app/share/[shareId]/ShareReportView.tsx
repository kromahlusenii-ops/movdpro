'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Building2, MapPin, Star, ExternalLink, Dog, Cat, Baby, Home, Car, Footprints, Shield, PawPrint, Check, MessageCircle, TrendingUp, ThumbsUp, ThumbsDown, Volume2 } from 'lucide-react'

type Preferences = {
  budgetMin: number | null
  budgetMax: number | null
  bedrooms: string[]
  neighborhoods: string[]
  vibes: string[]
  priorities: string[]
  hasDog: boolean
  hasCat: boolean
  hasKids: boolean
  worksFromHome: boolean
  needsParking: boolean
  commutePreference: string | null
}

type Special = {
  id: string
  title: string
  description: string
  discountType: string | null
  discountValue: number | null
  conditions: string | null
}

type SentimentQuote = {
  id: string
  content: string
  source: string
  sentiment: string
  theme: string | null
}

type NeighborhoodData = {
  id: string
  name: string
  slug: string
  grade: string
  walkScore: number | null
  transitScore: number | null
  safetyScore?: number | null
  nightlifeScore?: number | null
  sentimentScore?: number | null
  tagline?: string | null
  characterTags?: string[]
  highlights?: string[]
  warnings?: string[]
  lifestyleSummary?: string | null
  sentimentSummary?: string | null
  civicInsights?: string | null
  medianRent?: number | null
  bestArchetypes?: string[]
  quotes?: SentimentQuote[]
}

type ListingItem = {
  type: 'listing'
  id: string
  name: string | null
  bedrooms: number
  bathrooms: number
  sqftMin: number | null
  sqftMax: number | null
  rentMin: number
  rentMax: number
  notes: string | null
  building: {
    id: string
    name: string
    address: string
    city: string
    state: string
    primaryPhotoUrl: string | null
    photos: string[]
    amenities: string[]
    rating: number | null
    reviewCount: number | null
    listingUrl: string | null
    floorplansUrl: string | null
    specials?: Special[]
  }
  neighborhood: NeighborhoodData
  management: {
    id: string
    name: string
    slug: string
  } | null
}

type BuildingItem = {
  type: 'building'
  id: string
  name: string
  address: string
  city: string
  state: string
  primaryPhotoUrl: string | null
  photos: string[]
  amenities: string[]
  rating: number | null
  reviewCount: number | null
  listingUrl: string | null
  floorplansUrl: string | null
  notes: string | null
  specials?: Special[]
  neighborhood: NeighborhoodData
  management: {
    id: string
    name: string
    slug: string
  } | null
  units: Array<{
    id: string
    name: string | null
    bedrooms: number
    bathrooms: number
    sqftMin: number | null
    sqftMax: number | null
    rentMin: number
    rentMax: number
  }>
}

type ShareReportViewProps = {
  report: {
    id: string
    shareId: string
    clientName: string
    preferences: Preferences
    listings: Array<{
      type: 'listing' | 'building'
      id: string
      [key: string]: unknown
    }>
  }
}

function formatBedrooms(bedrooms: number): string {
  if (bedrooms === 0) return 'Studio'
  if (bedrooms === 1) return '1bd'
  return `${bedrooms}bd`
}

function formatBedroomsFull(bedrooms: number): string {
  if (bedrooms === 0) return 'Studio'
  if (bedrooms === 1) return '1 BR'
  return `${bedrooms} BR`
}

// Check if property matches a priority
function matchesPriority(amenities: string[], walkScore: number | null, priority: string): boolean {
  const p = priority.toLowerCase()
  const amenitiesLower = amenities.map(a => a.toLowerCase())

  if (p.includes('dog') && amenitiesLower.some(a => a.includes('dog') || a.includes('pet'))) return true
  if (p.includes('walkable') && walkScore && walkScore >= 70) return true
  if ((p.includes('laundry') || p.includes('w/d')) && amenitiesLower.some(a => a.includes('w/d') || a.includes('washer') || a.includes('laundry') || a.includes('in-unit'))) return true
  if (p.includes('pool') && amenitiesLower.some(a => a.includes('pool'))) return true
  if (p.includes('gym') && amenitiesLower.some(a => a.includes('gym') || a.includes('fitness'))) return true
  if (p.includes('parking') && amenitiesLower.some(a => a.includes('parking') || a.includes('garage'))) return true
  return false
}

function ListingCard({ item, priorities, isTopPick }: { item: ListingItem; priorities: string[]; isTopPick?: boolean }) {
  const matches = priorities.filter(p => matchesPriority(item.building.amenities, item.neighborhood.walkScore, p))
  const specials = item.building.specials || []
  const hasSpecials = specials.length > 0

  return (
    <div className="bg-white rounded-2xl border-2 border-blue-100 overflow-hidden shadow-sm">
      {/* Special/Promo Banner */}
      {hasSpecials && (
        <div className="bg-emerald-500 text-white px-5 py-2.5 flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Current Special:</span>
          <span className="text-sm font-medium">{specials[0].title.split('\n')[0].trim()}</span>
        </div>
      )}

      {/* Hero Image with Overlay */}
      <div className="relative h-56">
        {item.building.primaryPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.building.primaryPhotoUrl}
            alt={item.building.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900" />
        )}

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />

        {/* Top Pick Badge */}
        {isTopPick && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
            <Star className="w-3.5 h-3.5 fill-white" />
            TOP PICK
          </div>
        )}

        {/* Neighborhood and Name on image */}
        <div className="absolute bottom-4 left-5 right-5">
          <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">
            {item.neighborhood.name}
          </p>
          <h3 className="text-white text-xl font-bold">{item.building.name}</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Price and Specs Row */}
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <span className="text-3xl font-bold text-gray-900">{formatCurrency(item.rentMin)}</span>
            <span className="text-gray-500 text-lg">/mo</span>
          </div>
          <div className="text-gray-600 text-sm">
            {formatBedrooms(item.bedrooms)} / {item.bathrooms}ba
            {item.sqftMin && <span> · {item.sqftMin.toLocaleString()} sqft</span>}
          </div>
        </div>

        {/* Amenities */}
        {item.building.amenities.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-gray-100">
            {item.building.amenities.slice(0, 5).map((amenity) => (
              <span
                key={amenity}
                className="px-3 py-1.5 border border-gray-200 text-gray-700 text-xs rounded-full"
              >
                {amenity}
              </span>
            ))}
            {item.building.amenities.length > 5 && (
              <span className="px-3 py-1.5 border border-gray-200 text-gray-500 text-xs rounded-full">
                +{item.building.amenities.length - 5} more
              </span>
            )}
          </div>
        )}

        {/* Matches Section */}
        {matches.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-4 p-3 bg-blue-50 rounded-lg">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Matches:</span>
            {matches.map((match) => (
              <span key={match} className="flex items-center gap-1 text-sm text-blue-600">
                <Check className="w-4 h-4" />
                {match}
              </span>
            ))}
          </div>
        )}

        {/* Locator's Note */}
        {item.notes && (
          <div className="mb-4 pl-4 border-l-2 border-blue-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Locator&apos;s Note
            </p>
            <p className="text-gray-700">{item.notes}</p>
          </div>
        )}

        {/* Footer: Available Date and Walk Score */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-sm">
          <span className="text-gray-500">
            {item.building.listingUrl ? (
              <a
                href={item.building.listingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Listing
              </a>
            ) : (
              'Contact for availability'
            )}
          </span>
          {item.neighborhood.walkScore && (
            <span className="flex items-center gap-1 text-gray-500">
              <Footprints className="w-4 h-4" />
              Walk Score: <span className="font-semibold text-emerald-600">{item.neighborhood.walkScore}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function BuildingCard({ item, priorities, isTopPick }: { item: BuildingItem; priorities: string[]; isTopPick?: boolean }) {
  const priceRange =
    item.units.length > 0
      ? {
          min: Math.min(...item.units.map((u) => u.rentMin)),
          max: Math.max(...item.units.map((u) => u.rentMax)),
        }
      : null

  const matches = priorities.filter(p => matchesPriority(item.amenities, item.neighborhood.walkScore, p))
  const specials = item.specials || []
  const hasSpecials = specials.length > 0

  return (
    <div className="bg-white rounded-2xl border-2 border-blue-100 overflow-hidden shadow-sm">
      {/* Special/Promo Banner */}
      {hasSpecials && (
        <div className="bg-emerald-500 text-white px-5 py-2.5 flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Current Special:</span>
          <span className="text-sm font-medium">{specials[0].title.split('\n')[0].trim()}</span>
        </div>
      )}

      {/* Hero Image with Overlay */}
      <div className="relative h-56">
        {item.primaryPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.primaryPhotoUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900" />
        )}

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />

        {/* Top Pick Badge */}
        {isTopPick && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
            <Star className="w-3.5 h-3.5 fill-white" />
            TOP PICK
          </div>
        )}

        {/* Neighborhood and Name on image */}
        <div className="absolute bottom-4 left-5 right-5">
          <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">
            {item.neighborhood.name}
          </p>
          <h3 className="text-white text-xl font-bold">{item.name}</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Price and Units Row */}
        <div className="flex items-baseline justify-between mb-4">
          {priceRange ? (
            <div>
              <span className="text-3xl font-bold text-gray-900">{formatCurrency(priceRange.min)}</span>
              <span className="text-gray-500 text-lg"> - {formatCurrency(priceRange.max)}/mo</span>
            </div>
          ) : (
            <span className="text-gray-500">Contact for pricing</span>
          )}
          {item.units.length > 0 && (
            <span className="text-gray-600 text-sm">
              {item.units.length} unit{item.units.length !== 1 ? 's' : ''} available
            </span>
          )}
        </div>

        {/* Available unit types */}
        {item.units.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-gray-100">
            {item.units.slice(0, 4).map((unit) => (
              <span
                key={unit.id}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs rounded-full font-medium"
              >
                {formatBedroomsFull(unit.bedrooms)} from {formatCurrency(unit.rentMin)}
              </span>
            ))}
          </div>
        )}

        {/* Amenities */}
        {item.amenities.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-gray-100">
            {item.amenities.slice(0, 5).map((amenity) => (
              <span
                key={amenity}
                className="px-3 py-1.5 border border-gray-200 text-gray-700 text-xs rounded-full"
              >
                {amenity}
              </span>
            ))}
            {item.amenities.length > 5 && (
              <span className="px-3 py-1.5 border border-gray-200 text-gray-500 text-xs rounded-full">
                +{item.amenities.length - 5} more
              </span>
            )}
          </div>
        )}

        {/* Matches Section */}
        {matches.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-4 p-3 bg-blue-50 rounded-lg">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Matches:</span>
            {matches.map((match) => (
              <span key={match} className="flex items-center gap-1 text-sm text-blue-600">
                <Check className="w-4 h-4" />
                {match}
              </span>
            ))}
          </div>
        )}

        {/* Locator's Note */}
        {item.notes && (
          <div className="mb-4 pl-4 border-l-2 border-blue-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Locator&apos;s Note
            </p>
            <p className="text-gray-700">{item.notes}</p>
          </div>
        )}

        {/* Footer: View Link and Walk Score */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-sm">
          <span className="text-gray-500">
            {item.listingUrl ? (
              <a
                href={item.listingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Property
              </a>
            ) : (
              'Contact for details'
            )}
          </span>
          {item.neighborhood.walkScore && (
            <span className="flex items-center gap-1 text-gray-500">
              <Footprints className="w-4 h-4" />
              Walk Score: <span className="font-semibold text-emerald-600">{item.neighborhood.walkScore}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

type TabType = 'properties' | 'neighborhoods' | 'costs'

// Helper to generate walkability description from score
function getWalkabilityDescription(walkScore: number | null | undefined): string | null {
  if (!walkScore) return null
  if (walkScore >= 90) return "Walker's Paradise — daily errands do not require a car."
  if (walkScore >= 70) return 'Very Walkable — most errands can be accomplished on foot.'
  if (walkScore >= 50) return 'Somewhat Walkable — some errands can be accomplished on foot.'
  return 'Car-Dependent — most errands require a car.'
}

// Helper to generate safety description from score
function getSafetyDescription(safetyScore: number | null | undefined): string | null {
  if (!safetyScore) return null
  if (safetyScore >= 80) return 'Very safe neighborhood with low crime rates.'
  if (safetyScore >= 60) return 'Generally safe with typical urban awareness needed.'
  if (safetyScore >= 40) return 'Mixed safety — stick to well-trafficked streets at night.'
  return 'Exercise caution, especially after dark.'
}

export default function ShareReportView({ report }: ShareReportViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('properties')
  const prefs = report.preferences

  // Format budget string
  const budgetStr =
    prefs.budgetMin && prefs.budgetMax
      ? `${formatCurrency(prefs.budgetMin)} - ${formatCurrency(prefs.budgetMax)}`
      : prefs.budgetMax
        ? `Up to ${formatCurrency(prefs.budgetMax)}`
        : null

  // Extract unique neighborhoods from listings with full data
  const neighborhoodsMap = new Map<string, NeighborhoodData & { propertyCount: number }>()

  report.listings.forEach((item) => {
    const listing = item as ListingItem | BuildingItem
    const hood = listing.neighborhood
    if (hood && !neighborhoodsMap.has(hood.id)) {
      neighborhoodsMap.set(hood.id, {
        ...hood,
        propertyCount: 1,
      })
    } else if (hood) {
      const existing = neighborhoodsMap.get(hood.id)!
      existing.propertyCount++
    }
  })

  const neighborhoods = Array.from(neighborhoodsMap.values())

  // Calculate move-in costs data with specials
  const costData = report.listings.map((item) => {
    if (item.type === 'listing') {
      const listing = item as ListingItem
      return {
        id: listing.id,
        name: listing.building.name,
        neighborhood: listing.neighborhood.name,
        rent: listing.rentMin,
        bedrooms: listing.bedrooms,
        specials: listing.building.specials || [],
      }
    } else {
      const building = item as BuildingItem
      const minRent = building.units.length > 0
        ? Math.min(...building.units.map((u) => u.rentMin))
        : 0
      return {
        id: building.id,
        name: building.name,
        neighborhood: building.neighborhood.name,
        rent: minRent,
        bedrooms: building.units[0]?.bedrooms ?? 0,
        specials: building.specials || [],
      }
    }
  })

  const tabs: { id: TabType; label: string }[] = [
    { id: 'properties', label: `Properties (${report.listings.length})` },
    { id: 'neighborhoods', label: `Neighborhoods (${neighborhoods.length})` },
    { id: 'costs', label: 'Move-In Costs' },
  ]

  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      {/* Header */}
      <div className="bg-white border-b border-[#e2e5ea]">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            {report.clientName}&apos;s Recommendations
          </h1>

          {/* Preferences Row */}
          <div className="flex flex-wrap items-start gap-8 text-sm">
            {/* Budget */}
            {budgetStr && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Budget</p>
                <p className="text-gray-900 font-medium">{budgetStr}/mo</p>
              </div>
            )}

            {/* Bedrooms */}
            {prefs.bedrooms.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Bedrooms</p>
                <p className="text-gray-900 font-medium">{prefs.bedrooms.join(', ')}</p>
              </div>
            )}

            {/* Priorities */}
            {(prefs.priorities.length > 0 || prefs.hasDog || prefs.hasCat) && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Priorities</p>
                <div className="flex flex-wrap gap-2">
                  {prefs.hasDog && (
                    <span className="px-3 py-1 rounded-full border border-gray-300 text-gray-700 text-xs font-medium">
                      Dog-friendly
                    </span>
                  )}
                  {prefs.hasCat && (
                    <span className="px-3 py-1 rounded-full border border-gray-300 text-gray-700 text-xs font-medium">
                      Cat-friendly
                    </span>
                  )}
                  {prefs.priorities.map((priority) => (
                    <span
                      key={priority}
                      className="px-3 py-1 rounded-full border border-gray-300 text-gray-700 text-xs font-medium"
                    >
                      {priority}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#e2e5ea]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Properties Tab */}
        {activeTab === 'properties' && (
          <div className="space-y-6">
            <p className="text-sm text-gray-500 mb-4">
              {report.listings.length} propert{report.listings.length !== 1 ? 'ies' : 'y'} matched · sorted by recommendation
            </p>

            {report.listings.map((item, index) =>
              item.type === 'listing' ? (
                <ListingCard
                  key={item.id}
                  item={item as ListingItem}
                  priorities={prefs.priorities}
                  isTopPick={index === 0}
                />
              ) : (
                <BuildingCard
                  key={item.id}
                  item={item as BuildingItem}
                  priorities={prefs.priorities}
                  isTopPick={index === 0}
                />
              )
            )}

            {report.listings.length === 0 && (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No recommendations yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Neighborhoods Tab */}
        {activeTab === 'neighborhoods' && (
          <div className="space-y-6">
            <div className="mb-2">
              <h2 className="text-sm font-semibold text-blue-600 uppercase tracking-wider">
                Neighborhood Insights
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                What it&apos;s actually like to live there — beyond the listing.
              </p>
            </div>

            {neighborhoods.length > 0 ? (
              neighborhoods.map((hood) => {
                const walkabilityDesc = getWalkabilityDescription(hood.walkScore)
                const safetyDesc = getSafetyDescription(hood.safetyScore)
                const vibe = hood.tagline || (hood.characterTags?.length ? hood.characterTags.join(', ') : null)

                return (
                  <div
                    key={hood.id}
                    className="bg-white rounded-2xl border border-[#e2e5ea] overflow-hidden"
                  >
                    {/* Header */}
                    <div className="p-6 border-b border-[#e2e5ea]">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{hood.name}</h3>
                        <span className="px-2.5 py-1 rounded-full bg-gray-100 text-sm font-medium text-gray-700">
                          {hood.grade}
                        </span>
                      </div>
                      {vibe && (
                        <p className="text-gray-600">{vibe}</p>
                      )}
                      {hood.medianRent && (
                        <p className="text-sm text-gray-500 mt-1">
                          ~${hood.medianRent.toLocaleString()}/mo median rent
                        </p>
                      )}
                    </div>

                    <div className="p-6">
                      {/* Scores Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                        {hood.walkScore && (
                          <div className="p-3 rounded-xl bg-blue-50 text-center">
                            <Footprints className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                            <p className="text-2xl font-bold text-gray-900">{hood.walkScore}</p>
                            <p className="text-xs text-gray-500">Walk Score</p>
                          </div>
                        )}
                        {hood.transitScore && (
                          <div className="p-3 rounded-xl bg-purple-50 text-center">
                            <Car className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                            <p className="text-2xl font-bold text-gray-900">{hood.transitScore}</p>
                            <p className="text-xs text-gray-500">Transit</p>
                          </div>
                        )}
                        {hood.safetyScore && (
                          <div className="p-3 rounded-xl bg-green-50 text-center">
                            <Shield className="w-5 h-5 text-green-600 mx-auto mb-1" />
                            <p className="text-2xl font-bold text-gray-900">{hood.safetyScore}/10</p>
                            <p className="text-xs text-gray-500">Safety</p>
                          </div>
                        )}
                        {hood.nightlifeScore && hood.nightlifeScore > 0 && (
                          <div className="p-3 rounded-xl bg-amber-50 text-center">
                            <Volume2 className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                            <p className="text-2xl font-bold text-gray-900">{hood.nightlifeScore}/10</p>
                            <p className="text-xs text-gray-500">Nightlife</p>
                          </div>
                        )}
                      </div>

                      {/* Character Tags */}
                      {hood.characterTags && hood.characterTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-6">
                          {hood.characterTags.slice(0, 6).map((tag) => (
                            <span
                              key={tag}
                              className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Highlights & Warnings */}
                      {((hood.highlights && hood.highlights.length > 0) || (hood.warnings && hood.warnings.length > 0)) && (
                        <div className="grid sm:grid-cols-2 gap-6 mb-6">
                          {hood.highlights && hood.highlights.length > 0 && (
                            <div>
                              <div className="flex items-center gap-1.5 mb-3">
                                <ThumbsUp className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-semibold text-gray-900">Highlights</span>
                              </div>
                              <ul className="space-y-2">
                                {hood.highlights.slice(0, 3).map((h, i) => (
                                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                    <span className="text-green-500 mt-0.5">•</span>
                                    {h}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {hood.warnings && hood.warnings.length > 0 && (
                            <div>
                              <div className="flex items-center gap-1.5 mb-3">
                                <ThumbsDown className="w-4 h-4 text-amber-600" />
                                <span className="text-sm font-semibold text-gray-900">Heads Up</span>
                              </div>
                              <ul className="space-y-2">
                                {hood.warnings.slice(0, 3).map((w, i) => (
                                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                    <span className="text-amber-500 mt-0.5">•</span>
                                    {w}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* WFH Lifestyle - show if user works from home */}
                      {prefs.worksFromHome && hood.lifestyleSummary && (
                        <div className="p-4 rounded-xl bg-purple-50 border border-purple-100 mb-6">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Home className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-semibold text-purple-900">WFH Lifestyle</span>
                          </div>
                          <p className="text-sm text-purple-800">{hood.lifestyleSummary}</p>
                        </div>
                      )}

                      {/* Dog Friendly - show if user has a dog */}
                      {prefs.hasDog && (
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 mb-6">
                          <div className="flex items-center gap-1.5 mb-2">
                            <PawPrint className="w-4 h-4 text-amber-600" />
                            <span className="text-sm font-semibold text-amber-900">Dog-Friendly</span>
                          </div>
                          <p className="text-sm text-amber-800">
                            {hood.walkScore && hood.walkScore >= 70
                              ? 'Good for dogs — walkable area with nearby parks and pet-friendly spots.'
                              : 'Check for nearby dog parks and pet-friendly establishments.'}
                          </p>
                        </div>
                      )}

                      {/* Sentiment Quotes */}
                      {hood.quotes && hood.quotes.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-1.5">
                              <MessageCircle className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-semibold text-gray-900">What Residents Say</span>
                            </div>
                            {hood.sentimentScore && hood.sentimentScore > 0 && (
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                <TrendingUp className="w-3 h-3" />
                                {hood.sentimentScore}% positive
                              </span>
                            )}
                          </div>
                          <div className="space-y-3">
                            {hood.quotes.map((quote) => (
                              <div
                                key={quote.id}
                                className={`p-4 rounded-xl border ${
                                  quote.sentiment === 'positive'
                                    ? 'bg-green-50 border-green-200'
                                    : quote.sentiment === 'negative'
                                    ? 'bg-red-50 border-red-200'
                                    : 'bg-gray-50 border-gray-200'
                                }`}
                              >
                                <p className="text-sm italic text-gray-700">&ldquo;{quote.content}&rdquo;</p>
                                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                  <span className="capitalize">{quote.source}</span>
                                  {quote.theme && (
                                    <>
                                      <span>•</span>
                                      <span className="capitalize">{quote.theme}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Property count */}
                      <p className="text-sm text-gray-400 mt-6 pt-4 border-t border-gray-100">
                        {hood.propertyCount} propert{hood.propertyCount !== 1 ? 'ies' : 'y'} recommended in this area
                      </p>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-12">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No neighborhood data available.</p>
              </div>
            )}
          </div>
        )}

        {/* Move-In Costs Tab */}
        {activeTab === 'costs' && (
          <div className="space-y-6">
            <div className="mb-2">
              <h2 className="text-sm font-semibold text-blue-600 uppercase tracking-wider">
                Move-In Cost Breakdown
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                What you&apos;ll need upfront — no surprises.
              </p>
            </div>

            {costData.length > 0 ? (
              <div className="bg-white rounded-2xl border border-[#e2e5ea] overflow-hidden">
                {/* Table Header */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#e2e5ea]">
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider p-4 bg-gray-50">
                          Cost
                        </th>
                        {costData.map((property) => (
                          <th
                            key={property.id}
                            className="text-center text-sm font-semibold text-gray-900 p-4 bg-gray-50 min-w-[140px]"
                          >
                            {property.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Monthly Rent */}
                      <tr className="border-b border-[#e2e5ea]">
                        <td className="text-sm text-gray-600 p-4">Monthly Rent</td>
                        {costData.map((property) => (
                          <td key={property.id} className="text-center text-sm font-medium text-gray-900 p-4">
                            {formatCurrency(property.rent)}
                          </td>
                        ))}
                      </tr>

                      {/* Estimated Deposit (typically 1 month rent) */}
                      <tr className="border-b border-[#e2e5ea]">
                        <td className="text-sm text-gray-600 p-4">Security Deposit*</td>
                        {costData.map((property) => (
                          <td key={property.id} className="text-center text-sm text-gray-600 p-4">
                            {formatCurrency(property.rent)}
                          </td>
                        ))}
                      </tr>

                      {/* Total Move-In */}
                      <tr className="bg-gray-50 border-b border-[#e2e5ea]">
                        <td className="text-sm font-semibold text-gray-900 p-4">
                          Total Move-In
                        </td>
                        {costData.map((property) => (
                          <td key={property.id} className="text-center text-lg font-bold text-gray-900 p-4">
                            {formatCurrency(property.rent * 2)}
                          </td>
                        ))}
                      </tr>

                      {/* Current Promo */}
                      <tr>
                        <td className="text-sm text-blue-600 p-4 align-top">
                          <span className="underline">Current Promo</span>
                        </td>
                        {costData.map((property) => (
                          <td key={property.id} className="text-center text-sm p-4 align-top">
                            {property.specials.length > 0 ? (
                              <div className="space-y-2">
                                {property.specials.map((special) => (
                                  <p key={special.id} className="text-emerald-600 font-medium">
                                    {special.title}
                                    {special.conditions && (
                                      <span className="block text-xs text-gray-500 font-normal">
                                        {special.conditions}
                                      </span>
                                    )}
                                  </p>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Footnote */}
                <div className="p-4 bg-gray-50 border-t border-[#e2e5ea]">
                  <p className="text-xs text-gray-500">
                    * Security deposit is estimated as one month&apos;s rent. Actual amounts may vary.
                    Contact property for exact fees including admin fees, pet deposits, and other charges.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#e2e5ea] p-12 text-center">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No cost data available.</p>
              </div>
            )}

            {/* Summary Card */}
            {costData.length > 0 && (
              <div className="bg-blue-50 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Average Monthly Rent</p>
                    <p className="text-xs text-blue-600">Across all {costData.length} recommendations</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatCurrency(
                      Math.round(
                        costData.reduce((sum, p) => sum + p.rent, 0) / costData.length
                      )
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e2e5ea] bg-white mt-12">
        <div className="max-w-4xl mx-auto px-6 py-6 text-center">
          <p className="text-sm text-gray-400">
            Powered by{' '}
            <a
              href="https://movdpro.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              MOVD Pro
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
