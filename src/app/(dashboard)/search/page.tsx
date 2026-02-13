'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getCachedListings, setCachedListings, type CachedListing } from '@/lib/listings-client-cache'
import Link from 'next/link'
import { SearchableDropdown } from '@/components/SearchableDropdown'
import { LiveRegion } from '@/components/ui/live-region'
import { ListingCard } from '@/components/search/ListingCard'
import { BuildingSearchCard } from '@/components/search/BuildingSearchCard'
import { SearchPagination } from '@/components/search/SearchPagination'
import { QuickAddNotesModal } from '@/components/features/listing-notes/QuickAddNotesModal'
import { DollarSign, X, Check, Tag, Search, Building2, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  sectionAttr,
  stateAttr,
  filterStateAttr,
  SECTION_TYPES,
  STATE_TYPES,
} from '@/lib/ai-readability'
import {
  Listing,
  ClientSummary,
  SearchFilters,
  NEIGHBORHOOD_OPTIONS,
  BEDROOM_OPTIONS,
} from '@/types'

type SearchMode = 'listings' | 'buildings'

interface BuildingResult {
  id: string
  name: string
  address: string
  city: string
  state: string
  primaryPhotoUrl: string | null
  rating: number | null
  reviewCount: number | null
  unitCount: number
  rentMin: number | null
  rentMax: number | null
  bedrooms: string[]
  neighborhood: {
    name: string
    grade: string
  }
  management: {
    name: string
    logoUrl: string | null
  } | null
}

