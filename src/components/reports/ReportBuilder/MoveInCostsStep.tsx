'use client'

import { formatCurrency } from '@/lib/utils'
import type { ReportFormData, ReportProperty } from './types'

type MoveInCostsStepProps = {
  formData: ReportFormData
  onUpdate: (updates: Partial<ReportFormData>) => void
  onNext: () => void
  onBack: () => void
}

function PropertyCostCard({
  property,
  onUpdate,
}: {
  property: ReportProperty
  onUpdate: (updates: Partial<ReportProperty>) => void
}) {
  const total =
    property.rent +
    (property.deposit || 0) +
    (property.adminFee || 0) +
    (property.petDeposit || 0)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium text-gray-900">{property.name}</h3>
          <p className="text-sm text-gray-500">
            {formatCurrency(property.rent)}/mo rent
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Move-In Total</p>
          <p className="text-lg font-semibold text-gray-900">{formatCurrency(total)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Deposit</label>
          <input
            type="number"
            value={property.deposit || ''}
            onChange={(e) =>
              onUpdate({ deposit: e.target.value ? parseInt(e.target.value) : null })
            }
            placeholder="0"
            className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Admin Fee</label>
          <input
            type="number"
            value={property.adminFee || ''}
            onChange={(e) =>
              onUpdate({ adminFee: e.target.value ? parseInt(e.target.value) : null })
            }
            placeholder="0"
            className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Pet Deposit</label>
          <input
            type="number"
            value={property.petDeposit || ''}
            onChange={(e) =>
              onUpdate({ petDeposit: e.target.value ? parseInt(e.target.value) : null })
            }
            placeholder="0"
            className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Pet Rent/mo</label>
          <input
            type="number"
            value={property.petRent || ''}
            onChange={(e) =>
              onUpdate({ petRent: e.target.value ? parseInt(e.target.value) : null })
            }
            placeholder="0"
            className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
          />
        </div>
      </div>

      {/* Promos */}
      <div className="mt-3">
        <label className="block text-xs text-gray-500 mb-1">Move-In Specials</label>
        <input
          type="text"
          value={property.promos || ''}
          onChange={(e) => onUpdate({ promos: e.target.value || null })}
          placeholder="1 month free, waived admin fee, etc."
          className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
        />
      </div>
    </div>
  )
}

export default function MoveInCostsStep({
  formData,
  onUpdate,
  onNext,
  onBack,
}: MoveInCostsStepProps) {
  const updateProperty = (index: number, updates: Partial<ReportProperty>) => {
    const updated = [...formData.properties]
    updated[index] = { ...updated[index], ...updates }
    onUpdate({ properties: updated })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Move-In Costs</h2>
        <p className="text-muted-foreground text-sm">
          Add move-in costs and specials for each property.
        </p>
      </div>

      {/* Properties list */}
      <div className="space-y-4">
        {formData.properties.map((property, index) => (
          <PropertyCostCard
            key={property.buildingId || index}
            property={property}
            onUpdate={(updates) => updateProperty(index, updates)}
          />
        ))}
      </div>

      {/* Empty state */}
      {formData.properties.length === 0 && (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl">
          <p>No properties to show costs for.</p>
          <p className="text-sm mt-1">Go back and add some properties first.</p>
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
          Next: Preview & Publish
        </button>
      </div>
    </div>
  )
}
