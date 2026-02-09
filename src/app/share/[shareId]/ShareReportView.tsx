'use client'

import { formatCurrency } from '@/lib/utils'
import { Building2, MapPin, Star, ExternalLink, Dog, Cat, Baby, Home, Car } from 'lucide-react'

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
  if (bedrooms === 1) return '1 BR'
  return `${bedrooms} BR`
}

function ListingCard({ item }: { item: ListingItem }) {
  return (
    <div className="bg-white rounded-2xl border border-[#e2e5ea] overflow-hidden">
      {/* Image */}
      <div className="relative h-48">
        {item.building.primaryPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.building.primaryPhotoUrl}
            alt={item.building.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
            <Building2 className="w-12 h-12 text-white/60" />
          </div>
        )}

        {/* Price badge */}
        <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm text-gray-900 text-lg font-bold px-3 py-1.5 rounded-lg shadow-sm">
          {formatCurrency(item.rentMin)}/mo
        </div>

        {/* Management badge */}
        {item.management && (
          <div className="absolute top-3 left-3 bg-emerald-500 text-white text-xs font-medium px-2.5 py-1 rounded-full">
            {item.management.name}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.building.name}</h3>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <MapPin className="w-3.5 h-3.5" />
          <span>{item.neighborhood.name}</span>
          <span className="px-1.5 py-0.5 rounded bg-gray-100 text-xs font-medium">
            {item.neighborhood.grade}
          </span>
        </div>

        {/* Specs */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600 mb-4">
          <span>{formatBedrooms(item.bedrooms)}</span>
          <span>{item.bathrooms} Bath</span>
          {item.sqftMin && <span>{item.sqftMin.toLocaleString()} sqft</span>}
          {item.building.rating && (
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              {item.building.rating.toFixed(1)}
            </span>
          )}
        </div>

        {/* Amenities */}
        {item.building.amenities.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {item.building.amenities.slice(0, 4).map((amenity) => (
              <span
                key={amenity}
                className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
              >
                {amenity}
              </span>
            ))}
            {item.building.amenities.length > 4 && (
              <span className="px-2.5 py-1 bg-gray-100 text-gray-500 text-xs rounded-md">
                +{item.building.amenities.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Notes */}
        {item.notes && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-sm text-gray-600 italic">&ldquo;{item.notes}&rdquo;</p>
          </div>
        )}

        {/* Action links */}
        {(item.building.listingUrl || item.building.floorplansUrl) && (
          <div className="flex gap-3 mt-4 pt-3 border-t border-gray-100">
            {item.building.listingUrl && (
              <a
                href={item.building.listingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Listing
              </a>
            )}
            {item.building.floorplansUrl && (
              <a
                href={item.building.floorplansUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Floor Plans
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function BuildingCard({ item }: { item: BuildingItem }) {
  const priceRange =
    item.units.length > 0
      ? {
          min: Math.min(...item.units.map((u) => u.rentMin)),
          max: Math.max(...item.units.map((u) => u.rentMax)),
        }
      : null

  return (
    <div className="bg-white rounded-2xl border border-[#e2e5ea] overflow-hidden">
      {/* Image */}
      <div className="relative h-48">
        {item.primaryPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.primaryPhotoUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
            <Building2 className="w-12 h-12 text-white/60" />
          </div>
        )}

        {/* Price badge */}
        {priceRange && (
          <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm text-gray-900 text-lg font-bold px-3 py-1.5 rounded-lg shadow-sm">
            {formatCurrency(priceRange.min)} - {formatCurrency(priceRange.max)}
          </div>
        )}

        {/* Management badge */}
        {item.management && (
          <div className="absolute top-3 left-3 bg-emerald-500 text-white text-xs font-medium px-2.5 py-1 rounded-full">
            {item.management.name}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.name}</h3>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <MapPin className="w-3.5 h-3.5" />
          <span>{item.neighborhood.name}</span>
          <span className="px-1.5 py-0.5 rounded bg-gray-100 text-xs font-medium">
            {item.neighborhood.grade}
          </span>
        </div>

        {/* Available units */}
        {item.units.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
              {item.units.length} unit{item.units.length !== 1 ? 's' : ''} available
            </p>
            <div className="flex flex-wrap gap-2">
              {item.units.slice(0, 4).map((unit) => (
                <span
                  key={unit.id}
                  className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-md"
                >
                  {formatBedrooms(unit.bedrooms)} from {formatCurrency(unit.rentMin)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Rating & Walk Score */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600 mb-4">
          {item.rating && (
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              {item.rating.toFixed(1)}
              {item.reviewCount && (
                <span className="text-gray-400">({item.reviewCount})</span>
              )}
            </span>
          )}
          {item.neighborhood.walkScore && (
            <span>Walk Score: {item.neighborhood.walkScore}</span>
          )}
        </div>

        {/* Amenities */}
        {item.amenities.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {item.amenities.slice(0, 4).map((amenity) => (
              <span
                key={amenity}
                className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
              >
                {amenity}
              </span>
            ))}
            {item.amenities.length > 4 && (
              <span className="px-2.5 py-1 bg-gray-100 text-gray-500 text-xs rounded-md">
                +{item.amenities.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Notes */}
        {item.notes && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-sm text-gray-600 italic">&ldquo;{item.notes}&rdquo;</p>
          </div>
        )}

        {/* Action links */}
        {(item.listingUrl || item.floorplansUrl) && (
          <div className="flex gap-3 mt-4 pt-3 border-t border-gray-100">
            {item.listingUrl && (
              <a
                href={item.listingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Property
              </a>
            )}
            {item.floorplansUrl && (
              <a
                href={item.floorplansUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Floor Plans
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ShareReportView({ report }: ShareReportViewProps) {
  const prefs = report.preferences

  // Format budget string
  const budgetStr =
    prefs.budgetMin && prefs.budgetMax
      ? `${formatCurrency(prefs.budgetMin)} - ${formatCurrency(prefs.budgetMax)}`
      : prefs.budgetMax
        ? `Up to ${formatCurrency(prefs.budgetMax)}`
        : null

  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      {/* Header */}
      <div className="bg-white border-b border-[#e2e5ea]">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {report.clientName}&apos;s Recommendations
          </h1>
          <p className="text-gray-500 mb-6">
            {report.listings.length} apartment{report.listings.length !== 1 ? 's' : ''} curated for you
          </p>

          {/* Preferences */}
          <div className="flex flex-wrap gap-4 text-sm">
            {budgetStr && (
              <div className="flex items-center gap-2 text-gray-600">
                <span>Budget: {budgetStr}</span>
              </div>
            )}
            {prefs.bedrooms.length > 0 && (
              <div className="text-gray-600">
                Bedrooms: {prefs.bedrooms.join(', ')}
              </div>
            )}
          </div>

          {/* Lifestyle badges */}
          <div className="flex flex-wrap gap-2 mt-4">
            {prefs.hasDog && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                <Dog className="w-3.5 h-3.5" />
                Dog Owner
              </span>
            )}
            {prefs.hasCat && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                <Cat className="w-3.5 h-3.5" />
                Cat Owner
              </span>
            )}
            {prefs.hasKids && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                <Baby className="w-3.5 h-3.5" />
                Has Kids
              </span>
            )}
            {prefs.worksFromHome && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-medium">
                <Home className="w-3.5 h-3.5" />
                Works From Home
              </span>
            )}
            {prefs.needsParking && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-medium">
                <Car className="w-3.5 h-3.5" />
                Needs Parking
              </span>
            )}
            {prefs.priorities.map((priority) => (
              <span
                key={priority}
                className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium"
              >
                {priority}
              </span>
            ))}
          </div>

          {/* Neighborhoods */}
          {prefs.neighborhoods.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                Preferred Neighborhoods
              </p>
              <div className="flex flex-wrap gap-2">
                {prefs.neighborhoods.map((hood) => (
                  <span
                    key={hood}
                    className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                  >
                    {hood}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Listings */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {report.listings.map((item) =>
            item.type === 'listing' ? (
              <ListingCard key={item.id} item={item as ListingItem} />
            ) : (
              <BuildingCard key={item.id} item={item as BuildingItem} />
            )
          )}
        </div>

        {report.listings.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No recommendations yet.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e2e5ea] bg-white mt-12">
        <div className="max-w-4xl mx-auto px-6 py-6 text-center">
          <p className="text-sm text-gray-400">
            Powered by{' '}
            <a
              href="https://movd.pro"
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
