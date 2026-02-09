'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { SearchableDropdown } from '@/components/SearchableDropdown'
import { BuildingImage } from '@/components/BuildingImage'
import { Search, MapPin, Bed, DollarSign, Star, X, UserPlus, Check, ExternalLink, Building2, Bath, Ruler, ChevronLeft, ChevronRight } from 'lucide-react'
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
  isAvailable: boolean
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

interface Client {
  id: string
  name: string
  savedListings?: { listingId: string }[]
}

interface SearchFilters {
  neighborhoods: string[]
  budgetMin: number
  budgetMax: number
  bedrooms: string[]
  buildings: string[]
}

const NEIGHBORHOOD_OPTIONS = [
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

const BEDROOM_OPTIONS = [
  { value: 'studio', label: 'Studio' },
  { value: '1br', label: '1 BR' },
  { value: '2br', label: '2 BR' },
  { value: '3br+', label: '3+ BR' },
]

function formatBedrooms(bedrooms: number): string {
  if (bedrooms === 0) return 'Studio'
  if (bedrooms === 1) return '1 BR'
  if (bedrooms === 2) return '2 BR'
  return `${bedrooms} BR`
}

export default function ProSearchPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [buildingOptions, setBuildingOptions] = useState<{ value: string; label: string }[]>([])
  const [filters, setFilters] = useState<SearchFilters>({
    neighborhoods: [],
    budgetMin: 1000,
    budgetMax: 3000,
    bedrooms: [],
    buildings: [],
  })

  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [compareList, setCompareList] = useState<string[]>([])
  const [saveDropdownId, setSaveDropdownId] = useState<string | null>(null)
  const [savingTo, setSavingTo] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 20

  // Fetch clients and buildings on mount
  useEffect(() => {
    fetch('/api/clients')
      .then(res => res.json())
      .then(data => {
        if (data.clients) {
          setClients(data.clients.filter((c: Client & { status: string }) => c.status === 'active'))
        }
      })
      .catch(console.error)

    // Fetch buildings for the dropdown (API max is 100)
    fetch('/api/buildings?limit=100')
      .then(res => res.json())
      .then(data => {
        if (data.buildings) {
          setBuildingOptions(
            data.buildings.map((b: { id: string; name: string }) => ({
              value: b.id,
              label: b.name,
            }))
          )
        }
      })
      .catch(console.error)
  }, [])

  // Load listings on mount (no filters)
  useEffect(() => {
    const loadInitialListings = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('limit', String(pageSize))
        params.set('offset', '0')
        const res = await fetch(`/api/listings?${params.toString()}`)
        const data = await res.json()
        if (res.ok) {
          setListings(data.listings)
          setTotal(data.total)
          setHasSearched(true)
        }
      } catch (error) {
        console.error('Failed to load initial listings:', error)
      } finally {
        setLoading(false)
      }
    }
    loadInitialListings()
  }, [])

  const fetchListings = useCallback(async (pageNum: number, resetPage = false, skipCount = false) => {
    setLoading(true)
    setHasSearched(true)

    try {
      const params = new URLSearchParams()
      if (filters.neighborhoods.length > 0) {
        params.set('neighborhoods', filters.neighborhoods.join(','))
      }
      if (filters.budgetMin) {
        params.set('budgetMin', String(filters.budgetMin))
      }
      if (filters.budgetMax) {
        params.set('budgetMax', String(filters.budgetMax))
      }
      if (filters.bedrooms.length > 0) {
        params.set('bedrooms', filters.bedrooms.join(','))
      }
      if (filters.buildings.length > 0) {
        params.set('buildings', filters.buildings.join(','))
      }
      params.set('limit', String(pageSize))
      params.set('offset', String((pageNum - 1) * pageSize))
      if (skipCount) {
        params.set('skipCount', 'true')
      }

      const res = await fetch(`/api/listings?${params.toString()}`)
      const data = await res.json()

      if (res.ok) {
        setListings(data.listings)
        // Only update total when we actually counted
        if (data.total !== -1) {
          setTotal(data.total)
        }
        if (resetPage) {
          setPage(1)
        }
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }, [filters])

  const handleSearch = useCallback(() => {
    setPage(1)
    fetchListings(1, true)
  }, [fetchListings])

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
    fetchListings(newPage, false, true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [fetchListings])

  const setNeighborhoods = (neighborhoods: string[]) => {
    setFilters(prev => ({ ...prev, neighborhoods }))
  }

  const setBedrooms = (bedrooms: string[]) => {
    setFilters(prev => ({ ...prev, bedrooms }))
  }

  const setBuildings = (buildings: string[]) => {
    setFilters(prev => ({ ...prev, buildings }))
  }

  const toggleCompare = (id: string) => {
    setCompareList(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id)
      }
      if (prev.length >= 3) {
        return prev
      }
      return [...prev, id]
    })
  }

  const saveToClient = async (clientId: string, listingId: string) => {
    setSavingTo(clientId)
    try {
      const res = await fetch(`/api/clients/${clientId}/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId }),
      })

      if (res.ok) {
        setClients(prev =>
          prev.map(c =>
            c.id === clientId
              ? { ...c, savedListings: [...(c.savedListings || []), { listingId }] }
              : c
          )
        )
      }
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setSavingTo(null)
      setSaveDropdownId(null)
    }
  }

  const removeFromClient = async (clientId: string, listingId: string) => {
    setSavingTo(clientId)
    try {
      const res = await fetch(`/api/clients/${clientId}/listings`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId }),
      })

      if (res.ok) {
        setClients(prev =>
          prev.map(c =>
            c.id === clientId
              ? { ...c, savedListings: (c.savedListings || []).filter(l => l.listingId !== listingId) }
              : c
          )
        )
      }
    } catch (error) {
      console.error('Remove error:', error)
    } finally {
      setSavingTo(null)
      setSaveDropdownId(null)
    }
  }

  const isListingSavedToClient = (clientId: string, listingId: string) => {
    const client = clients.find(c => c.id === clientId)
    return client?.savedListings?.some(l => l.listingId === listingId) || false
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold">Search Listings</h1>
        <p className="text-sm text-muted-foreground">Find available units to share with your clients</p>
      </div>

      {/* Filters - Compact Horizontal Layout */}
      <div className="bg-background rounded-xl border p-4 mb-6">
        <div className="flex flex-wrap items-end gap-3">
          {/* Neighborhoods Dropdown */}
          <div className="w-52">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Neighborhoods</label>
            <SearchableDropdown
              options={NEIGHBORHOOD_OPTIONS}
              selected={filters.neighborhoods}
              onChange={setNeighborhoods}
              placeholder="All areas"
              searchable={true}
              multiple={true}
            />
          </div>

          {/* Bedrooms Dropdown */}
          <div className="w-36">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Bedrooms</label>
            <SearchableDropdown
              options={BEDROOM_OPTIONS}
              selected={filters.bedrooms}
              onChange={setBedrooms}
              placeholder="Any"
              searchable={false}
              multiple={true}
            />
          </div>

          {/* Buildings Dropdown */}
          <div className="w-52">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Building</label>
            <SearchableDropdown
              options={buildingOptions}
              selected={filters.buildings}
              onChange={setBuildings}
              placeholder="All buildings"
              searchable={true}
              multiple={true}
            />
          </div>

          {/* Budget Min */}
          <div className="w-28">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Min Rent</label>
            <div className="relative">
              <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="number"
                value={filters.budgetMin}
                onChange={e => setFilters(prev => ({ ...prev, budgetMin: parseInt(e.target.value) || 0 }))}
                className="w-full pl-7 pr-2 py-2 rounded-lg border bg-background text-sm"
                placeholder="1000"
              />
            </div>
          </div>

          {/* Budget Max */}
          <div className="w-28">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Max Rent</label>
            <div className="relative">
              <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="number"
                value={filters.budgetMax}
                onChange={e => setFilters(prev => ({ ...prev, budgetMax: parseInt(e.target.value) || 0 }))}
                className="w-full pl-7 pr-2 py-2 rounded-lg border bg-background text-sm"
                placeholder="3000"
              />
            </div>
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-5 py-2 rounded-lg font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
          >
            <Search className="w-4 h-4" />
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Active Filters Summary */}
        {(filters.neighborhoods.length > 0 || filters.bedrooms.length > 0 || filters.buildings.length > 0) && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t">
            <span className="text-xs text-muted-foreground">Filters:</span>
            {filters.neighborhoods.map(hood => (
              <span
                key={hood}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs"
              >
                {hood}
                <button
                  onClick={() => setNeighborhoods(filters.neighborhoods.filter(n => n !== hood))}
                  className="hover:text-foreground/70"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {filters.bedrooms.map(bed => {
              const opt = BEDROOM_OPTIONS.find(o => o.value === bed)
              return (
                <span
                  key={bed}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs"
                >
                  {opt?.label || bed}
                  <button
                    onClick={() => setBedrooms(filters.bedrooms.filter(b => b !== bed))}
                    className="hover:text-foreground/70"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )
            })}
            {filters.buildings.map(buildingId => {
              const opt = buildingOptions.find(o => o.value === buildingId)
              return (
                <span
                  key={buildingId}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs"
                >
                  {opt?.label || buildingId}
                  <button
                    onClick={() => setBuildings(filters.buildings.filter(b => b !== buildingId))}
                    className="hover:text-emerald-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )
            })}
            <button
              onClick={() => {
                setNeighborhoods([])
                setBedrooms([])
                setBuildings([])
              }}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Compare Bar */}
      {compareList.length > 0 && (
        <div className="fixed bottom-0 left-64 right-0 bg-background border-t p-3 flex items-center justify-between z-50">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground">{compareList.length} selected:</span>
            <div className="flex gap-1.5">
              {compareList.map(id => {
                const listing = listings.find(l => l.building.id === id)
                return listing ? (
                  <div key={id} className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded-full text-xs">
                    <span className="max-w-32 truncate">
                      {listing.building.name}
                    </span>
                    <button onClick={() => toggleCompare(id)} className="hover:text-foreground/70">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : null
              })}
            </div>
          </div>
          <Link
            href={`/compare?ids=${compareList.join(',')}`}
            className="px-4 py-1.5 rounded-lg text-sm font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
          >
            Compare
          </Link>
        </div>
      )}

      {/* Results */}
      {hasSearched && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">
              {total} {total === 1 ? 'listing' : 'listings'} found
            </p>
          </div>

          {listings.length > 0 ? (
            <div className="grid gap-3">
              {listings.map(listing => (
                <div
                  key={listing.id}
                  className="bg-background rounded-lg border p-3 flex gap-3 hover:border-foreground/20 transition-colors"
                >
                  {/* Clickable area - Photo + Info */}
                  <Link href={`/listing/${listing.id}`} className="flex gap-3 flex-1 min-w-0">
                    {/* Photo */}
                    <div className="w-36 h-24 rounded-md bg-muted flex-shrink-0 overflow-hidden">
                      <BuildingImage
                        src={listing.building.primaryPhotoUrl}
                        alt={listing.building.name}
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
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">
                              {listing.unitNumber || formatBedrooms(listing.bedrooms)}
                            </span>
                            <span className="text-muted-foreground">at</span>
                            <span className="font-semibold truncate">
                              {listing.building.name}
                            </span>
                            {listing.management && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-medium flex-shrink-0">
                                {listing.management.name}
                              </span>
                            )}
                          </div>
                          {/* Address + Neighborhood */}
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{listing.building.address}</span>
                            <span className="text-muted-foreground/50">·</span>
                            <span className="flex-shrink-0">{listing.neighborhood.name}</span>
                            <span className="px-1 py-0.5 rounded bg-muted text-[10px] font-medium flex-shrink-0">
                              {listing.neighborhood.grade}
                            </span>
                          </div>
                        </div>
                        {/* Price */}
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-xl">${listing.rentMin.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">/month</p>
                        </div>
                      </div>

                      {/* Unit Details */}
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Bed className="w-4 h-4 text-muted-foreground" />
                          <span>{formatBedrooms(listing.bedrooms)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Bath className="w-4 h-4 text-muted-foreground" />
                          <span>{listing.bathrooms} Bath</span>
                        </div>
                        {listing.sqftMin && (
                          <div className="flex items-center gap-1.5">
                            <Ruler className="w-4 h-4 text-muted-foreground" />
                            <span>{listing.sqftMin.toLocaleString()} sqft</span>
                          </div>
                        )}
                        {listing.building.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <span>{listing.building.rating.toFixed(1)}</span>
                            {listing.building.reviewCount && (
                              <span className="text-muted-foreground">({listing.building.reviewCount})</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Amenities */}
                      {listing.building.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
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
                    </div>
                  </Link>

                  {/* Actions */}
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    {/* View Floorplans Button */}
                    {(listing.building.floorplansUrl || listing.building.listingUrl) && (
                      <a
                        href={listing.building.floorplansUrl || `${listing.building.listingUrl?.replace(/\/$/, '')}/floorplans`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Floorplans
                      </a>
                    )}

                    <button
                      onClick={() => toggleCompare(listing.building.id)}
                      disabled={!compareList.includes(listing.building.id) && compareList.length >= 3}
                      className={cn(
                        'px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
                        compareList.includes(listing.building.id)
                          ? 'bg-foreground text-background'
                          : 'bg-muted text-muted-foreground hover:text-foreground disabled:opacity-50'
                      )}
                    >
                      {compareList.includes(listing.building.id) ? 'Selected' : 'Compare'}
                    </button>

                    {/* Save to Client Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setSaveDropdownId(saveDropdownId === listing.id ? null : listing.id)}
                        className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                      >
                        <UserPlus className="w-3 h-3" />
                        Save
                      </button>

                      {saveDropdownId === listing.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setSaveDropdownId(null)} />
                          <div className="absolute right-0 top-full mt-1 w-56 bg-background rounded-lg border shadow-lg z-50">
                            <div className="p-2 border-b">
                              <p className="text-xs font-medium text-muted-foreground">Save to client</p>
                            </div>
                            {clients.length > 0 ? (
                              <div className="max-h-48 overflow-y-auto">
                                {clients.map(client => {
                                  const isSaved = isListingSavedToClient(client.id, listing.id)
                                  return (
                                    <button
                                      key={client.id}
                                      onClick={() =>
                                        isSaved
                                          ? removeFromClient(client.id, listing.id)
                                          : saveToClient(client.id, listing.id)
                                      }
                                      disabled={savingTo === client.id}
                                      className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted transition-colors disabled:opacity-50"
                                    >
                                      <span>{client.name}</span>
                                      {isSaved && <Check className="w-4 h-4 text-emerald-600" />}
                                    </button>
                                  )
                                })}
                              </div>
                            ) : (
                              <div className="p-3 text-center">
                                <p className="text-sm text-muted-foreground mb-2">No clients yet</p>
                                <Link
                                  href="/clients/new"
                                  className="text-sm font-medium text-foreground hover:underline"
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
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-background rounded-lg border">
              <p className="text-muted-foreground text-sm">No listings match your criteria.</p>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or expanding your budget range.</p>
            </div>
          )}

          {/* Pagination */}
          {total > pageSize && (
            <div className="flex items-center justify-center mt-6 pt-4 border-t">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1 || loading}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, Math.ceil(total / pageSize)) }, (_, i) => {
                    const totalPages = Math.ceil(total / pageSize)
                    let pageNum: number

                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (page <= 3) {
                      pageNum = i + 1
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = page - 2 + i
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        disabled={loading}
                        className={cn(
                          'w-8 h-8 rounded-lg text-sm font-medium transition-colors disabled:opacity-50',
                          page === pageNum
                            ? 'bg-foreground text-background'
                            : 'bg-muted text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= Math.ceil(total / pageSize) || loading}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Initial Loading State */}
      {!hasSearched && loading && (
        <div className="text-center py-12 bg-background rounded-lg border">
          <div className="w-10 h-10 mx-auto mb-3 border-2 border-muted border-t-foreground rounded-full animate-spin" />
          <p className="font-medium mb-1">Loading listings...</p>
          <p className="text-sm text-muted-foreground">
            Fetching available units in Charlotte
          </p>
        </div>
      )}
    </div>
  )
}
