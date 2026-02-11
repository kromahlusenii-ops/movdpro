'use client'

import { useState, useEffect, use, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  MapPin,
  Star,
  Phone,
  Globe,
  ExternalLink,
  Bed,
  Bath,
  Maximize,
  DollarSign,
  Building2,
  UserPlus,
  Check,
  Car,
  PawPrint,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Unit {
  id: string
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
}

interface Building {
  id: string
  name: string
  address: string
  city: string
  state: string
  zipCode: string | null
  lat: number
  lng: number
  neighborhood: {
    id: string
    name: string
    slug: string
    grade: string
    compositeScore: number
    walkScore: number | null
    transitScore: number | null
    bikeScore: number | null
    description: string | null
    highlights: string[]
    sentimentSummary: string | null
  }
  management: {
    id: string
    name: string
    slug: string
    logoUrl: string | null
    website: string | null
  } | null
  rating: number | null
  reviewCount: number | null
  website: string | null
  phone: string | null
  primaryPhotoUrl: string | null
  photos: string[]
  amenities: string[]
  petPolicy: string | null
  parkingType: string | null
  listingUrl: string | null
  floorplansUrl: string | null
  yearBuilt: number | null
  rentMin: number | null
  rentMax: number | null
  bedrooms: string[]
  units: Unit[]
}

interface Client {
  id: string
  name: string
  savedBuildings?: { buildingId: string }[]
}

const AMENITY_LABELS: Record<string, string> = {
  pool: 'Pool',
  gym: 'Gym/Fitness',
  parking: 'Parking',
  'pet-friendly': 'Pet Friendly',
  'in-unit-laundry': 'In-Unit Laundry',
  doorman: 'Doorman',
  rooftop: 'Rooftop',
  concierge: 'Concierge',
}

function BedroomLabel({ bedrooms }: { bedrooms: number }) {
  if (bedrooms === 0) return <span>Studio</span>
  return <span>{bedrooms} BR</span>
}

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [building, setBuilding] = useState<Building | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [saveDropdownOpen, setSaveDropdownOpen] = useState(false)
  const [savingTo, setSavingTo] = useState<string | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState(0)

  // Unit filters
  const [bedroomFilter, setBedroomFilter] = useState<number | null>(null)
  const [maxRent, setMaxRent] = useState<number | null>(null)

  // Filtered units
  const filteredUnits = useMemo(() => {
    if (!building) return []
    return building.units.filter((unit) => {
      // Bedroom filter
      if (bedroomFilter !== null) {
        if (bedroomFilter === 3) {
          if (unit.bedrooms < 3) return false
        } else if (unit.bedrooms !== bedroomFilter) {
          return false
        }
      }
      // Max rent filter
      if (maxRent !== null && unit.rentMin > maxRent) return false
      return true
    })
  }, [building, bedroomFilter, maxRent])

  useEffect(() => {
    // Fetch building data
    fetch(`/api/buildings/${id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`)
        }
        return res.json()
      })
      .then((data) => {
        if (data.building) {
          setBuilding(data.building)
        } else if (data.error) {
          setError(data.error)
        } else {
          setError('Invalid response from server')
        }
      })
      .catch((err) => {
        console.error('Failed to fetch building:', err)
        setError(err.message || 'Failed to load property')
      })
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
    if (!building) return
    setSavingTo(clientId)
    try {
      const res = await fetch(`/api/clients/${clientId}/buildings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buildingId: building.id }),
      })

      if (res.ok) {
        setClients((prev) =>
          prev.map((c) =>
            c.id === clientId
              ? { ...c, savedBuildings: [...(c.savedBuildings || []), { buildingId: building.id }] }
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
    if (!building) return
    setSavingTo(clientId)
    try {
      const res = await fetch(`/api/clients/${clientId}/buildings`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buildingId: building.id }),
      })

      if (res.ok) {
        setClients((prev) =>
          prev.map((c) =>
            c.id === clientId
              ? { ...c, savedBuildings: (c.savedBuildings || []).filter((b) => b.buildingId !== building.id) }
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

  const isBuildingSavedToClient = (clientId: string) => {
    if (!building) return false
    const client = clients.find((c) => c.id === clientId)
    return client?.savedBuildings?.some((b) => b.buildingId === building.id) || false
  }

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

  if (!building) {
    return (
      <div className="p-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>
        <div className="text-center py-16 bg-background rounded-xl border">
          <p className="text-lg font-medium mb-1">Property not found</p>
          <p className="text-muted-foreground">
            {error || 'This property may have been removed or is no longer available.'}
          </p>
          <Link
            href="/search"
            className="inline-block mt-4 text-sm font-medium text-foreground hover:underline"
          >
            Search for properties
          </Link>
        </div>
      </div>
    )
  }

  const allPhotos = [building.primaryPhotoUrl, ...building.photos].filter(Boolean) as string[]

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
            <h1 className="text-2xl font-bold">{building.name}</h1>
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
                <button
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setSaveDropdownOpen(false)}
                  aria-label="Close menu"
                  tabIndex={-1}
                />
                <div className="absolute right-0 top-full mt-2 w-64 bg-background rounded-lg border shadow-lg z-50" role="menu" aria-label="Save to client">
                  <div className="p-3 border-b">
                    <p className="text-sm font-medium">Save to client</p>
                  </div>
                  {clients.length > 0 ? (
                    <div className="max-h-64 overflow-y-auto">
                      {clients.map((client) => {
                        const isSaved = isBuildingSavedToClient(client.id)
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
          {(building.floorplansUrl || building.listingUrl) && (
            <a
              href={building.floorplansUrl || `${building.listingUrl?.replace(/\/$/, '')}/floorplans`}
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
          {/* Photo Gallery */}
          {allPhotos.length > 0 && (
            <div className="bg-background rounded-xl border overflow-hidden">
              <div className="aspect-video relative">
                <Image
                  src={allPhotos[selectedPhoto]}
                  alt={building.name}
                  fill
                  className="object-cover"
                />
              </div>
              {allPhotos.length > 1 && (
                <div className="p-3 flex gap-2 overflow-x-auto">
                  {allPhotos.map((photo, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedPhoto(i)}
                      className={cn(
                        'w-20 h-14 rounded-md overflow-hidden flex-shrink-0 border-2 transition-colors',
                        selectedPhoto === i ? 'border-foreground' : 'border-transparent hover:border-muted-foreground'
                      )}
                    >
                      <Image src={photo} alt="" width={80} height={56} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {building.rentMin && building.rentMax && (
              <div className="bg-background rounded-xl border p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xs">Rent Range</span>
                </div>
                <p className="font-bold">
                  ${building.rentMin.toLocaleString()} - ${building.rentMax.toLocaleString()}
                </p>
              </div>
            )}
            {building.rating && (
              <div className="bg-background rounded-xl border p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Star className="w-4 h-4" />
                  <span className="text-xs">Rating</span>
                </div>
                <p className="font-bold flex items-center gap-1">
                  {building.rating.toFixed(1)}
                  <span className="text-sm text-muted-foreground font-normal">
                    ({building.reviewCount} reviews)
                  </span>
                </p>
              </div>
            )}
            <div className="bg-background rounded-xl border p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Bed className="w-4 h-4" />
                <span className="text-xs">Bedrooms</span>
              </div>
              <p className="font-bold">{building.bedrooms.join(', ') || 'Various'}</p>
            </div>
            <div className="bg-background rounded-xl border p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Building2 className="w-4 h-4" />
                <span className="text-xs">Floor Plans</span>
              </div>
              <p className="font-bold">
                {filteredUnits.length}
                {(bedroomFilter !== null || maxRent !== null) && filteredUnits.length !== building.units.length && (
                  <span className="text-sm text-muted-foreground font-normal"> of {building.units.length}</span>
                )}
                {' '}available
              </p>
            </div>
          </div>

          {/* Floor Plans */}
          <div className="bg-background rounded-xl border">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold">Available Floor Plans</h2>
                {(bedroomFilter !== null || maxRent !== null) && (
                  <button
                    onClick={() => {
                      setBedroomFilter(null)
                      setMaxRent(null)
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear filters
                  </button>
                )}
              </div>
              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                {/* Bedroom Filter */}
                {[
                  { value: null, label: 'All' },
                  { value: 0, label: 'Studio' },
                  { value: 1, label: '1 BR' },
                  { value: 2, label: '2 BR' },
                  { value: 3, label: '3+ BR' },
                ].map((option) => (
                  <button
                    key={option.label}
                    onClick={() => setBedroomFilter(option.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                      bedroomFilter === option.value
                        ? 'bg-foreground text-background'
                        : 'bg-muted hover:bg-muted/80'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
                {/* Price Filter */}
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-sm text-muted-foreground">Max:</span>
                  <select
                    value={maxRent || ''}
                    onChange={(e) => setMaxRent(e.target.value ? parseInt(e.target.value) : null)}
                    className="px-2 py-1.5 rounded-lg text-sm bg-muted border-0 focus:ring-1 focus:ring-foreground"
                  >
                    <option value="">Any price</option>
                    <option value="1500">$1,500</option>
                    <option value="2000">$2,000</option>
                    <option value="2500">$2,500</option>
                    <option value="3000">$3,000</option>
                    <option value="3500">$3,500</option>
                    <option value="4000">$4,000</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="divide-y">
              {filteredUnits.map((unit) => (
                <div key={unit.id} className="p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-medium">{unit.name || <BedroomLabel bedrooms={unit.bedrooms} />}</h3>
                      {unit.availableCount > 0 && (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-xs font-medium">
                          {unit.availableCount} available
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Bed className="w-3.5 h-3.5" />
                        <span>{unit.bedrooms === 0 ? 'Studio' : `${unit.bedrooms} bed`}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Bath className="w-3.5 h-3.5" />
                        <span>{unit.bathrooms} bath</span>
                      </div>
                      {unit.sqftMin && unit.sqftMax && (
                        <div className="flex items-center gap-1">
                          <Maximize className="w-3.5 h-3.5" />
                          <span>
                            {unit.sqftMin === unit.sqftMax
                              ? `${unit.sqftMin.toLocaleString()} sq ft`
                              : `${unit.sqftMin.toLocaleString()} - ${unit.sqftMax.toLocaleString()} sq ft`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      ${unit.rentMin.toLocaleString()}
                      {unit.rentMin !== unit.rentMax && ` - $${unit.rentMax.toLocaleString()}`}
                    </p>
                    <p className="text-xs text-muted-foreground">/month</p>
                  </div>
                </div>
              ))}
              {filteredUnits.length === 0 && (
                <div className="p-6 text-center text-muted-foreground">
                  No floor plans match your filters
                </div>
              )}
            </div>
          </div>

          {/* Amenities */}
          {building.amenities.length > 0 && (
            <div className="bg-background rounded-xl border p-4">
              <h2 className="font-semibold mb-4">Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {building.amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>{AMENITY_LABELS[amenity] || amenity}</span>
                  </div>
                ))}
                {building.petPolicy && (
                  <div className="flex items-center gap-2 text-sm">
                    <PawPrint className="w-4 h-4 text-muted-foreground" />
                    <span>{building.petPolicy === 'dogs-allowed' ? 'Dogs Allowed' : building.petPolicy}</span>
                  </div>
                )}
                {building.parkingType && (
                  <div className="flex items-center gap-2 text-sm">
                    <Car className="w-4 h-4 text-muted-foreground" />
                    <span>{building.parkingType === 'garage' ? 'Garage Parking' : building.parkingType}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact */}
          <div className="bg-background rounded-xl border p-4">
            <h2 className="font-semibold mb-4">Contact</h2>
            <div className="space-y-3">
              {building.phone && (
                <a
                  href={`tel:${building.phone}`}
                  className="flex items-center gap-3 text-sm hover:text-foreground/80 transition-colors"
                >
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{building.phone}</span>
                </a>
              )}
              {building.website && (
                <a
                  href={building.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm hover:text-foreground/80 transition-colors"
                >
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span>Visit Website</span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </a>
              )}
            </div>
          </div>

          {/* Neighborhood */}
          <div className="bg-background rounded-xl border p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Neighborhood</h2>
              <Link
                href={`/neighborhood/${building.neighborhood.slug}`}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                View Details →
              </Link>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                <span className="text-lg font-bold">{building.neighborhood.grade}</span>
              </div>
              <div>
                <p className="font-medium">{building.neighborhood.name}</p>
                <p className="text-sm text-muted-foreground">
                  Score: {building.neighborhood.compositeScore.toFixed(0)}/100
                </p>
              </div>
            </div>

            {/* Walk/Transit/Bike Scores */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {building.neighborhood.walkScore && (
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <p className="text-lg font-bold">{building.neighborhood.walkScore}</p>
                  <p className="text-xs text-muted-foreground">Walk</p>
                </div>
              )}
              {building.neighborhood.transitScore && (
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <p className="text-lg font-bold">{building.neighborhood.transitScore}</p>
                  <p className="text-xs text-muted-foreground">Transit</p>
                </div>
              )}
              {building.neighborhood.bikeScore && (
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <p className="text-lg font-bold">{building.neighborhood.bikeScore}</p>
                  <p className="text-xs text-muted-foreground">Bike</p>
                </div>
              )}
            </div>

            {/* Highlights */}
            {building.neighborhood.highlights.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {building.neighborhood.highlights.slice(0, 4).map((highlight, i) => (
                  <span key={i} className="px-2 py-1 rounded-full bg-muted text-xs">
                    {highlight}
                  </span>
                ))}
              </div>
            )}
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
                <div>
                  <p className="font-medium">{building.management.name}</p>
                  {building.management.website && (
                    <a
                      href={building.management.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      Visit site →
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
