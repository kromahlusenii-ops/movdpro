'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getCachedListings, setCachedListings, type CachedListing } from '@/lib/listings-client-cache'
import Link from 'next/link'
import { SearchableDropdown } from '@/components/SearchableDropdown'
import { LiveRegion } from '@/components/ui/live-region'
import { Search, MapPin, Bed, DollarSign, Star, X, UserPlus, Check, ExternalLink, Building2, Bath, Ruler, ChevronLeft, ChevronRight, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  sectionAttr,
  stateAttr,
  filterStateAttr,
  SECTION_TYPES,
  STATE_TYPES,
} from '@/lib/ai-readability'

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
  hasDeals: boolean
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

const GRADE_LABELS: Record<string, string> = {
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
    hasDeals: false,
  })

  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [compareList, setCompareList] = useState<string[]>([])
  const [saveDropdownId, setSaveDropdownId] = useState<string | null>(null)
  const [savingTo, setSavingTo] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusMessage, setStatusMessage] = useState('')
  const pageSize = 20
  const saveDropdownRef = useRef<HTMLDivElement>(null)

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

  // Load listings on mount with shared cache
  useEffect(() => {
    const initialBatchSize = 8

    // Check if we have preloaded/cached data
    const cached = getCachedListings()
    if (cached) {
      setListings(cached.listings as Listing[])
      setTotal(cached.total)
      setHasSearched(true)
      setStatusMessage(`${cached.total} listings loaded`)
      return
    }

    const loadInitialListings = async () => {
      setLoading(true)
      setStatusMessage('Loading listings...')
      try {
        const params = new URLSearchParams()
        params.set('limit', String(initialBatchSize))
        params.set('offset', '0')
        const res = await fetch(`/api/listings?${params.toString()}`)
        const data = await res.json()

        if (res.ok) {
          setListings(data.listings)
          setTotal(data.total)
          setHasSearched(true)
          setLoading(false)
          setStatusMessage(`${data.total} listings found`)

          if (data.total > initialBatchSize) {
            const remainingParams = new URLSearchParams()
            remainingParams.set('limit', String(pageSize - initialBatchSize))
            remainingParams.set('offset', String(initialBatchSize))
            remainingParams.set('skipCount', 'true')

            const remainingRes = await fetch(`/api/listings?${remainingParams.toString()}`)
            const remainingData = await remainingRes.json()

            if (remainingRes.ok && remainingData.listings) {
              const allListings = [...data.listings, ...remainingData.listings]
              setListings(allListings)
              setCachedListings(allListings, data.total)
            }
          } else {
            setCachedListings(data.listings, data.total)
          }
        }
      } catch (error) {
        console.error('Failed to load initial listings:', error)
        setLoading(false)
        setStatusMessage('Failed to load listings')
      }
    }
    loadInitialListings()
  }, [])

  const fetchListings = useCallback(async (pageNum: number, resetPage = false, skipCount = false) => {
    setLoading(true)
    setHasSearched(true)
    setStatusMessage('Searching...')

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
      if (filters.hasDeals) {
        params.set('hasDeals', 'true')
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
        if (data.total !== -1) {
          setTotal(data.total)
        }
        if (resetPage) {
          setPage(1)
        }
        setStatusMessage(`${data.total !== -1 ? data.total : 'Multiple'} listings found`)
      }
    } catch (error) {
      console.error('Search error:', error)
      setStatusMessage('Search failed')
    } finally {
      setLoading(false)
    }
  }, [filters])

  const handleSearch = useCallback(() => {
    setPage(1)
    fetchListings(1, true)
  }, [fetchListings])

  const initialLoadComplete = useRef(false)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!initialLoadComplete.current) {
      initialLoadComplete.current = true
      return
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      setPage(1)
      fetchListings(1, true)
    }, 300)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [filters, fetchListings])

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
    fetchListings(newPage, false, true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setStatusMessage(`Showing page ${newPage}`)
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
        setStatusMessage('Property removed from comparison')
        return prev.filter(i => i !== id)
      }
      if (prev.length >= 3) {
        setStatusMessage('Maximum 3 properties can be compared')
        return prev
      }
      setStatusMessage('Property added to comparison')
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
        const client = clients.find(c => c.id === clientId)
        setStatusMessage(`Saved to ${client?.name || 'client'}`)
      }
    } catch (error) {
      console.error('Save error:', error)
      setStatusMessage('Failed to save listing')
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
        const client = clients.find(c => c.id === clientId)
        setStatusMessage(`Removed from ${client?.name || 'client'}`)
      }
    } catch (error) {
      console.error('Remove error:', error)
      setStatusMessage('Failed to remove listing')
    } finally {
      setSavingTo(null)
      setSaveDropdownId(null)
    }
  }

  const isListingSavedToClient = (clientId: string, listingId: string) => {
    const client = clients.find(c => c.id === clientId)
    return client?.savedListings?.some(l => l.listingId === listingId) || false
  }

  // Handle escape key for save dropdown
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && saveDropdownId) {
        setSaveDropdownId(null)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [saveDropdownId])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="p-6">
      {/* Live region for screen reader announcements */}
      <LiveRegion mode="polite">
        {statusMessage}
      </LiveRegion>

      {/* Header */}
      <header className="mb-4">
        <h1 className="text-xl font-bold">Search Listings</h1>
        <p className="text-sm text-muted-foreground">Find available units to share with your clients</p>
      </header>

      {/* Filters */}
      <section
        aria-label="Search filters"
        className="bg-background rounded-xl border p-4 mb-6"
        {...sectionAttr(SECTION_TYPES.SEARCH_FILTERS)}
        {...(hasSearched ? filterStateAttr({
          neighborhoods: filters.neighborhoods,
          budgetMin: filters.budgetMin,
          budgetMax: filters.budgetMax,
          bedrooms: filters.bedrooms,
          buildings: filters.buildings,
          hasDeals: filters.hasDeals,
        }) : {})}
      >
        <div className="flex flex-wrap items-end gap-3">
          {/* Neighborhoods Dropdown */}
          <div className="w-52">
            <SearchableDropdown
              options={NEIGHBORHOOD_OPTIONS}
              selected={filters.neighborhoods}
              onChange={setNeighborhoods}
              placeholder="All areas"
              searchable={true}
              multiple={true}
              label="Neighborhoods"
              id="neighborhoods-filter"
            />
          </div>

          {/* Bedrooms Dropdown */}
          <div className="w-36">
            <SearchableDropdown
              options={BEDROOM_OPTIONS}
              selected={filters.bedrooms}
              onChange={setBedrooms}
              placeholder="Any"
              searchable={false}
              multiple={true}
              label="Bedrooms"
              id="bedrooms-filter"
            />
          </div>

          {/* Buildings Dropdown */}
          <div className="w-52">
            <SearchableDropdown
              options={buildingOptions}
              selected={filters.buildings}
              onChange={setBuildings}
              placeholder="All buildings"
              searchable={true}
              multiple={true}
              label="Building"
              id="buildings-filter"
            />
          </div>

          {/* Budget Min */}
          <div className="w-28">
            <label htmlFor="budget-min" className="block text-xs font-medium text-muted-foreground mb-1.5">
              Min Rent
            </label>
            <div className="relative">
              <DollarSign
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                id="budget-min"
                type="number"
                value={filters.budgetMin}
                onChange={e => setFilters(prev => ({ ...prev, budgetMin: parseInt(e.target.value) || 0 }))}
                className="w-full pl-7 pr-2 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                placeholder="1000"
                aria-describedby="budget-hint"
              />
            </div>
          </div>

          {/* Budget Max */}
          <div className="w-28">
            <label htmlFor="budget-max" className="block text-xs font-medium text-muted-foreground mb-1.5">
              Max Rent
            </label>
            <div className="relative">
              <DollarSign
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                id="budget-max"
                type="number"
                value={filters.budgetMax}
                onChange={e => setFilters(prev => ({ ...prev, budgetMax: parseInt(e.target.value) || 0 }))}
                className="w-full pl-7 pr-2 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                placeholder="3000"
              />
            </div>
          </div>
          <span id="budget-hint" className="sr-only">Enter monthly rent amount in dollars</span>

          {/* Active Deals Toggle */}
          <div className="flex items-center">
            <button
              onClick={() => setFilters(prev => ({ ...prev, hasDeals: !prev.hasDeals }))}
              aria-pressed={filters.hasDeals}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                filters.hasDeals
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                  : 'bg-background border-border text-muted-foreground hover:text-foreground hover:border-foreground/20'
              )}
            >
              <Tag className="w-4 h-4" aria-hidden="true" />
              Active Deals
              {filters.hasDeals && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
            </button>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground" aria-live="polite">
              <div
                className="w-4 h-4 border-2 border-muted border-t-foreground rounded-full animate-spin"
                aria-hidden="true"
              />
              <span>Filtering...</span>
            </div>
          )}
        </div>

        {/* Active Filters Summary */}
        {(filters.neighborhoods.length > 0 || filters.bedrooms.length > 0 || filters.buildings.length > 0 || filters.hasDeals) && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t" role="region" aria-label="Active filters">
            <span className="text-xs text-muted-foreground">Filters:</span>
            {filters.neighborhoods.map(hood => (
              <span
                key={hood}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs"
              >
                {hood}
                <button
                  onClick={() => setNeighborhoods(filters.neighborhoods.filter(n => n !== hood))}
                  aria-label={`Remove ${hood} filter`}
                  className="hover:text-foreground/70 focus:outline-none focus:ring-1 focus:ring-ring rounded"
                >
                  <X className="w-3 h-3" aria-hidden="true" />
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
                    aria-label={`Remove ${opt?.label || bed} filter`}
                    className="hover:text-foreground/70 focus:outline-none focus:ring-1 focus:ring-ring rounded"
                  >
                    <X className="w-3 h-3" aria-hidden="true" />
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
                    aria-label={`Remove ${opt?.label || buildingId} filter`}
                    className="hover:text-emerald-900 focus:outline-none focus:ring-1 focus:ring-ring rounded"
                  >
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                </span>
              )
            })}
            {filters.hasDeals && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs">
                <Tag className="w-3 h-3" aria-hidden="true" />
                Active Deals
                <button
                  onClick={() => setFilters(prev => ({ ...prev, hasDeals: false }))}
                  aria-label="Remove active deals filter"
                  className="hover:text-emerald-900 focus:outline-none focus:ring-1 focus:ring-ring rounded"
                >
                  <X className="w-3 h-3" aria-hidden="true" />
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setNeighborhoods([])
                setBedrooms([])
                setBuildings([])
                setFilters(prev => ({ ...prev, hasDeals: false }))
                setStatusMessage('All filters cleared')
              }}
              className="text-xs text-muted-foreground hover:text-foreground underline focus:outline-none focus:ring-2 focus:ring-ring rounded"
            >
              Clear all
            </button>
          </div>
        )}
      </section>

      {/* Compare Bar */}
      {compareList.length > 0 && (
        <div
          className="fixed bottom-0 left-64 right-0 bg-background border-t p-3 flex items-center justify-between z-50"
          role="region"
          aria-label="Property comparison"
        >
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground">{compareList.length} selected:</span>
            <div className="flex gap-1.5" role="list">
              {compareList.map(id => {
                const listing = listings.find(l => l.building.id === id)
                return listing ? (
                  <div key={id} role="listitem" className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded-full text-xs">
                    <span className="max-w-32 truncate">
                      {listing.building.name}
                    </span>
                    <button
                      onClick={() => toggleCompare(id)}
                      aria-label={`Remove ${listing.building.name} from comparison`}
                      className="hover:text-foreground/70 focus:outline-none focus:ring-1 focus:ring-ring rounded"
                    >
                      <X className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </div>
                ) : null
              })}
            </div>
          </div>
          <Link
            href={`/compare?ids=${compareList.join(',')}`}
            className="px-4 py-1.5 rounded-lg text-sm font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            Compare {compareList.length} properties
          </Link>
        </div>
      )}

      {/* Results */}
      {hasSearched && (
        <section
          aria-label="Search results"
          {...sectionAttr(SECTION_TYPES.RESULTS_LIST)}
          {...(loading ? stateAttr(STATE_TYPES.LOADING) : listings.length === 0 ? stateAttr(STATE_TYPES.EMPTY) : stateAttr(STATE_TYPES.LOADED))}
          data-total={total}
          data-page={page}
          data-page-size={pageSize}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground" aria-live="polite" aria-atomic="true">
              {total} {total === 1 ? 'listing' : 'listings'} found
            </p>
          </div>

          {listings.length > 0 ? (
            <ul className="grid gap-3" aria-label="Listings">
              {listings.map(listing => (
                <li key={listing.id}>
                  <article
                    className="bg-background rounded-lg border p-3 flex gap-3 hover:border-foreground/20 transition-colors"
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
                    <Link href={`/listing/${listing.id}`} className="flex-1 min-w-0">
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            {/* Unit + Building Name */}
                            <h2 id={`listing-title-${listing.id}`} className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-lg">
                                {listing.unitNumber || formatBedrooms(listing.bedrooms)}
                              </span>
                              <span className="text-muted-foreground">at</span>
                              <span className="font-semibold truncate">
                                {listing.building.name}
                              </span>
                              {listing.hasActiveDeals && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-medium flex-shrink-0 flex items-center gap-0.5">
                                  <Tag className="w-2.5 h-2.5" aria-hidden="true" />
                                  <span>Special</span>
                                </span>
                              )}
                              {listing.management && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-medium flex-shrink-0">
                                  {listing.management.name}
                                </span>
                              )}
                            </h2>
                            {/* Address + Neighborhood */}
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                              <MapPin className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                              <span className="truncate">{listing.building.address}</span>
                              <span className="text-muted-foreground/50" aria-hidden="true">·</span>
                              <span className="flex-shrink-0">{listing.neighborhood.name}</span>
                              <span
                                className="px-1 py-0.5 rounded bg-muted text-[10px] font-medium flex-shrink-0"
                                title={`Neighborhood grade: ${listing.neighborhood.grade} - ${GRADE_LABELS[listing.neighborhood.grade] || 'Unrated'}`}
                              >
                                <span className="sr-only">Neighborhood grade: </span>
                                {listing.neighborhood.grade}
                                <span className="sr-only"> - {GRADE_LABELS[listing.neighborhood.grade] || 'Unrated'}</span>
                              </span>
                            </div>
                          </div>
                          {/* Price */}
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-xl">
                              <span className="sr-only">Monthly rent: </span>
                              ${listing.rentMin.toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">/month</p>
                          </div>
                        </div>

                        {/* Unit Details */}
                        <dl className="flex items-center gap-4 mt-2 text-sm">
                          <div className="flex items-center gap-1.5">
                            <Bed className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                            <dt className="sr-only">Bedrooms:</dt>
                            <dd>{formatBedrooms(listing.bedrooms)}</dd>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Bath className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                            <dt className="sr-only">Bathrooms:</dt>
                            <dd>{listing.bathrooms} Bath</dd>
                          </div>
                          {listing.sqftMin && (
                            <div className="flex items-center gap-1.5">
                              <Ruler className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                              <dt className="sr-only">Square feet:</dt>
                              <dd>{listing.sqftMin.toLocaleString()} sqft</dd>
                            </div>
                          )}
                          {listing.building.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-amber-500 fill-amber-500" aria-hidden="true" />
                              <dt className="sr-only">Rating:</dt>
                              <dd>
                                {listing.building.rating.toFixed(1)}
                                {listing.building.reviewCount && (
                                  <span className="text-muted-foreground"> ({listing.building.reviewCount} reviews)</span>
                                )}
                              </dd>
                            </div>
                          )}
                        </dl>

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
                          className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                          aria-label={`View floorplans for ${listing.building.name} (opens in new tab)`}
                        >
                          <ExternalLink className="w-3 h-3" aria-hidden="true" />
                          Floorplans
                        </a>
                      )}

                      <button
                        onClick={() => toggleCompare(listing.building.id)}
                        disabled={!compareList.includes(listing.building.id) && compareList.length >= 3}
                        aria-pressed={compareList.includes(listing.building.id)}
                        className={cn(
                          'px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
                          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                          compareList.includes(listing.building.id)
                            ? 'bg-foreground text-background'
                            : 'bg-muted text-muted-foreground hover:text-foreground disabled:opacity-50'
                        )}
                        aria-label={compareList.includes(listing.building.id)
                          ? `Remove ${listing.building.name} from comparison`
                          : `Add ${listing.building.name} to comparison`
                        }
                      >
                        {compareList.includes(listing.building.id) ? 'Selected' : 'Compare'}
                      </button>

                      {/* Save to Client Dropdown */}
                      <div className="relative" ref={saveDropdownId === listing.id ? saveDropdownRef : null}>
                        <button
                          onClick={() => setSaveDropdownId(saveDropdownId === listing.id ? null : listing.id)}
                          aria-expanded={saveDropdownId === listing.id}
                          aria-haspopup="menu"
                          aria-label={`Save ${listing.building.name} to client`}
                          className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                          <UserPlus className="w-3 h-3" aria-hidden="true" />
                          Save
                        </button>

                        {saveDropdownId === listing.id && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setSaveDropdownId(null)}
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
                                            ? removeFromClient(client.id, listing.id)
                                            : saveToClient(client.id, listing.id)
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
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-10 bg-background rounded-lg border" role="status">
              <p className="text-muted-foreground text-sm">No listings match your criteria.</p>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or expanding your budget range.</p>
            </div>
          )}

          {/* Pagination */}
          {total > pageSize && (
            <nav
              className="flex items-center justify-center mt-6 pt-4 border-t"
              aria-label="Pagination"
              {...sectionAttr(SECTION_TYPES.PAGINATION)}
              data-current-page={page}
              data-total-pages={totalPages}
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1 || loading}
                  aria-label="Go to previous page"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                  Previous
                </button>
                <div className="flex items-center gap-1" role="group" aria-label="Page numbers">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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

                    const isCurrent = page === pageNum

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        disabled={loading}
                        aria-label={`Page ${pageNum}${isCurrent ? ', current page' : ''}`}
                        aria-current={isCurrent ? 'page' : undefined}
                        className={cn(
                          'w-8 h-8 rounded-lg text-sm font-medium transition-colors disabled:opacity-50',
                          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                          isCurrent
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
                  disabled={page >= totalPages || loading}
                  aria-label="Go to next page"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </nav>
          )}
        </section>
      )}

      {/* Initial Loading State */}
      {!hasSearched && loading && (
        <div className="text-center py-12 bg-background rounded-lg border" role="status" aria-live="polite">
          <div
            className="w-10 h-10 mx-auto mb-3 border-2 border-muted border-t-foreground rounded-full animate-spin"
            aria-hidden="true"
          />
          <p className="font-medium mb-1">Loading listings...</p>
          <p className="text-sm text-muted-foreground">
            Fetching available units in Charlotte
          </p>
        </div>
      )}

      {/* Spacer for compare bar */}
      {compareList.length > 0 && <div className="h-16" aria-hidden="true" />}
    </div>
  )
}
