'use client'

import { formatCurrency } from '@/lib/utils'
import { LocatorTakeSection } from './LocatorTakeSection'
import type { ReportPropertyNote } from '@/components/features/listing-notes/types'

type Property = {
  id: string
  name: string
  address: string
  neighborhood: string
  imageUrl: string | null
  rent: number
  bedrooms: number
  bathrooms: number
  sqft: number | null
  availableDate: string | null
  amenities: string[]
  walkScore: number | null
  isRecommended: boolean
  locatorNote: string | null
  sortOrder: number
  notes?: ReportPropertyNote[]
}

type PropertiesTabProps = {
  properties: Property[]
  priorities: string[]
}

const GRADIENTS = [
  'from-blue-400 to-blue-600',
  'from-emerald-400 to-emerald-600',
  'from-amber-400 to-amber-600',
  'from-purple-400 to-purple-600',
  'from-rose-400 to-rose-600',
]

function matchesPriority(property: Property, priority: string): boolean {
  const p = priority.toLowerCase()
  const amenities = property.amenities.map((a) => a.toLowerCase())

  if ((p.includes('dog') || p.includes('pet')) && amenities.some((a) => a.includes('dog') || a.includes('pet')))
    return true
  if (p.includes('laundry') && amenities.some((a) => a.includes('w/d') || a.includes('laundry') || a.includes('washer')))
    return true
  if (p.includes('walkable') && property.walkScore && property.walkScore >= 75) return true
  if (p.includes('pool') && amenities.some((a) => a.includes('pool'))) return true
  if (p.includes('gym') && amenities.some((a) => a.includes('gym') || a.includes('fitness'))) return true
  if (p.includes('parking') && amenities.some((a) => a.includes('parking') || a.includes('garage'))) return true

  return false
}

function PropertyCard({
  property,
  index,
  priorities,
}: {
  property: Property
  index: number
  priorities: string[]
}) {
  const gradient = GRADIENTS[index % GRADIENTS.length]
  const matchedPriorities = priorities.filter((p) => matchesPriority(property, p))

  return (
    <div className="bg-white rounded-2xl border border-[#e2e5ea] overflow-hidden">
      {/* Image or gradient placeholder */}
      <div className="relative h-48 md:h-56">
        {property.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={property.imageUrl}
            alt={property.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient}`}>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white/80 text-xl font-medium">
                {property.name.charAt(0)}
              </span>
            </div>
          </div>
        )}

        {/* Top Pick badge */}
        {property.isRecommended && (
          <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Top Pick
          </div>
        )}

        {/* Rent */}
        <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm text-gray-900 text-lg font-bold px-3 py-1.5 rounded-lg shadow-sm">
          {formatCurrency(property.rent)}/mo
        </div>
      </div>

      {/* Content */}
      <div className="p-5 md:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{property.name}</h3>
        <p className="text-sm text-gray-500 mb-4">
          {property.neighborhood} &bull; {property.address}
        </p>

        {/* Specs */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600 mb-4">
          <span>
            {property.bedrooms === 0 ? 'Studio' : `${property.bedrooms} bed`}
          </span>
          <span>{property.bathrooms} bath</span>
          {property.sqft && <span>{property.sqft.toLocaleString()} sqft</span>}
          {property.availableDate && (
            <span className="text-emerald-600">Available {property.availableDate}</span>
          )}
        </div>

        {/* Amenities */}
        {property.amenities.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {property.amenities.slice(0, 5).map((amenity) => (
              <span
                key={amenity}
                className="inline-block px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
              >
                {amenity}
              </span>
            ))}
            {property.amenities.length > 5 && (
              <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-500 text-xs rounded-md">
                +{property.amenities.length - 5} more
              </span>
            )}
          </div>
        )}

        {/* Priority matches */}
        {matchedPriorities.length > 0 && (
          <div className="mb-4">
            <p className="text-[11px] uppercase tracking-wide text-blue-600 font-medium mb-2">
              Matches Your Priorities
            </p>
            <div className="flex flex-wrap gap-2">
              {matchedPriorities.map((priority) => (
                <span
                  key={priority}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-md"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {priority}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Walk Score */}
        {property.walkScore && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Walk Score: {property.walkScore}
          </div>
        )}

        {/* Locator note */}
        {property.locatorNote && (
          <div className="pt-4 border-t border-gray-100">
            <p className="text-[11px] uppercase tracking-wide text-blue-600 font-medium mb-2">
              Locator&apos;s Note
            </p>
            <p className="text-sm text-gray-700 italic">&ldquo;{property.locatorNote}&rdquo;</p>
          </div>
        )}

        {/* Structured notes (pros/cons/notes) */}
        {property.notes && property.notes.length > 0 && (
          <LocatorTakeSection notes={property.notes} />
        )}
      </div>
    </div>
  )
}

export default function PropertiesTab({ properties, priorities }: PropertiesTabProps) {
  if (properties.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No properties added yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {properties.map((property, index) => (
        <PropertyCard
          key={property.id}
          property={property}
          index={index}
          priorities={priorities}
        />
      ))}
    </div>
  )
}
