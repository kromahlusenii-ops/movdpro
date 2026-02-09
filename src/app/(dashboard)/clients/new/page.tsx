'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, ChevronDown, ChevronUp, Dog, Cat, Baby, Home, Car, MapPin, Plus, Check, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PRIORITIES, type PriorityId } from '@/lib/constants'
import { BuildingImage } from '@/components/BuildingImage'

const BEDROOM_OPTIONS = ['studio', '1br', '2br', '3br+']
const NEIGHBORHOODS = [
  'South End', 'NoDa', 'Plaza Midwood', 'Dilworth', 'Uptown',
  'Elizabeth', 'Myers Park', 'University City', 'Ballantyne', 'SouthPark'
]

const VIBES = [
  { value: 'urban-explorer', label: 'Urban Explorer' },
  { value: 'nightlife-lover', label: 'Nightlife' },
  { value: 'fitness-focused', label: 'Fitness Enthusiast' },
  { value: 'homebody', label: 'Family Friendly' },
  { value: 'foodie', label: 'Foodie' },
  { value: 'outdoorsy', label: 'Outdoor Adventurer' },
  { value: 'young-professional', label: 'Young Professional' },
  { value: 'remote-worker', label: 'Remote Worker' },
]

const COMMUTE_OPTIONS = [
  { value: 'walkable', label: 'Walkable' },
  { value: 'transit', label: 'Public Transit' },
  { value: 'driving', label: 'Driving' },
]

interface Recommendation {
  id: string
  name: string
  bedrooms: number
  bathrooms: number | null
  sqftMin: number | null
  sqftMax: number | null
  rentMin: number
  rentMax: number
  building: {
    id: string
    name: string
    address: string
    city: string
    state: string
    primaryPhotoUrl: string | null
    amenities: string[]
    rating: number | null
  }
  neighborhood: {
    name: string
    slug: string
  } | null
  matchScore: number
}

type Step = 'details' | 'recommendations'

