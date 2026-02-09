'use client'

import { useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import type { ReportFormData, ReportNeighborhood, Neighborhood } from './types'

type NeighborhoodsStepProps = {
  formData: ReportFormData
  allNeighborhoods: Neighborhood[]
  onUpdate: (updates: Partial<ReportFormData>) => void
  onNext: () => void
  onBack: () => void
}

function NeighborhoodCard({
  neighborhood,
  onUpdate,
  onRemove,
}: {
  neighborhood: ReportNeighborhood
  onUpdate: (updates: Partial<ReportNeighborhood>) => void
  onRemove: () => void
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-4">
        <h3 className="font-medium text-gray-900">{neighborhood.name}</h3>
        <button
          onClick={onRemove}
          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Vibe / Character</label>
          <input
            type="text"
            value={neighborhood.vibe || ''}
            onChange={(e) => onUpdate({ vibe: e.target.value || null })}
            placeholder="Trendy, walkable, foodie paradise"
            className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Walkability</label>
          <input
            type="text"
            value={neighborhood.walkability || ''}
            onChange={(e) => onUpdate({ walkability: e.target.value || null })}
            placeholder="Walk Score: 85"
            className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Safety</label>
          <input
            type="text"
            value={neighborhood.safety || ''}
            onChange={(e) => onUpdate({ safety: e.target.value || null })}
            placeholder="Very safe, well-lit streets"
            className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Dog Friendly</label>
          <input
            type="text"
            value={neighborhood.dogFriendly || ''}
            onChange={(e) => onUpdate({ dogFriendly: e.target.value || null })}
            placeholder="Multiple dog parks, pet-friendly patios"
            className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
          />
        </div>
      </div>
    </div>
  )
}

export default function NeighborhoodsStep({
  formData,
  allNeighborhoods,
  onUpdate,
  onNext,
  onBack,
}: NeighborhoodsStepProps) {
  // Auto-populate neighborhoods from properties
  useEffect(() => {
    if (formData.neighborhoods.length === 0 && formData.properties.length > 0) {
      const neighborhoodNames = new Set(formData.properties.map((p) => p.neighborhood))
      const newNeighborhoods: ReportNeighborhood[] = []

      let sortOrder = 0
      neighborhoodNames.forEach((name) => {
        // Find the full neighborhood data if available
        const fullData = allNeighborhoods.find((n) => n.name === name)

        newNeighborhoods.push({
          neighborhoodId: fullData?.id || null,
          name,
          vibe: fullData?.tagline || null,
          walkability: fullData?.walkScore ? `Walk Score: ${fullData.walkScore}` : null,
          safety: fullData?.safetyScore
            ? `Safety: ${Math.round(fullData.safetyScore)}/100`
            : null,
          dogFriendly: null,
          sortOrder: sortOrder++,
        })
      })

      if (newNeighborhoods.length > 0) {
        onUpdate({ neighborhoods: newNeighborhoods })
      }
    }
  }, [formData.properties, formData.neighborhoods.length, allNeighborhoods, onUpdate])

  const updateNeighborhood = (index: number, updates: Partial<ReportNeighborhood>) => {
    const updated = [...formData.neighborhoods]
    updated[index] = { ...updated[index], ...updates }
    onUpdate({ neighborhoods: updated })
  }

  const removeNeighborhood = (index: number) => {
    const updated = formData.neighborhoods.filter((_, i) => i !== index)
    updated.forEach((n, i) => (n.sortOrder = i))
    onUpdate({ neighborhoods: updated })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Neighborhood Insights</h2>
        <p className="text-muted-foreground text-sm">
          Add helpful details about each neighborhood featured in the report.
        </p>
      </div>

      {/* Neighborhoods list */}
      <div className="space-y-4">
        {formData.neighborhoods.map((neighborhood, index) => (
          <NeighborhoodCard
            key={neighborhood.neighborhoodId || neighborhood.name}
            neighborhood={neighborhood}
            onUpdate={(updates) => updateNeighborhood(index, updates)}
            onRemove={() => removeNeighborhood(index)}
          />
        ))}
      </div>

      {/* Empty state */}
      {formData.neighborhoods.length === 0 && (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl">
          <p>No neighborhoods to display.</p>
          <p className="text-sm mt-1">
            Neighborhoods are automatically populated from the properties you add.
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
          className="px-6 py-3 rounded-lg font-semibold bg-foreground text-background hover:bg-foreground/90 transition-colors"
        >
          Next: Move-In Costs
        </button>
      </div>
    </div>
  )
}