export default function ProSearchPage() {
  // Search mode
  const [searchMode, setSearchMode] = useState<SearchMode>('listings')

  // Building search state
  const [buildingSearchQuery, setBuildingSearchQuery] = useState('')
  const [buildingResults, setBuildingResults] = useState<BuildingResult[]>([])
  const [buildingSearchLoading, setBuildingSearchLoading] = useState(false)
  const [buildingTotal, setBuildingTotal] = useState(0)
  const [buildingPage, setBuildingPage] = useState(1)
  const [hasBuildingSearched, setHasBuildingSearched] = useState(false)
  const buildingSearchTimer = useRef<NodeJS.Timeout | null>(null)

  const [clients, setClients] = useState<ClientSummary[]>([])
  const [buildingOptions, setBuildingOptions] = useState<{ value: string; label: string; searchTerms?: string }[]>([])
  const [buildingsLoaded, setBuildingsLoaded] = useState(false)
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
  const [quickAddModal, setQuickAddModal] = useState<{
    clientId: string
    unitId: string
    buildingName: string
  } | null>(null)
  const pageSize = 20
  const saveDropdownRef = useRef<HTMLDivElement>(null)

  // Fetch clients on mount
  useEffect(() => {
    fetch('/api/clients')
      .then(res => res.json())
      .then(data => {
        if (data.clients) {
          setClients(data.clients.filter((c: ClientSummary & { status: string }) => c.status === 'active'))
        }
      })
      .catch(console.error)
  }, [])

  // Lazy load buildings when dropdown is focused
  const loadBuildings = useCallback(() => {
    if (buildingsLoaded) return

    setBuildingsLoaded(true)
    fetch('/api/buildings?limit=100')
      .then(res => res.json())
      .then(data => {
        if (data.buildings) {
          setBuildingOptions(
            data.buildings.map((b: { id: string; name: string; website?: string }) => ({
              value: b.id,
              label: b.name,
              searchTerms: b.website || undefined,
            }))
          )
        }
      })
      .catch(console.error)
  }, [buildingsLoaded])

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

        // Show quick add notes modal
        const listing = listings.find(l => l.id === listingId)
        if (listing) {
          setQuickAddModal({
            clientId,
            unitId: listingId,
            buildingName: listing.building.name,
          })
        }
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
  const buildingTotalPages = Math.ceil(buildingTotal / pageSize)

  // Building search function
  const searchBuildings = useCallback(async (query: string, pageNum: number = 1) => {
    setBuildingSearchLoading(true)
    setHasBuildingSearched(true)
    setStatusMessage('Searching buildings...')

    try {
      const params = new URLSearchParams()
      if (query.trim()) {
        params.set('q', query.trim())
      }
      params.set('limit', String(pageSize))
      params.set('offset', String((pageNum - 1) * pageSize))

      const res = await fetch(`/api/buildings?${params.toString()}`)
      const data = await res.json()

      if (res.ok) {
        setBuildingResults(data.buildings)
        setBuildingTotal(data.total)
        setStatusMessage(`${data.total} buildings found`)
      }
    } catch (error) {
      console.error('Building search error:', error)
      setStatusMessage('Building search failed')
    } finally {
      setBuildingSearchLoading(false)
    }
  }, [])

  // Debounced building search on query change
  useEffect(() => {
    if (searchMode !== 'buildings') return

    if (buildingSearchTimer.current) {
      clearTimeout(buildingSearchTimer.current)
    }

    buildingSearchTimer.current = setTimeout(() => {
      setBuildingPage(1)
      searchBuildings(buildingSearchQuery, 1)
    }, 300)

    return () => {
      if (buildingSearchTimer.current) {
        clearTimeout(buildingSearchTimer.current)
      }
    }
  }, [buildingSearchQuery, searchMode, searchBuildings])

  // Load initial buildings when switching to building mode
  useEffect(() => {
    if (searchMode === 'buildings' && !hasBuildingSearched) {
      searchBuildings('', 1)
    }
  }, [searchMode, hasBuildingSearched, searchBuildings])

  const handleBuildingPageChange = useCallback((newPage: number) => {
    setBuildingPage(newPage)
    searchBuildings(buildingSearchQuery, newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setStatusMessage(`Showing page ${newPage}`)
  }, [buildingSearchQuery, searchBuildings])

  return (
    <div className="p-6">
      {/* Live region for screen reader announcements */}
      <LiveRegion mode="polite">
        {statusMessage}
      </LiveRegion>

      {/* Header */}
      <header className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Search</h1>
            <p className="text-sm text-muted-foreground">
              {searchMode === 'listings'
                ? 'Find available units to share with your clients'
                : 'Search buildings by name, address, or neighborhood'}
            </p>
          </div>
        </div>

        {/* Search Mode Toggle */}
        <div className="flex mt-4 border-b">
          <button
            onClick={() => setSearchMode('listings')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              searchMode === 'listings'
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Home className="w-4 h-4" />
            Listings
          </button>
          <button
            onClick={() => setSearchMode('buildings')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              searchMode === 'buildings'
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Building2 className="w-4 h-4" />
            Buildings
          </button>
        </div>
      </header>

      {/* Building Search */}
      {searchMode === 'buildings' && (
        <section
          aria-label="Building search"
          className="bg-background rounded-xl border p-4 mb-6"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={buildingSearchQuery}
              onChange={(e) => setBuildingSearchQuery(e.target.value)}
              placeholder="Search by building name, address, or neighborhood..."
              className="w-full pl-10 pr-4 py-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
            {buildingSearchQuery && (
              <button
                onClick={() => setBuildingSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
          {buildingSearchLoading && (
            <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-muted border-t-foreground rounded-full animate-spin" />
              <span>Searching...</span>
            </div>
          )}
        </section>
      )}

      {/* Listing Filters */}
      {searchMode === 'listings' && (
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
              onFocus={loadBuildings}
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
      )}

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

      {/* Listing Results */}
      {searchMode === 'listings' && hasSearched && (
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
                  <ListingCard
                    listing={listing}
                    clients={clients}
                    compareList={compareList}
                    saveDropdownId={saveDropdownId}
                    savingTo={savingTo}
                    saveDropdownRef={saveDropdownRef}
                    onToggleCompare={toggleCompare}
                    onSaveDropdownToggle={setSaveDropdownId}
                    onSaveToClient={saveToClient}
                    onRemoveFromClient={removeFromClient}
                    isListingSavedToClient={isListingSavedToClient}
                  />
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
            <SearchPagination
              page={page}
              totalPages={totalPages}
              loading={loading}
              onPageChange={handlePageChange}
            />
          )}
        </section>
      )}

      {/* Building Results */}
      {searchMode === 'buildings' && hasBuildingSearched && (
        <section aria-label="Building search results">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground" aria-live="polite" aria-atomic="true">
              {buildingTotal} {buildingTotal === 1 ? 'building' : 'buildings'} found
            </p>
          </div>

          {buildingResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {buildingResults.map(building => (
                <BuildingSearchCard key={building.id} building={building} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-background rounded-lg border" role="status">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground text-sm">No buildings match your search.</p>
              <p className="text-xs text-muted-foreground mt-1">Try a different name, address, or neighborhood.</p>
            </div>
          )}

          {/* Building Pagination */}
          {buildingTotal > pageSize && (
            <SearchPagination
              page={buildingPage}
              totalPages={buildingTotalPages}
              loading={buildingSearchLoading}
              onPageChange={handleBuildingPageChange}
            />
          )}
        </section>
      )}

      {/* Initial Loading State */}
      {searchMode === 'listings' && !hasSearched && loading && (
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

      {/* Quick Add Notes Modal */}
      {quickAddModal && (
        <QuickAddNotesModal
          isOpen={true}
          onClose={() => setQuickAddModal(null)}
          clientId={quickAddModal.clientId}
          unitId={quickAddModal.unitId}
          buildingName={quickAddModal.buildingName}
        />
      )}
    </div>
  )
}
