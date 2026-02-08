'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BuildingImage } from '@/components/BuildingImage'
import {
  ArrowLeft,
  MapPin,
  Star,
  ExternalLink,
  Bed,
  Bath,
  Maximize,
  DollarSign,
  Building2,
  UserPlus,
  Check,
  Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Listing {
  id: string
  unitNumber: string | null
  name: string | null
  bedrooms: number
  bathrooms: number
  sqftMin: number | null
  sqftMax: number | null
  rentMin: number
  rentMax: number
  availableCount: number
  availableDate: string | null
  photoUrl: string | null
  building: {
    id: string
    name: string
    address: string
    city: string
    state: string
    zipCode: string | null
    lat: number
    lng: number
    primaryPhotoUrl: string | null
    photos: string[]
    amenities: string[]
    rating: number | null
    reviewCount: number | null
    listingUrl: string | null
    floorplansUrl: string | null
    petPolicy: string | null
    parkingType: string | null
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
}

interface Client {
  id: string
  name: string
  savedListings?: { listingId: string }[]
}

function formatBedrooms(bedrooms: number): string {
  if (bedrooms === 0) return 'Studio'
  if (bedrooms === 1) return '1 Bedroom'
  if (bedrooms === 2) return '2 Bedrooms'
  return `${bedrooms} Bedrooms`
}

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState<Client[]>([])
  const [saveDropdownOpen, setSaveDropdownOpen] = useState(false)
  const [savingTo, setSavingTo] = useState<string | null>(null)

  useEffect(() => {
    // Fetch listing data
    fetch(`/api/listings/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.listing) {
          setListing(data.listing)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))

    // Fetch clients
    fetch('/api/clients')
      .then((res) => res.json())
      .then((data) => {
        if (data.clients) {
          setClients(data.clients.filter((c: Client & { status: string }) => c.status === 'active'))
        }
      })
      .catch(console.error)
  }, [id])

  const saveToClient = async (clientId: string) => {
    if (!listing) return
    setSavingTo(clientId)
    try {
      const res = await fetch(`/api/clients/${clientId}/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing.id }),
      })

      if (res.ok) {
        setClients((prev) =>
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
    if (!listing) return
    setSavingTo(clientId)
    try {
      const res = await fetch(`/api/clients/${clientId}/listings`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing.id }),
      })

      if (res.ok) {
        setClients((prev) =>
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
    if (!listing) return false
    const client = clients.find((c) => c.id === clientId)
    return client?.savedListings?.some((l) => l.listingId === listing.id) || false
  }

  // Generate floorplan URL
  const floorplanUrl = listing?.building.floorplansUrl ||
    (listing?.building.listingUrl ? `${listing.building.listingUrl.replace(/\/$/, '')}/floorplans` : null)

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-6" />
          <div className="h-64 bg-muted rounded-xl mb-6" />
          <div className="h-4 bg-muted rounded w-3/4 mb-2" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="p-8">
        <Link
          href="/search"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to search
        </Link>
        <div className="text-center py-16 bg-background rounded-xl border">
          <p className="text-lg font-medium mb-1">Listing not found</p>
          <p className="text-muted-foreground">This listing may have been removed or is no longer available.</p>
        </div>
      </div>
    )
  }

  const { building } = listing

  return (
    <div className="p-8">
      {/* Back */}
      <Link
        href="/search"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to search
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">
              {listing.unitNumber || listing.name || formatBedrooms(listing.bedrooms)}
            </h1>
            <span className="text-muted-foreground">at</span>
            <Link href={`/property/${building.id}`} className="text-2xl font-bold hover:underline">
              {building.name}
            </Link>
            {building.management && (
              <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-sm font-medium">
                {building.management.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>
              {building.address}, {building.city}, {building.state} {building.zipCode}
            </span>
            <span className="text-muted-foreground/50">·</span>
            <Link href={`/neighborhood/${building.neighborhood.slug}`} className="hover:underline">
              {building.neighborhood.name}
            </Link>
            <span className="px-1.5 py-0.5 rounded bg-muted text-xs font-medium">
              {building.neighborhood.grade}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Save to Client */}
          <div className="relative">
            <button
              onClick={() => setSaveDropdownOpen(!saveDropdownOpen)}
              className="px-4 py-2 rounded-lg font-medium bg-muted hover:bg-muted/80 transition-colors flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Save to Client
            </button>

            {saveDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setSaveDropdownOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-64 bg-background rounded-lg border shadow-lg z-50">
                  <div className="p-3 border-b">
                    <p className="text-sm font-medium">Save to client</p>
                  </div>
                  {clients.length > 0 ? (
                    <div className="max-h-64 overflow-y-auto">
                      {clients.map((client) => {
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

          {/* View Floorplans */}
          {floorplanUrl && (
            <a
              href={floorplanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              View Floorplans
            </a>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Listing Photo or Building Photo */}
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

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-background rounded-xl border p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs">Rent</span>
              </div>
              <p className="font-bold text-xl">
                ${listing.rentMin.toLocaleString()}
                {listing.rentMin !== listing.rentMax && (
                  <span className="text-muted-foreground text-sm font-normal">
                    {' '}- ${listing.rentMax.toLocaleString()}
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">/month</p>
            </div>

            <div className="bg-background rounded-xl border p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Bed className="w-4 h-4" />
                <span className="text-xs">Bedrooms</span>
              </div>
              <p className="font-bold text-xl">{listing.bedrooms === 0 ? 'Studio' : listing.bedrooms}</p>
            </div>

            <div className="bg-background rounded-xl border p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Bath className="w-4 h-4" />
                <span className="text-xs">Bathrooms</span>
              </div>
              <p className="font-bold text-xl">{listing.bathrooms}</p>
            </div>

            {listing.sqftMin && (
              <div className="bg-background rounded-xl border p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Maximize className="w-4 h-4" />
                  <span className="text-xs">Size</span>
                </div>
                <p className="font-bold text-xl">
                  {listing.sqftMin === listing.sqftMax
                    ? listing.sqftMin.toLocaleString()
                    : `${listing.sqftMin.toLocaleString()}-${listing.sqftMax?.toLocaleString()}`}
                </p>
                <p className="text-xs text-muted-foreground">sq ft</p>
              </div>
            )}
          </div>

          {/* Availability */}
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

          {/* Floorplan Section */}
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

          {/* Amenities */}
          {building.amenities.length > 0 && (
            <div className="bg-background rounded-xl border p-4">
              <h2 className="font-semibold mb-4">Building Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {building.amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Building Info */}
          <div className="bg-background rounded-xl border p-4">
            <h2 className="font-semibold mb-3">Building</h2>
            <Link href={`/property/${building.id}`} className="block group">
              <div className="flex items-center gap-3">
                <div className="w-16 h-12 rounded-lg overflow-hidden">
                  <BuildingImage
                    src={building.primaryPhotoUrl}
                    alt={building.name}
                    width={64}
                    height={48}
                    className="w-full h-full object-cover"
                    iconSize="sm"
                  />
                </div>
                <div>
                  <p className="font-medium group-hover:underline">{building.name}</p>
                  {building.rating && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>{building.rating.toFixed(1)}</span>
                      {building.reviewCount && <span>({building.reviewCount})</span>}
                    </div>
                  )}
                </div>
              </div>
            </Link>

            <div className="mt-4 pt-4 border-t space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">
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

          {/* Neighborhood */}
          <div className="bg-background rounded-xl border p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Neighborhood</h2>
              <Link
                href={`/neighborhood/${building.neighborhood.slug}`}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                View Details →
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                <span className="text-lg font-bold">{building.neighborhood.grade}</span>
              </div>
              <div>
                <p className="font-medium">{building.neighborhood.name}</p>
                <p className="text-sm text-muted-foreground">Charlotte, NC</p>
              </div>
            </div>

            {/* Walk/Transit Scores */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              {building.neighborhood.walkScore && (
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <p className="text-lg font-bold">{building.neighborhood.walkScore}</p>
                  <p className="text-xs text-muted-foreground">Walk Score</p>
                </div>
              )}
              {building.neighborhood.transitScore && (
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <p className="text-lg font-bold">{building.neighborhood.transitScore}</p>
                  <p className="text-xs text-muted-foreground">Transit Score</p>
                </div>
              )}
            </div>
          </div>

          {/* Management */}
          {building.management && (
            <div className="bg-background rounded-xl border p-4">
              <h2 className="font-semibold mb-3">Managed By</h2>
              <div className="flex items-center gap-3">
                {building.management.logoUrl ? (
                  <Image
                    src={building.management.logoUrl}
                    alt={building.management.name}
                    width={48}
                    height={48}
                    className="rounded-lg"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-emerald-600" />
                  </div>
                )}
                <p className="font-medium">{building.management.name}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
