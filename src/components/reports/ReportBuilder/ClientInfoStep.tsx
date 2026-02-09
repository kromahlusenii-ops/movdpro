'use client'

import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { Client, ReportFormData } from './types'

type ClientInfoStepProps = {
  clients: Client[]
  formData: ReportFormData
  onUpdate: (updates: Partial<ReportFormData>) => void
  onNext: () => void
}

const PRIORITY_OPTIONS = [
  'Dog-friendly',
  'In-unit laundry',
  'Walkable',
  'Pool',
  'Gym',
  'Parking',
  'Safe neighborhood',
  'Near transit',
  'Quiet',
  'Modern finishes',
]

export default function ClientInfoStep({
  clients,
  formData,
  onUpdate,
  onNext,
}: ClientInfoStepProps) {
  // Auto-populate from selected client
  useEffect(() => {
    if (formData.clientId) {
      const client = clients.find((c) => c.id === formData.clientId)
      if (client) {
        const budgetStr =
          client.budgetMin && client.budgetMax
            ? `$${client.budgetMin.toLocaleString()} - $${client.budgetMax.toLocaleString()}`
            : client.budgetMax
              ? `Up to $${client.budgetMax.toLocaleString()}`
              : ''

        const moveDateStr = client.moveInDate
          ? new Date(client.moveInDate).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })
          : ''

        onUpdate({
          clientName: client.name,
          clientBudget: budgetStr,
          clientMoveDate: moveDateStr,
          clientPriorities: client.priorities || [],
          title: `${client.name}'s Apartment Options`,
        })
      }
    }
  }, [formData.clientId, clients, onUpdate])

  const togglePriority = (priority: string) => {
    const current = formData.clientPriorities || []
    const updated = current.includes(priority)
      ? current.filter((p) => p !== priority)
      : [...current, priority]
    onUpdate({ clientPriorities: updated })
  }

  const isValid = formData.clientId && formData.title

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Client Information</h2>
        <p className="text-muted-foreground text-sm">
          Select a client and customize the report header.
        </p>
      </div>

      {/* Client Selection */}
      <div>
        <label htmlFor="client" className="block text-sm font-medium mb-2">
          Client <span className="text-red-500">*</span>
        </label>
        <select
          id="client"
          value={formData.clientId}
          onChange={(e) => onUpdate({ clientId: e.target.value })}
          className="w-full px-4 py-3 rounded-lg border bg-background"
        >
          <option value="">Select a client...</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      {/* Report Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-2">
          Report Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="John's Apartment Options"
          className="w-full px-4 py-3 rounded-lg border bg-background"
        />
      </div>

      {/* Locator Name */}
      <div>
        <label htmlFor="locatorName" className="block text-sm font-medium mb-2">
          Your Name (for the report header)
        </label>
        <input
          id="locatorName"
          type="text"
          value={formData.locatorName}
          onChange={(e) => onUpdate({ locatorName: e.target.value })}
          placeholder="Sarah Johnson"
          className="w-full px-4 py-3 rounded-lg border bg-background"
        />
      </div>

      {/* Budget */}
      <div>
        <label htmlFor="budget" className="block text-sm font-medium mb-2">
          Client Budget
        </label>
        <input
          id="budget"
          type="text"
          value={formData.clientBudget}
          onChange={(e) => onUpdate({ clientBudget: e.target.value })}
          placeholder="$1,500 - $2,000"
          className="w-full px-4 py-3 rounded-lg border bg-background"
        />
      </div>

      {/* Move Date */}
      <div>
        <label htmlFor="moveDate" className="block text-sm font-medium mb-2">
          Target Move Date
        </label>
        <input
          id="moveDate"
          type="text"
          value={formData.clientMoveDate}
          onChange={(e) => onUpdate({ clientMoveDate: e.target.value })}
          placeholder="March 2025"
          className="w-full px-4 py-3 rounded-lg border bg-background"
        />
      </div>

      {/* Priorities */}
      <div>
        <label className="block text-sm font-medium mb-2">Client Priorities</label>
        <p className="text-sm text-muted-foreground mb-3">
          Select what&apos;s most important to your client.
        </p>
        <div className="flex flex-wrap gap-2">
          {PRIORITY_OPTIONS.map((priority) => (
            <button
              key={priority}
              type="button"
              onClick={() => togglePriority(priority)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                formData.clientPriorities?.includes(priority)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {priority}
            </button>
          ))}
        </div>
      </div>

      {/* Next Button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={onNext}
          disabled={!isValid}
          className="px-6 py-3 rounded-lg font-semibold bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
        >
          Next: Add Properties
        </button>
      </div>
    </div>
  )
}