export default function NewClientPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('details')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [clientId, setClientId] = useState<string | null>(null)

  // Client details
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [bedrooms, setBedrooms] = useState<string[]>([])
  const [neighborhoods, setNeighborhoods] = useState<string[]>([])
  const [notes, setNotes] = useState('')

  // Lifestyle preferences
  const [lifestyleOpen, setLifestyleOpen] = useState(false)
  const [vibes, setVibes] = useState<string[]>([])
  const [priorities, setPriorities] = useState<PriorityId[]>([])
  const [hasDog, setHasDog] = useState(false)
  const [hasCat, setHasCat] = useState(false)
  const [hasKids, setHasKids] = useState(false)
  const [worksFromHome, setWorksFromHome] = useState(false)
  const [needsParking, setNeedsParking] = useState(false)
  const [commuteAddress, setCommuteAddress] = useState('')
  const [commutePreference, setCommutePreference] = useState('')

  // Recommendations
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [selectedListings, setSelectedListings] = useState<string[]>([])
  const [savingListings, setSavingListings] = useState(false)

  const toggleBedroom = (bed: string) => {
    setBedrooms(prev =>
      prev.includes(bed) ? prev.filter(b => b !== bed) : [...prev, bed]
    )
  }

  const toggleNeighborhood = (hood: string) => {
    setNeighborhoods(prev =>
      prev.includes(hood) ? prev.filter(n => n !== hood) : [...prev, hood]
    )
  }

  const toggleVibe = (vibe: string) => {
    setVibes(prev =>
      prev.includes(vibe) ? prev.filter(v => v !== vibe) : [...prev, vibe]
    )
  }

  const togglePriority = (priority: PriorityId) => {
    setPriorities(prev => {
      if (prev.includes(priority)) {
        return prev.filter(p => p !== priority)
      }
      if (prev.length >= 3) {
        return prev
      }
      return [...prev, priority]
    })
  }

  const toggleListing = (listingId: string) => {
    setSelectedListings(prev =>
      prev.includes(listingId)
        ? prev.filter(id => id !== listingId)
        : [...prev, listingId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Create the client
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email: email || undefined,
          phone: phone || undefined,
          budgetMin: budgetMin ? parseInt(budgetMin) : undefined,
          budgetMax: budgetMax ? parseInt(budgetMax) : undefined,
          bedrooms,
          neighborhoods,
          notes: notes || undefined,
          vibes,
          priorities,
          hasDog,
          hasCat,
          hasKids,
          worksFromHome,
          needsParking,
          commuteAddress: commuteAddress || undefined,
          commutePreference: commutePreference || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create client')
      }

      setClientId(data.client.id)

      // Fetch recommendations
      const recsRes = await fetch('/api/clients/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budgetMin: budgetMin ? parseInt(budgetMin) : undefined,
          budgetMax: budgetMax ? parseInt(budgetMax) : undefined,
          bedrooms,
          neighborhoods,
          vibes,
          priorities,
          hasDog,
          hasCat,
          hasKids,
          worksFromHome,
          needsParking,
          commutePreference: commutePreference || undefined,
        }),
      })

      const recsData = await recsRes.json()

      if (recsRes.ok && recsData.recommendations?.length > 0) {
        setRecommendations(recsData.recommendations)
        setStep('recommendations')
      } else {
        // No recommendations, go directly to clients list
        router.push('/clients')
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveListings = async () => {
    if (!clientId || selectedListings.length === 0) {
      router.push('/clients')
      return
    }

    setSavingListings(true)

    try {
      // Save each selected listing to the client
      for (const listingId of selectedListings) {
        await fetch(`/api/clients/${clientId}/listings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listingId }),
        })
      }

      router.push(`/clients/${clientId}`)
      router.refresh()
    } catch (err) {
      console.error('Failed to save listings:', err)
      router.push('/clients')
      router.refresh()
    } finally {
      setSavingListings(false)
    }
  }

  const handleSkip = () => {
    router.push(clientId ? `/clients/${clientId}` : '/clients')
    router.refresh()
  }

  const formatRent = (min: number, max: number) => {
    if (min === max) return `$${min.toLocaleString()}`
    return `$${min.toLocaleString()} - $${max.toLocaleString()}`
  }

  const formatBedrooms = (beds: number) => {
    if (beds === 0) return 'Studio'
    if (beds === 1) return '1 BR'
    return `${beds} BR`
  }

  // Recommendations step
  if (step === 'recommendations') {
    return (
      <div className="p-8 max-w-4xl">
        {/* Back */}
        <button
          onClick={() => setStep('details')}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to details
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Recommended Listings</h1>
          <p className="text-muted-foreground">
            Based on {name}&apos;s preferences, here are some great matches. Select any you&apos;d like to add to their profile.
          </p>
        </div>

        {/* Recommendations list */}
        <div className="space-y-4 mb-8">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              onClick={() => toggleListing(rec.id)}
              className={cn(
                'border rounded-lg p-4 cursor-pointer transition-all',
                selectedListings.includes(rec.id)
                  ? 'border-foreground bg-foreground/5 ring-1 ring-foreground'
                  : 'border-border hover:border-foreground/30'
              )}
            >
              <div className="flex gap-4">
                {/* Image */}
                <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                  <BuildingImage
                    src={rec.building.primaryPhotoUrl}
                    alt={rec.building.name}
                    fill
                    className="object-cover"
                    iconSize="sm"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold truncate">{rec.building.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {rec.building.address}, {rec.building.city}
                      </p>
                    </div>
                    <div className={cn(
                      'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                      selectedListings.includes(rec.id)
                        ? 'bg-foreground border-foreground'
                        : 'border-muted-foreground/30'
                    )}>
                      {selectedListings.includes(rec.id) && (
                        <Check className="w-4 h-4 text-background" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm font-medium">{formatBedrooms(rec.bedrooms)}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatRent(rec.rentMin, rec.rentMax)}/mo
                    </span>
                    {rec.neighborhood && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {rec.neighborhood.name}
                      </span>
                    )}
                  </div>

                  {/* Match score */}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 max-w-32 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${rec.matchScore}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {rec.matchScore}% match
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t pt-6">
          <button
            onClick={handleSkip}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Skip for now
          </button>

          <div className="flex items-center gap-4">
            {selectedListings.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {selectedListings.length} selected
              </span>
            )}
            <button
              onClick={handleSaveListings}
              disabled={savingListings}
              className={cn(
                'px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2',
                selectedListings.length > 0
                  ? 'bg-foreground text-background hover:bg-foreground/90'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {savingListings && <Loader2 className="w-4 h-4 animate-spin" />}
              {selectedListings.length > 0 ? (
                <>
                  <Plus className="w-4 h-4" />
                  Add to Client
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  Continue
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Details step (original form)
  return (
    <div className="p-8 max-w-2xl">
      {/* Back */}
      <Link
        href="/clients"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to clients
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Add Client</h1>
        <p className="text-muted-foreground">
          Track a new client&apos;s requirements and find them the perfect place.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="John Smith"
            className="w-full px-4 py-3 rounded-lg border bg-background"
          />
        </div>

        {/* Contact */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="john@example.com"
              className="w-full px-4 py-3 rounded-lg border bg-background"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-2">
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full px-4 py-3 rounded-lg border bg-background"
            />
          </div>
        </div>

        {/* Budget */}
        <div>
          <label className="block text-sm font-medium mb-2">Budget</label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <input
                type="number"
                value={budgetMin}
                onChange={e => setBudgetMin(e.target.value)}
                placeholder="Min"
                className="w-full pl-8 pr-4 py-3 rounded-lg border bg-background"
              />
            </div>
            <span className="text-muted-foreground">to</span>
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <input
                type="number"
                value={budgetMax}
                onChange={e => setBudgetMax(e.target.value)}
                placeholder="Max"
                className="w-full pl-8 pr-4 py-3 rounded-lg border bg-background"
              />
            </div>
          </div>
        </div>

        {/* Bedrooms */}
        <div>
          <label className="block text-sm font-medium mb-2">Bedrooms</label>
          <div className="flex flex-wrap gap-2">
            {BEDROOM_OPTIONS.map(bed => (
              <button
                key={bed}
                type="button"
                onClick={() => toggleBedroom(bed)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  bedrooms.includes(bed)
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                {bed === 'studio' ? 'Studio' : bed === '3br+' ? '3+ BR' : bed.replace('br', ' BR')}
              </button>
            ))}
          </div>
        </div>

        {/* Neighborhoods */}
        <div>
          <label className="block text-sm font-medium mb-2">Preferred Neighborhoods</label>
          <div className="flex flex-wrap gap-2">
            {NEIGHBORHOODS.map(hood => (
              <button
                key={hood}
                type="button"
                onClick={() => toggleNeighborhood(hood)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  neighborhoods.includes(hood)
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                {hood}
              </button>
            ))}
          </div>
        </div>

        {/* Lifestyle Accordion */}
        <div className="border rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setLifestyleOpen(!lifestyleOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-muted/50 hover:bg-muted transition-colors"
          >
            <span className="font-medium">Lifestyle Preferences</span>
            {lifestyleOpen ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>

          {lifestyleOpen && (
            <div className="p-4 space-y-5 border-t">
              {/* Priorities */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  What Matters Most <span className="text-muted-foreground text-xs">(pick up to 3)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRIORITIES.map(priority => {
                    const isSelected = priorities.includes(priority.id)
                    const isDisabled = !isSelected && priorities.length >= 3
                    return (
                      <button
                        key={priority.id}
                        type="button"
                        onClick={() => togglePriority(priority.id)}
                        disabled={isDisabled}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5',
                          isSelected
                            ? 'bg-foreground text-background'
                            : 'bg-muted text-muted-foreground hover:text-foreground',
                          isDisabled && 'opacity-40 cursor-not-allowed'
                        )}
                      >
                        <span>{priority.icon}</span>
                        {priority.label}
                      </button>
                    )
                  })}
                </div>
                {priorities.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {priorities.length}/3 selected
                  </p>
                )}
              </div>

              {/* Vibes */}
              <div>
                <label className="block text-sm font-medium mb-2">Lifestyle Vibes</label>
                <div className="flex flex-wrap gap-2">
                  {VIBES.map(vibe => (
                    <button
                      key={vibe.value}
                      type="button"
                      onClick={() => toggleVibe(vibe.value)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                        vibes.includes(vibe.value)
                          ? 'bg-foreground text-background'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {vibe.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pets & Family */}
              <div>
                <label className="block text-sm font-medium mb-2">Pets & Family</label>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setHasDog(!hasDog)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      hasDog
                        ? 'bg-foreground text-background'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Dog className="w-4 h-4" />
                    Dog
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasCat(!hasCat)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      hasCat
                        ? 'bg-foreground text-background'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Cat className="w-4 h-4" />
                    Cat
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasKids(!hasKids)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      hasKids
                        ? 'bg-foreground text-background'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Baby className="w-4 h-4" />
                    Kids
                  </button>
                </div>
              </div>

              {/* Work & Parking */}
              <div>
                <label className="block text-sm font-medium mb-2">Work & Parking</label>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setWorksFromHome(!worksFromHome)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      worksFromHome
                        ? 'bg-foreground text-background'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Home className="w-4 h-4" />
                    Works from Home
                  </button>
                  <button
                    type="button"
                    onClick={() => setNeedsParking(!needsParking)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      needsParking
                        ? 'bg-foreground text-background'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Car className="w-4 h-4" />
                    Needs Parking
                  </button>
                </div>
              </div>

              {/* Commute */}
              <div>
                <label className="block text-sm font-medium mb-2">Commute</label>
                <div className="space-y-3">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={commuteAddress}
                      onChange={e => setCommuteAddress(e.target.value)}
                      placeholder="Work address (for commute matching)"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-background text-sm"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {COMMUTE_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setCommutePreference(
                          commutePreference === option.value ? '' : option.value
                        )}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                          commutePreference === option.value
                            ? 'bg-foreground text-background'
                            : 'bg-muted text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium mb-2">
            Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Any additional requirements or preferences..."
            className="w-full px-4 py-3 rounded-lg border bg-background resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading || !name}
            className="px-6 py-3 rounded-lg font-semibold bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Finding Matches...' : 'Add Client'}
          </button>
          <Link
            href="/clients"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
