'use client'

import { formatCurrency } from '@/lib/utils'

type Property = {
  id: string
  name: string
  rent: number
  deposit: number | null
  adminFee: number | null
  petDeposit: number | null
  petRent: number | null
  promos: string | null
}

type MoveInCostsTabProps = {
  properties: Property[]
}

function calculateTotal(property: Property): number {
  return (
    property.rent +
    (property.deposit || 0) +
    (property.adminFee || 0) +
    (property.petDeposit || 0)
  )
}

export default function MoveInCostsTab({ properties }: MoveInCostsTabProps) {
  if (properties.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No properties added yet.</p>
      </div>
    )
  }

  // Check if any property has move-in cost data
  const hasCostData = properties.some(
    (p) => p.deposit || p.adminFee || p.petDeposit || p.petRent || p.promos
  )

  return (
    <div className="space-y-6">
      {/* Desktop table view */}
      <div className="hidden md:block bg-white rounded-2xl border border-[#e2e5ea] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-[#e2e5ea]">
                <th className="text-left text-[11px] uppercase tracking-wide text-gray-500 font-medium px-6 py-4">
                  Property
                </th>
                <th className="text-right text-[11px] uppercase tracking-wide text-gray-500 font-medium px-4 py-4">
                  Rent
                </th>
                <th className="text-right text-[11px] uppercase tracking-wide text-gray-500 font-medium px-4 py-4">
                  Deposit
                </th>
                <th className="text-right text-[11px] uppercase tracking-wide text-gray-500 font-medium px-4 py-4">
                  Admin Fee
                </th>
                <th className="text-right text-[11px] uppercase tracking-wide text-gray-500 font-medium px-4 py-4">
                  Pet Deposit
                </th>
                <th className="text-right text-[11px] uppercase tracking-wide text-gray-500 font-medium px-4 py-4">
                  Pet Rent
                </th>
                <th className="text-right text-[11px] uppercase tracking-wide text-gray-500 font-medium px-6 py-4">
                  Move-In Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e5ea]">
              {properties.map((property) => (
                <tr key={property.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">{property.name}</span>
                    {property.promos && (
                      <span className="ml-2 inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded-full">
                        {property.promos}
                      </span>
                    )}
                  </td>
                  <td className="text-right px-4 py-4 text-gray-700">
                    {formatCurrency(property.rent)}
                  </td>
                  <td className="text-right px-4 py-4 text-gray-700">
                    {property.deposit ? formatCurrency(property.deposit) : '—'}
                  </td>
                  <td className="text-right px-4 py-4 text-gray-700">
                    {property.adminFee ? formatCurrency(property.adminFee) : '—'}
                  </td>
                  <td className="text-right px-4 py-4 text-gray-700">
                    {property.petDeposit ? formatCurrency(property.petDeposit) : '—'}
                  </td>
                  <td className="text-right px-4 py-4 text-gray-700">
                    {property.petRent ? `${formatCurrency(property.petRent)}/mo` : '—'}
                  </td>
                  <td className="text-right px-6 py-4 font-semibold text-gray-900">
                    {formatCurrency(calculateTotal(property))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-4">
        {properties.map((property) => (
          <div
            key={property.id}
            className="bg-white rounded-2xl border border-[#e2e5ea] p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-medium text-gray-900">{property.name}</h3>
              {property.promos && (
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded-full">
                  {property.promos}
                </span>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Monthly Rent</span>
                <span className="text-gray-900">{formatCurrency(property.rent)}</span>
              </div>
              {property.deposit && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Deposit</span>
                  <span className="text-gray-900">{formatCurrency(property.deposit)}</span>
                </div>
              )}
              {property.adminFee && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Admin Fee</span>
                  <span className="text-gray-900">{formatCurrency(property.adminFee)}</span>
                </div>
              )}
              {property.petDeposit && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Pet Deposit</span>
                  <span className="text-gray-900">{formatCurrency(property.petDeposit)}</span>
                </div>
              )}
              {property.petRent && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Pet Rent</span>
                  <span className="text-gray-900">{formatCurrency(property.petRent)}/mo</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
              <span className="font-medium text-gray-900">Move-In Total</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(calculateTotal(property))}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Note about estimates */}
      {hasCostData && (
        <p className="text-xs text-gray-400 text-center">
          Move-in costs are estimates. Actual costs may vary based on lease terms and specials.
        </p>
      )}

      {/* Empty state for no cost data */}
      {!hasCostData && (
        <div className="bg-gray-50 rounded-xl p-6 text-center">
          <p className="text-sm text-gray-500">
            Move-in cost details haven&apos;t been added yet. Contact your locator for specific
            pricing.
          </p>
        </div>
      )}
    </div>
  )
}
