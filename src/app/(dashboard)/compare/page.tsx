'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, MapPin, Star, Check, X, FileText } from 'lucide-react'

interface Apartment {
  id: string
  name: string
  address: string
  neighborhood: {
    name: string
    slug: string
    grade: string
    walkScore: number | null
    transitScore: number | null
  }
  rentMin: number
  rentMax: number
  bedrooms: string[]
  bathrooms: number | null
  sqftMin: number | null
  sqftMax: number | null
  amenities: string[]
  rating: number | null
  reviewCount: number | null
  photoUrl: string | null
}

const AMENITY_LABELS: Record<string, string> = {
  pool: 'Pool',
  gym: 'Gym',
  parking: 'Parking',
  'pet-friendly': 'Pet Friendly',
  'in-unit-laundry': 'In-Unit Laundry',
  doorman: 'Doorman',
  rooftop: 'Rooftop',
  concierge: 'Concierge',
}

export default function ComparePage() {
  const searchParams = useSearchParams()
  const idsParam = searchParams.get('ids') || ''

  const [apartments, setApartments] = useState<Apartment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ids = idsParam ? idsParam.split(',').filter(Boolean) : []

    if (ids.length > 0) {
      fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.apartments) {
            setApartments(data.apartments)
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [idsParam])

  // Get all unique amenities across all apartments
  const allAmenities = [...new Set(apartments.flatMap(apt => apt.amenities))]

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">Compare Properties</h1>
            <p className="text-muted-foreground">
              {apartments.length} properties selected
            </p>
          </div>
          {apartments.length > 0 && (
            <Link
              href={`/reports/new?apartments=${idsParam}`}
              className="px-4 py-2.5 rounded-lg font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Create Report
            </Link>
          )}
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-pulse text-muted-foreground">Loading properties...</div>
          </div>
        ) : apartments.length === 0 ? (
          <div className="text-center py-16 bg-background rounded-xl border">
            <p className="text-lg font-medium mb-1">No properties selected</p>
            <p className="text-muted-foreground mb-6">
              Search for apartments and select up to 3 to compare.
            </p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
            >
              Go to Search
            </Link>
          </div>
        ) : (
          <div className="bg-background rounded-xl border overflow-hidden">
            {/* Property Headers */}
            <div className="grid" style={{ gridTemplateColumns: `200px repeat(${apartments.length}, 1fr)` }}>
              <div className="p-4 border-b border-r bg-muted/30" />
              {apartments.map(apt => (
                <div key={apt.id} className="p-4 border-b text-center">
                  <div className="w-full h-32 rounded-lg bg-muted mb-3 overflow-hidden">
                    {apt.photoUrl ? (
                      <Image
                        src={apt.photoUrl}
                        alt={apt.name}
                        width={300}
                        height={128}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                        No photo
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold">{apt.name}</h3>
                  <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="w-3 h-3" />
                    {apt.neighborhood.name}
                  </div>
                </div>
              ))}
            </div>

            {/* Rent */}
            <div className="grid" style={{ gridTemplateColumns: `200px repeat(${apartments.length}, 1fr)` }}>
              <div className="p-4 border-b border-r bg-muted/30 font-medium">Rent</div>
              {apartments.map(apt => (
                <div key={apt.id} className="p-4 border-b text-center">
                  <p className="font-bold text-lg">
                    ${apt.rentMin.toLocaleString()} - ${apt.rentMax.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">/month</p>
                </div>
              ))}
            </div>

            {/* Bedrooms */}
            <div className="grid" style={{ gridTemplateColumns: `200px repeat(${apartments.length}, 1fr)` }}>
              <div className="p-4 border-b border-r bg-muted/30 font-medium">Bedrooms</div>
              {apartments.map(apt => (
                <div key={apt.id} className="p-4 border-b text-center">
                  {apt.bedrooms.join(', ')}
                </div>
              ))}
            </div>

            {/* Size */}
            <div className="grid" style={{ gridTemplateColumns: `200px repeat(${apartments.length}, 1fr)` }}>
              <div className="p-4 border-b border-r bg-muted/30 font-medium">Size (sq ft)</div>
              {apartments.map(apt => (
                <div key={apt.id} className="p-4 border-b text-center">
                  {apt.sqftMin && apt.sqftMax
                    ? `${apt.sqftMin.toLocaleString()} - ${apt.sqftMax.toLocaleString()}`
                    : '—'}
                </div>
              ))}
            </div>

            {/* Rating */}
            <div className="grid" style={{ gridTemplateColumns: `200px repeat(${apartments.length}, 1fr)` }}>
              <div className="p-4 border-b border-r bg-muted/30 font-medium">Rating</div>
              {apartments.map(apt => (
                <div key={apt.id} className="p-4 border-b text-center">
                  {apt.rating ? (
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="font-medium">{apt.rating.toFixed(1)}</span>
                      {apt.reviewCount && (
                        <span className="text-sm text-muted-foreground">({apt.reviewCount})</span>
                      )}
                    </div>
                  ) : (
                    '—'
                  )}
                </div>
              ))}
            </div>

            {/* Neighborhood Grade */}
            <div className="grid" style={{ gridTemplateColumns: `200px repeat(${apartments.length}, 1fr)` }}>
              <div className="p-4 border-b border-r bg-muted/30 font-medium">Neighborhood Grade</div>
              {apartments.map(apt => (
                <div key={apt.id} className="p-4 border-b text-center">
                  <span className="px-2 py-1 rounded bg-muted font-medium">
                    {apt.neighborhood.grade}
                  </span>
                </div>
              ))}
            </div>

            {/* Walk Score */}
            <div className="grid" style={{ gridTemplateColumns: `200px repeat(${apartments.length}, 1fr)` }}>
              <div className="p-4 border-b border-r bg-muted/30 font-medium">Walk Score</div>
              {apartments.map(apt => (
                <div key={apt.id} className="p-4 border-b text-center">
                  {apt.neighborhood.walkScore ?? '—'}
                </div>
              ))}
            </div>

            {/* Transit Score */}
            <div className="grid" style={{ gridTemplateColumns: `200px repeat(${apartments.length}, 1fr)` }}>
              <div className="p-4 border-b border-r bg-muted/30 font-medium">Transit Score</div>
              {apartments.map(apt => (
                <div key={apt.id} className="p-4 border-b text-center">
                  {apt.neighborhood.transitScore ?? '—'}
                </div>
              ))}
            </div>

            {/* Amenities Section */}
            <div className="grid" style={{ gridTemplateColumns: `200px repeat(${apartments.length}, 1fr)` }}>
              <div className="p-4 border-b border-r bg-muted/30 font-semibold">Amenities</div>
              {apartments.map(apt => (
                <div key={apt.id} className="p-4 border-b" />
              ))}
            </div>

            {allAmenities.map(amenity => (
              <div
                key={amenity}
                className="grid"
                style={{ gridTemplateColumns: `200px repeat(${apartments.length}, 1fr)` }}
              >
                <div className="p-3 border-b border-r bg-muted/30 text-sm">
                  {AMENITY_LABELS[amenity] || amenity}
                </div>
                {apartments.map(apt => (
                  <div key={apt.id} className="p-3 border-b text-center">
                    {apt.amenities.includes(amenity) ? (
                      <Check className="w-5 h-5 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-muted-foreground/30 mx-auto" />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
  )
}
