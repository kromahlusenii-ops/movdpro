'use client'

import Link from 'next/link'
import { MapPin, Bed, Bath, Ruler, Star, Tag, UserPlus, Check } from 'lucide-react'
import { Listing, ClientSummary, GRADE_LABELS, formatBedrooms } from '@/types'

interface ListingCardProps {
  listing: Listing
  clients: ClientSummary[]
  saveDropdownId: string | null
  savingTo: string | null
  saveDropdownRef: React.RefObject<HTMLDivElement>
  onSaveDropdownToggle: (listingId: string | null) => void
  onSaveToClient: (clientId: string, listingId: string) => void
  onRemoveFromClient: (clientId: string, listingId: string) => void
  isListingSavedToClient: (clientId: string, listingId: string) => boolean
}

export function ListingCard({
  listing,
  clients,
  saveDropdownId,
  savingTo,
  saveDropdownRef,
  onSaveDropdownToggle,
  onSaveToClient,
  onRemoveFromClient,
  isListingSavedToClient,
}: ListingCardProps) {
  const isDropdownOpen = saveDropdownId === listing.id

  return (
    <article
      className="bg-background rounded-lg border p-3 hover:border-foreground/20 transition-colors"
      aria-labelledby={`listing-title-${listing.id}`}
      data-entity="property"
      data-entity-id={listing.id}
      data-building-id={listing.building.id}
      data-neighborhood={listing.neighborhood.slug}
      data-bedrooms={listing.bedrooms}
      data-bathrooms={listing.bathrooms}
      data-rent-min={listing.rentMin}
      data-rent-max={listing.rentMax}
      data-available={listing.isAvailable}
      data-has-deals={listing.hasActiveDeals}
    >
      {/* Clickable area */}
      <Link href={`/listing/${listing.id}`} className="block">
        {/* Header: Title + Price */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {/* Unit + Building Name */}
            <h2 id={`listing-title-${listing.id}`} className="font-semibold text-sm sm:text-base truncate">
              <span className="font-bold">
                {listing.unitNumber || formatBedrooms(listing.bedrooms)}
              </span>
              <span className="text-muted-foreground"> at </span>
              <span>{listing.building.name}</span>
            </h2>
            {/* Address + Neighborhood */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <MapPin className="w-3 h-3 flex-shrink-0 hidden sm:block" aria-hidden="true" />
              <span className="truncate">{listing.neighborhood.name}</span>
              <span
                className="px-1 py-0.5 rounded bg-muted text-[10px] font-medium flex-shrink-0"
                title={`Neighborhood grade: ${listing.neighborhood.grade} - ${GRADE_LABELS[listing.neighborhood.grade] || 'Unrated'}`}
              >
                {listing.neighborhood.grade}
              </span>
              {listing.hasActiveDeals && (
                <span className="px-1 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-medium flex-shrink-0 flex items-center gap-0.5">
                  <Tag className="w-2.5 h-2.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Special</span>
                </span>
              )}
            </div>
          </div>
          {/* Price */}
          <div className="text-right flex-shrink-0">
            <p className="font-bold text-base sm:text-xl">
              <span className="sr-only">Monthly rent: </span>
              ${listing.rentMin.toLocaleString()}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">/mo</p>
          </div>
        </div>

        {/* Unit Details */}
        <dl className="flex items-center gap-3 sm:gap-4 mt-2 text-xs sm:text-sm">
          <div className="flex items-center gap-1">
            <Bed className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
            <dt className="sr-only">Bedrooms:</dt>
            <dd>{formatBedrooms(listing.bedrooms)}</dd>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
            <dt className="sr-only">Bathrooms:</dt>
            <dd>{listing.bathrooms}ba</dd>
          </div>
          {listing.sqftMin && (
            <div className="hidden sm:flex items-center gap-1">
              <Ruler className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
              <dt className="sr-only">Square feet:</dt>
              <dd>{listing.sqftMin.toLocaleString()} sqft</dd>
            </div>
          )}
          {listing.building.rating && (
            <div className="flex items-center gap-0.5">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" aria-hidden="true" />
              <dt className="sr-only">Rating:</dt>
              <dd>{listing.building.rating.toFixed(1)}</dd>
            </div>
          )}
        </dl>

        {/* Amenities - hidden on mobile */}
        {listing.building.amenities.length > 0 && (
          <div className="hidden sm:flex flex-wrap gap-1 mt-2">
            {listing.building.amenities.slice(0, 4).map(amenity => (
              <span
                key={amenity}
                className="px-1.5 py-0.5 rounded bg-muted text-[10px]"
              >
                {amenity}
              </span>
            ))}
            {listing.building.amenities.length > 4 && (
              <span className="text-[10px] text-muted-foreground">
                +{listing.building.amenities.length - 4} more
              </span>
            )}
          </div>
        )}
      </Link>

      {/* Actions - horizontal row on mobile */}
      <div className="flex items-center gap-2 mt-2 pt-2 border-t">
        {/* Save to Client Dropdown */}
        <div className="relative" ref={isDropdownOpen ? saveDropdownRef : undefined}>
          <button
            onClick={() => onSaveDropdownToggle(isDropdownOpen ? null : listing.id)}
            aria-expanded={isDropdownOpen}
            aria-haspopup="menu"
            aria-label={`Save ${listing.building.name} to client`}
            className="px-3 py-1.5 rounded-md text-xs font-medium border border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
            Save to Client
          </button>

          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => onSaveDropdownToggle(null)}
                aria-hidden="true"
              />
              <div
                className="absolute right-0 top-full mt-1 w-56 bg-background rounded-lg border shadow-lg z-50"
                role="menu"
                aria-label="Save to client"
              >
                <div className="p-2 border-b">
                  <p className="text-xs font-medium text-muted-foreground">Save to client</p>
                </div>
                {clients.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto" role="group">
                    {clients.map(client => {
                      const isSaved = isListingSavedToClient(client.id, listing.id)
                      return (
                        <button
                          key={client.id}
                          role="menuitem"
                          onClick={() =>
                            isSaved
                              ? onRemoveFromClient(client.id, listing.id)
                              : onSaveToClient(client.id, listing.id)
                          }
                          disabled={savingTo === client.id}
                          className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted transition-colors disabled:opacity-50 focus:outline-none focus:bg-muted"
                        >
                          <span>{client.name}</span>
                          {isSaved && (
                            <>
                              <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                              <span className="sr-only">(saved)</span>
                            </>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="p-3 text-center">
                    <p className="text-sm text-muted-foreground mb-2">No clients yet</p>
                    <Link
                      href="/clients/new"
                      className="text-sm font-medium text-foreground hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded"
                      role="menuitem"
                    >
                      Add a client
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </article>
  )
}
