'use client'

import { useState } from 'react'
import { cn, formatCurrency } from '@/lib/utils'
import { Plus, Trash2, Star, GripVertical, ChevronDown, ChevronUp } from 'lucide-react'
import type { ReportFormData, ReportProperty, SavedListing, SavedBuilding } from './types'

type PropertiesStepProps = {
  formData: ReportFormData
  savedListings: SavedListing[]
  savedBuildings: SavedBuilding[]
  onUpdate: (updates: Partial<ReportFormData>) => void
  onNext: () => void
  onBack: () => void
}

const GRADIENTS = [
  'from-blue-400 to-blue-600',
  'from-emerald-400 to-emerald-600',
  'from-amber-400 to-amber-600',
  'from-purple-400 to-purple-600',
  'from-rose-400 to-rose-600',
]

function PropertyCard({
  property,
  index,
  onUpdate,
  onRemove,
  onToggleRecommended,
}: {
  property: ReportProperty
  index: number
  onUpdate: (updates: Partial<ReportProperty>) => void
  onRemove: () => void
  onToggleRecommended: () => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const gradient = GRADIENTS[index % GRADIENTS.length]

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100">
        <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" aria-hidden="true" />

        {/* Thumbnail */}
        <div className="relative w-16 h-12 rounded-lg overflow-hidden flex-shrink-0">
          {property.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={property.imageUrl}
              alt={property.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradient}`} />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{property.name}</h3>
          <p className="text-sm text-gray-500 truncate">
            {property.neighborhood} &bull; {formatCurrency(property.rent)}/mo
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleRecommended}
            className={cn(
              'p-2 rounded-lg transition-colors',
              property.isRecommended
                ? 'bg-amber-100 text-amber-600'
                : 'hover:bg-gray-100 text-gray-400'
            )}
            aria-label={property.isRecommended ? 'Remove top pick' : 'Mark as top pick'}
            aria-pressed={property.isRecommended}
          >
            <Star
              className="w-4 h-4"
              fill={property.isRecommended ? 'currentColor' : 'none'}
              aria-hidden="true"
            />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
          <button
            onClick={onRemove}
            className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"
            aria-label={`Remove ${property.name}`}
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="p-4 bg-gray-50 space-y-4">
          {/* Basic Info Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label htmlFor={`prop-${index}-rent`} className="block text-xs text-gray-500 mb-1">Rent</label>
              <input
                id={`prop-${index}-rent`}
                type="number"
                value={property.rent}
                onChange={(e) => onUpdate({ rent: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
              />
            </div>
            <div>
              <label htmlFor={`prop-${index}-beds`} className="block text-xs text-gray-500 mb-1">Beds</label>
              <input
                id={`prop-${index}-beds`}
                type="number"
                value={property.bedrooms}
                onChange={(e) => onUpdate({ bedrooms: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
              />
            </div>
            <div>
              <label htmlFor={`prop-${index}-baths`} className="block text-xs text-gray-500 mb-1">Baths</label>
              <input
                id={`prop-${index}-baths`}
                type="number"
                step="0.5"
                value={property.bathrooms}
                onChange={(e) =>
                  onUpdate({ bathrooms: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
              />
            </div>
            <div>
              <label htmlFor={`prop-${index}-sqft`} className="block text-xs text-gray-500 mb-1">Sqft</label>
              <input
                id={`prop-${index}-sqft`}
                type="number"
                value={property.sqft || ''}
                onChange={(e) =>
                  onUpdate({ sqft: e.target.value ? parseInt(e.target.value) : null })
                }
                className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
              />
            </div>
          </div>

          {/* Availability */}
          <div>
            <label htmlFor={`prop-${index}-available`} className="block text-xs text-gray-500 mb-1">Available Date</label>
            <input
              id={`prop-${index}-available`}
              type="text"
              value={property.availableDate || ''}
              onChange={(e) => onUpdate({ availableDate: e.target.value || null })}
              placeholder="Jan 15"
              className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
            />
          </div>

          {/* Locator Note */}
          <div>
            <label htmlFor={`prop-${index}-note`} className="block text-xs text-gray-500 mb-1">Your Note (shown to client)</label>
            <textarea
              id={`prop-${index}-note`}
              value={property.locatorNote || ''}
              onChange={(e) => onUpdate({ locatorNote: e.target.value || null })}
              placeholder="Great option for dog owners - has a dog park nearby!"
              rows={2}
              className="w-full px-3 py-2 rounded-lg border bg-white text-sm resize-none"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default function PropertiesStep({
  formData,
  savedListings,
  savedBuildings,
  onUpdate,
  onNext,
  onBack,
}: PropertiesStepProps) {
  const [showImport, setShowImport] = useState(
    formData.properties.length === 0 && (savedListings.length > 0 || savedBuildings.length > 0)
  )

  const addProperty = (property: ReportProperty) => {
    onUpdate({
      properties: [...formData.properties, { ...property, sortOrder: formData.properties.length }],
    })
  }

  const updateProperty = (index: number, updates: Partial<ReportProperty>) => {
    const updated = [...formData.properties]
    updated[index] = { ...updated[index], ...updates }
    onUpdate({ properties: updated })
  }

  const removeProperty = (index: number) => {
    const updated = formData.properties.filter((_, i) => i !== index)
    // Recalculate sort orders
    updated.forEach((p, i) => (p.sortOrder = i))
    onUpdate({ properties: updated })
  }

  const importFromSavedListings = () => {
    const newProperties: ReportProperty[] = []

    // Import from saved individual listings
    savedListings.forEach((saved, index) => {
      const { unit } = saved
      const { building } = unit

      newProperties.push({
        buildingId: building.id,
        unitId: unit.id,
        name: building.name,
        address: building.address,
        neighborhood: building.neighborhood.name,
        imageUrl: building.primaryPhotoUrl,
        rent: unit.rentMin,
        bedrooms: unit.bedrooms,
        bathrooms: unit.bathrooms,
        sqft: unit.sqftMin,
        availableDate: unit.availableDate
          ? new Date(unit.availableDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })
          : null,
        amenities: building.amenities,
        walkScore: building.neighborhood.walkScore,
        isRecommended: false,
        locatorNote: saved.notes,
        sortOrder: index,
        deposit: null,
        adminFee: null,
        petDeposit: null,
        petRent: null,
        promos: null,
      })
    })

    // Import from saved buildings
    savedBuildings.forEach((saved) => {
      const { building } = saved
      const firstUnit = building.units[0]

      if (firstUnit) {
        newProperties.push({
          buildingId: building.id,
          unitId: null,
          name: building.name,
          address: building.address,
          neighborhood: building.neighborhood.name,
          imageUrl: building.primaryPhotoUrl,
          rent: firstUnit.rentMin,
          bedrooms: firstUnit.bedrooms,
          bathrooms: firstUnit.bathrooms,
          sqft: firstUnit.sqftMin,
          availableDate: firstUnit.availableDate
            ? new Date(firstUnit.availableDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })
            : null,
          amenities: building.amenities,
          walkScore: building.neighborhood.walkScore,
          isRecommended: false,
          locatorNote: saved.notes,
          sortOrder: newProperties.length,
          deposit: null,
          adminFee: null,
          petDeposit: null,
          petRent: null,
          promos: null,
        })
      }
    })

    onUpdate({ properties: newProperties })
    setShowImport(false)
  }

  const addManualProperty = () => {
    addProperty({
      buildingId: null,
      unitId: null,
      name: '',
      address: '',
      neighborhood: '',
      imageUrl: null,
      rent: 0,
      bedrooms: 1,
      bathrooms: 1,
      sqft: null,
      availableDate: null,
      amenities: [],
      walkScore: null,
      isRecommended: false,
      locatorNote: null,
      sortOrder: formData.properties.length,
      deposit: null,
      adminFee: null,
      petDeposit: null,
      petRent: null,
      promos: null,
    })
  }

  const totalSaved = savedListings.length + savedBuildings.length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Properties</h2>
        <p className="text-muted-foreground text-sm">
          Add the properties you want to recommend to your client.
        </p>
      </div>

      {/* Import from saved */}
      {showImport && totalSaved > 0 && (
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="font-medium text-blue-900">
                Import from {formData.clientName}&apos;s saved listings
              </p>
              <p className="text-sm text-blue-700 mt-1">
                {totalSaved} saved listing{totalSaved !== 1 ? 's' : ''} available
              </p>
            </div>
            <button
              onClick={importFromSavedListings}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Import All
            </button>
            <button
              onClick={() => setShowImport(false)}
              className="px-4 py-2 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Properties list */}
      <div className="space-y-3">
        {formData.properties.map((property, index) => (
          <PropertyCard
            key={property.buildingId || index}
            property={property}
            index={index}
            onUpdate={(updates) => updateProperty(index, updates)}
            onRemove={() => removeProperty(index)}
            onToggleRecommended={() =>
              updateProperty(index, { isRecommended: !property.isRecommended })
            }
          />
        ))}
      </div>

      {/* Add property button */}
      <button
        onClick={addManualProperty}
        className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Add Property Manually
      </button>

      {/* Empty state */}
      {formData.properties.length === 0 && !showImport && (
        <div className="text-center py-8 text-gray-500">
          <p>No properties added yet.</p>
          <p className="text-sm mt-1">
            Add properties manually or{' '}
            <button
              onClick={() => setShowImport(true)}
              className="text-blue-600 hover:underline"
            >
              import from saved listings
            </button>
            .
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={formData.properties.length === 0}
          className="px-6 py-3 rounded-lg font-semibold bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
        >
          Next: Neighborhoods
        </button>
      </div>
    </div>
  )
}
