'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BuildingImage } from '@/components/BuildingImage'
import { EditableField } from '@/components/listings'
import { CommunityVerificationBanner } from '@/components/CommunityVerificationBanner'
import {
  ArrowLeft,
  MapPin,
  Star,
  ExternalLink,
  Bed,
  Bath,
  Maximize,
  Building2,
  UserPlus,
  Check,
  Calendar,
} from 'lucide-react'
import type { FieldEditRecord } from '@/types/field-edits'
import type { ListingDetailData } from '@/lib/detail-data'
import type { DetailClient } from '@/lib/detail-data'

function formatBedrooms(bedrooms: number): string {
  if (bedrooms === 0) return 'Studio'
  if (bedrooms === 1) return '1 Bedroom'
  if (bedrooms === 2) return '2 Bedrooms'
  return `${bedrooms} Bedrooms`
}

interface ListingDetailViewProps {
  listing: ListingDetailData
  fieldEdits: Record<string, FieldEditRecord>
  clients: DetailClient[]
}

export function ListingDetailView({ listing, fieldEdits, clients }: ListingDetailViewProps) {
  const [saveDropdownOpen, setSaveDropdownOpen] = useState(false)
  const [savingTo, setSavingTo] = useState<string | null>(null)
  const [clientsState, setClientsState] = useState(clients)

  const { building } = listing

  const saveToClient = async (clientId: string) => {
    setSavingTo(clientId)
    try {
      const res = await fetch(`/api/clients/${clientId}/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing.id }),
      })

      if (res.ok) {
        setClientsState((prev) =>
          prev.map((c) =>
            c.id === clientId
              ? { ...c, savedListings: [...(c.savedListings || []), { listingId: listing.id }] }
              : c
          )
        )
      }
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setSavingTo(null)
      setSaveDropdownOpen(false)
    }
  }

  const removeFromClient = async (clientId: string) => {
    setSavingTo(clientId)
    try {
      const res = await fetch(`/api/clients/${clientId}/listings`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing.id }),
      })

      if (res.ok) {
        setClientsState((prev) =>
          prev.map((c) =>
            c.id === clientId
              ? { ...c, savedListings: (c.savedListings || []).filter((l) => l.listingId !== listing.id) }
              : c
          )
        )
      }
    } catch (error) {
      console.error('Remove error:', error)
    } finally {
      setSavingTo(null)
      setSaveDropdownOpen(false)
    }
  }

  const isListingSavedToClient = (clientId: string) => {
    const client = clientsState.find((c) => c.id === clientId)
    return client?.savedListings?.some((l) => l.listingId === listing.id) || false
  }

  const floorplanUrl = building.floorplansUrl ||
    (building.listingUrl ? `${building.listingUrl.replace(/\/$/, '')}/floorplans` : null)

  return (
    <div className="p-4 md:p-8">
      {/* Back */}
      <Link
        href="/search"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 md:mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to search
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-2 mb-2">
            <h1 className="text-xl md:text-2xl font-bold">
              {listing.unitNumber || listing.name || formatBedrooms(listing.bedrooms)}
            </h1>
            <span className="text-muted-foreground text-sm sm:text-base">at</span>
            <Link href={`/property/${building.id}`} className="text-xl md:text-2xl font-bold hover:underline">
              {building.name}
            </Link>
            {building.management && (
              <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-xs md:text-sm font-medium w-fit">
                {building.management.name}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 md:gap-2 text-sm md:text-base text-muted-foreground">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="break-words">
              {building.address}, {building.city}, {building.state} {building.zipCode}
            </span>
            <span className="text-muted-foreground/50 hidden sm:inline">·</span>
            <Link href={`/neighborhood/${building.neighborhood.slug}`} className="hover:underline">
              {building.neighborhood.name}
            </Link>
            <span className="px-1.5 py-0.5 rounded bg-muted text-xs font-medium">
              {building.neighborhood.grade}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setSaveDropdownOpen(!saveDropdownOpen)}
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg font-medium bg-muted hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Save to Client
            </button>

            {saveDropdownOpen && (
              <>
                <button
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setSaveDropdownOpen(false)}
                  aria-label="Close menu"
                  tabIndex={-1}
                />
                <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-full sm:w-64 bg-background rounded-lg border shadow-lg z-50" role="menu" aria-label="Save to client">
                  <div className="p-3 border-b">
                    <p className="text-sm font-medium">Save to client</p>
                  </div>
                  {clientsState.length > 0 ? (
                    <div className="max-h-64 overflow-y-auto">
                      {clientsState.map((client) => {
                        const isSaved = isListingSavedToClient(client.id)
                        return (
                          <button
                            key={client.id}
                            onClick={() => (isSaved ? removeFromClient(client.id) : saveToClient(client.id))}
                            disabled={savingTo === client.id}
                            className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-muted transition-colors disabled:opacity-50"
                          >
                            <span>{client.name}</span>
                            {isSaved && <Check className="w-4 h-4 text-emerald-600" />}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="p-4 text-center">
                      <p className="text-sm text-muted-foreground mb-2">No clients yet</p>
                      <Link href="/clients/new" className="text-sm font-medium text-foreground hover:underline">
                        Add a client
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {floorplanUrl && (
            <a
              href={floorplanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              View Floorplans
            </a>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-background rounded-xl border overflow-hidden">
            <div className="aspect-video relative">
              <BuildingImage
                src={listing.photoUrl || building.primaryPhotoUrl}
                alt={listing.name || building.name}
                fill
                className={listing.photoUrl ? 'object-contain bg-muted' : 'object-cover'}
                iconSize="lg"
              />
            </div>
          </div>

          <CommunityVerificationBanner />

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="bg-background rounded-xl border p-3 md:p-4">
              <EditableField
                targetType="unit"
                targetId={listing.id}
                fieldName="rentMin"
                label="Rent (Min)"
                type="number"
                currentValue={fieldEdits.rentMin?.newValue as number ?? listing.rentMin}
                lastEdit={fieldEdits.rentMin ?? null}
                prefix="$"
                suffix="/mo"
                placeholder="e.g., 1500"
              />
            </div>

            <div className="bg-background rounded-xl border p-3 md:p-4">
              <EditableField
                targetType="unit"
                targetId={listing.id}
                fieldName="rentMax"
                label="Rent (Max)"
                type="number"
                currentValue={fieldEdits.rentMax?.newValue as number ?? listing.rentMax}
                lastEdit={fieldEdits.rentMax ?? null}
                prefix="$"
                suffix="/mo"
                placeholder="e.g., 2000"
              />
            </div>

            <div className="bg-background rounded-xl border p-3 md:p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Bed className="w-4 h-4" />
                <span className="text-[10px] md:text-xs">Bedrooms</span>
              </div>
              <p className="font-bold text-lg md:text-xl">{listing.bedrooms === 0 ? 'Studio' : listing.bedrooms}</p>
            </div>

            <div className="bg-background rounded-xl border p-3 md:p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Bath className="w-4 h-4" />
                <span className="text-[10px] md:text-xs">Bathrooms</span>
              </div>
              <p className="font-bold text-lg md:text-xl">{listing.bathrooms}</p>
            </div>

            {listing.sqftMin && (
              <div className="bg-background rounded-xl border p-3 md:p-4 col-span-2 sm:col-span-1">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Maximize className="w-4 h-4" />
                  <span className="text-[10px] md:text-xs">Size</span>
                </div>
                <p className="font-bold text-lg md:text-xl">
                  {listing.sqftMin === listing.sqftMax
                    ? listing.sqftMin.toLocaleString()
                    : `${listing.sqftMin.toLocaleString()}-${listing.sqftMax?.toLocaleString()}`}
                  <span className="text-xs md:text-sm text-muted-foreground font-normal ml-1">sq ft</span>
                </p>
              </div>
            )}
          </div>

          {(listing.availableCount > 0 || listing.availableDate) && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-emerald-700">
                <Calendar className="w-5 h-5" />
                <span className="font-medium">
                  {listing.availableCount > 0
                    ? `${listing.availableCount} unit${listing.availableCount > 1 ? 's' : ''} available`
                    : 'Available'}
                  {listing.availableDate && (
                    <span className="font-normal">
                      {' '}starting {new Date(listing.availableDate).toLocaleDateString()}
                    </span>
                  )}
                </span>
              </div>
            </div>
          )}

          {floorplanUrl && (
            <div className="bg-background rounded-xl border overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="font-semibold">Floorplans</h2>
                <a
                  href={floorplanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  Open in new tab <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="p-8 text-center">
                <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  View detailed floor plans on the property website
                </p>
                <a
                  href={floorplanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Floorplans
                </a>
              </div>
            </div>
          )}

          {building.amenities.length > 0 && (
            <div className="bg-background rounded-xl border p-3 md:p-4">
              <h2 className="font-semibold mb-3 md:mb-4 text-sm md:text-base">Building Amenities</h2>
              <div className="grid grid-cols-2 gap-2 md:gap-3">
                {building.amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-2 text-xs md:text-sm">
                    <Check className="w-3.5 md:w-4 h-3.5 md:h-4 text-emerald-600 flex-shrink-0" />
                    <span className="truncate">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4 md:space-y-6">
          <div className="bg-background rounded-xl border p-3 md:p-4">
            <h2 className="font-semibold mb-3 text-sm md:text-base">Building</h2>
            <Link href={`/property/${building.id}`} className="block group">
              <div className="flex items-center gap-3">
                <div className="w-14 md:w-16 h-10 md:h-12 rounded-lg overflow-hidden flex-shrink-0">
                  <BuildingImage
                    src={building.primaryPhotoUrl}
                    alt={building.name}
                    width={64}
                    height={48}
                    className="w-full h-full object-cover"
                    iconSize="sm"
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-medium group-hover:underline text-sm md:text-base truncate">{building.name}</p>
                  {building.rating && (
                    <div className="flex items-center gap-1 text-xs md:text-sm text-muted-foreground">
                      <Star className="w-3 md:w-3.5 h-3 md:h-3.5 text-amber-500 fill-amber-500" />
                      <span>{building.rating.toFixed(1)}</span>
                      {building.reviewCount && <span>({building.reviewCount})</span>}
                    </div>
                  )}
                </div>
              </div>
            </Link>

            <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t space-y-2 text-xs md:text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 md:w-4 h-3.5 md:h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground break-words">
                  {building.address}, {building.city}, {building.state} {building.zipCode}
                </span>
              </div>
              {building.petPolicy && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>🐕</span>
                  <span>{building.petPolicy === 'dogs-allowed' ? 'Dogs Allowed' : building.petPolicy}</span>
                </div>
              )}
              {building.parkingType && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>🅿️</span>
                  <span>{building.parkingType === 'garage' ? 'Garage Parking' : building.parkingType}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-background rounded-xl border p-3 md:p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm md:text-base">Neighborhood</h2>
              <Link
                href={`/neighborhood/${building.neighborhood.slug}`}
                className="text-xs md:text-sm text-muted-foreground hover:text-foreground"
              >
                Details →
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 md:w-12 h-10 md:h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <span className="text-base md:text-lg font-bold">{building.neighborhood.grade}</span>
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm md:text-base truncate">{building.neighborhood.name}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Charlotte, NC</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3 md:mt-4">
              {building.neighborhood.walkScore && (
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <p className="text-base md:text-lg font-bold">{building.neighborhood.walkScore}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground">Walk</p>
                </div>
              )}
              {building.neighborhood.transitScore && (
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <p className="text-base md:text-lg font-bold">{building.neighborhood.transitScore}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground">Transit</p>
                </div>
              )}
            </div>
          </div>

          {building.management && (
            <div className="bg-background rounded-xl border p-3 md:p-4">
              <h2 className="font-semibold mb-3 text-sm md:text-base">Managed By</h2>
              <div className="flex items-center gap-3">
                {building.management.logoUrl ? (
                  <Image
                    src={building.management.logoUrl}
                    alt={building.management.name}
                    width={48}
                    height={48}
                    className="rounded-lg w-10 h-10 md:w-12 md:h-12"
                  />
                ) : (
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" />
                  </div>
                )}
                <p className="font-medium text-sm md:text-base">{building.management.name}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
