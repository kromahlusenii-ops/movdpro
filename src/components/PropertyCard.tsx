/**
 * PropertyCard - AI-Readable Property Listing Card
 *
 * This component renders a property listing card with:
 * - Consistent data-* attributes for AI parsing
 * - Schema.org microdata
 * - Machine-readable values for prices, dates, etc.
 * - ARIA labels for accessibility
 */

import Link from 'next/link'
import { BuildingImage } from '@/components/BuildingImage'
import { Rent } from '@/components/ui/semantic/Price'
import { CompactAddress } from '@/components/ui/semantic/Address'
import {
  entityAttrs,
  fieldAttr,
  actionAttr,
  ENTITY_TYPES,
  FIELD_TYPES,
  ACTION_TYPES,
} from '@/lib/ai-readability'
import {
  MapPin,
  Bed,
  Bath,
  Ruler,
  Star,
  Tag,
  UserPlus,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PropertyCardData {
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

interface PropertyCardProps {
  listing: PropertyCardData
  /** Open save dropdown */
  onSaveClick?: () => void
  /** Whether save dropdown is open */
  saveDropdownOpen?: boolean
  /** Custom class name */
  className?: string
}

const GRADE_LABELS: Record<string, string> = {
  'A+': 'Excellent',
  A: 'Excellent',
  'A-': 'Very Good',
  'B+': 'Good',
  B: 'Good',
  'B-': 'Above Average',
  'C+': 'Average',
  C: 'Average',
  'C-': 'Below Average',
  D: 'Poor',
  F: 'Very Poor',
}

function formatBedrooms(bedrooms: number): string {
  if (bedrooms === 0) return 'Studio'
  if (bedrooms === 1) return '1 BR'
  if (bedrooms === 2) return '2 BR'
  return `${bedrooms} BR`
}

export function PropertyCard({
  listing,
  onSaveClick,
  saveDropdownOpen = false,
  className,
}: PropertyCardProps) {
  const unitLabel = listing.unitNumber || formatBedrooms(listing.bedrooms)
  const gradeLabel = GRADE_LABELS[listing.neighborhood.grade] || 'Unrated'

  return (
    <article
      className={cn(
        'bg-background rounded-lg border p-3 flex gap-3 hover:border-foreground/20 transition-colors',
        className
      )}
      aria-labelledby={`listing-title-${listing.id}`}
      itemScope
      itemType="https://schema.org/Apartment"
      {...entityAttrs(ENTITY_TYPES.PROPERTY, listing.id)}
      data-building-id={listing.building.id}
      data-neighborhood={listing.neighborhood.slug}
      data-available={listing.isAvailable}
      data-has-deals={listing.hasActiveDeals}
    >
      {/* Hidden structured data */}
      <meta itemProp="url" content={`/listing/${listing.id}`} />
      <meta
        itemProp="geo"
        content={`${listing.building.lat},${listing.building.lng}`}
      />

      {/* Clickable area - Photo + Info */}
      <Link
        href={`/listing/${listing.id}`}
        className="flex gap-3 flex-1 min-w-0"
        {...actionAttr(ACTION_TYPES.VIEW_DETAILS)}
      >
        {/* Photo */}
        <div className="w-36 h-24 rounded-md bg-muted flex-shrink-0 overflow-hidden">
          <BuildingImage
            src={listing.building.primaryPhotoUrl}
            alt={`Exterior photo of ${listing.building.name}`}
            width={144}
            height={96}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {/* Unit + Building Name */}
              <h2
                id={`listing-title-${listing.id}`}
                className="flex items-center gap-2 flex-wrap"
                itemProp="name"
                {...fieldAttr(FIELD_TYPES.NAME)}
              >
                <span className="font-bold text-lg">{unitLabel}</span>
                <span className="text-muted-foreground">at</span>
                <span className="font-semibold truncate">
                  {listing.building.name}
                </span>
                {listing.hasActiveDeals && (
                  <span
                    className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-medium flex-shrink-0 flex items-center gap-0.5"
                    data-field="special"
                  >
                    <Tag className="w-2.5 h-2.5" aria-hidden="true" />
                    <span>Special</span>
                  </span>
                )}
                {listing.management && (
                  <span
                    className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-medium flex-shrink-0"
                    {...fieldAttr(FIELD_TYPES.MANAGEMENT_COMPANY)}
                    data-management-id={listing.management.id}
                  >
                    {listing.management.name}
                  </span>
                )}
              </h2>

              {/* Address + Neighborhood */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <MapPin
                  className="w-3 h-3 flex-shrink-0"
                  aria-hidden="true"
                />
                <CompactAddress
                  street={listing.building.address}
                  neighborhood={listing.neighborhood.name}
                  className="flex items-center gap-1.5"
                />
                <span
                  className="px-1 py-0.5 rounded bg-muted text-[10px] font-medium flex-shrink-0"
                  title={`Neighborhood grade: ${listing.neighborhood.grade} - ${gradeLabel}`}
                  {...fieldAttr(FIELD_TYPES.GRADE)}
                  data-grade={listing.neighborhood.grade}
                >
                  <span className="sr-only">Neighborhood grade: </span>
                  {listing.neighborhood.grade}
                  <span className="sr-only"> - {gradeLabel}</span>
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="text-right flex-shrink-0">
              <p className="font-bold text-xl">
                <span className="sr-only">Monthly rent: </span>
                <Rent
                  min={listing.rentMin}
                  max={listing.rentMax}
                />
              </p>
            </div>
          </div>

          {/* Unit Details */}
          <dl className="flex items-center gap-4 mt-2 text-sm">
            <div className="flex items-center gap-1.5">
              <Bed
                className="w-4 h-4 text-muted-foreground"
                aria-hidden="true"
              />
              <dt className="sr-only">Bedrooms:</dt>
              <dd
                itemProp="numberOfBedrooms"
                {...fieldAttr(FIELD_TYPES.BEDROOMS)}
                data-value={listing.bedrooms}
              >
                {formatBedrooms(listing.bedrooms)}
              </dd>
            </div>
            <div className="flex items-center gap-1.5">
              <Bath
                className="w-4 h-4 text-muted-foreground"
                aria-hidden="true"
              />
              <dt className="sr-only">Bathrooms:</dt>
              <dd
                itemProp="numberOfBathroomsTotal"
                {...fieldAttr(FIELD_TYPES.BATHROOMS)}
                data-value={listing.bathrooms}
              >
                {listing.bathrooms} Bath
              </dd>
            </div>
            {listing.sqftMin && (
              <div className="flex items-center gap-1.5">
                <Ruler
                  className="w-4 h-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <dt className="sr-only">Square feet:</dt>
                <dd
                  {...fieldAttr(FIELD_TYPES.SQFT)}
                  data-value={listing.sqftMin}
                  data-unit="sqft"
                >
                  {listing.sqftMin.toLocaleString()} sqft
                </dd>
              </div>
            )}
            {listing.building.rating && (
              <div className="flex items-center gap-1">
                <Star
                  className="w-4 h-4 text-amber-500 fill-amber-500"
                  aria-hidden="true"
                />
                <dt className="sr-only">Rating:</dt>
                <dd
                  {...fieldAttr(FIELD_TYPES.RATING)}
                  data-value={listing.building.rating}
                >
                  {listing.building.rating.toFixed(1)}
                  {listing.building.reviewCount && (
                    <span
                      className="text-muted-foreground"
                      {...fieldAttr(FIELD_TYPES.REVIEW_COUNT)}
                      data-value={listing.building.reviewCount}
                    >
                      {' '}
                      ({listing.building.reviewCount} reviews)
                    </span>
                  )}
                </dd>
              </div>
            )}
          </dl>

          {/* Amenities */}
          {listing.building.amenities.length > 0 && (
            <div
              className="flex flex-wrap gap-1 mt-2"
              {...fieldAttr(FIELD_TYPES.AMENITIES)}
              data-count={listing.building.amenities.length}
            >
              {listing.building.amenities.slice(0, 4).map((amenity) => (
                <span
                  key={amenity}
                  className="px-1.5 py-0.5 rounded bg-muted text-[10px]"
                  itemProp="amenityFeature"
                  itemScope
                  itemType="https://schema.org/LocationFeatureSpecification"
                >
                  <span itemProp="name">{amenity}</span>
                </span>
              ))}
              {listing.building.amenities.length > 4 && (
                <span className="text-[10px] text-muted-foreground">
                  +{listing.building.amenities.length - 4} more
                </span>
              )}
            </div>
          )}
        </div>
      </Link>

      {/* Actions */}
      {onSaveClick && (
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <button
            onClick={onSaveClick}
            aria-expanded={saveDropdownOpen}
            aria-haspopup="menu"
            aria-label={`Save ${listing.building.name} to client`}
            className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            {...actionAttr(ACTION_TYPES.SAVE_PROPERTY)}
          >
            <UserPlus className="w-3 h-3" aria-hidden="true" />
            Save
          </button>
        </div>
      )}
    </article>
  )
}

export default PropertyCard
