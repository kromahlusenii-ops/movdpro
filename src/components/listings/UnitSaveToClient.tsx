'use client'

import { useState } from 'react'
import { UserPlus, Check, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Client {
  id: string
  name: string
  savedListings?: { listingId: string }[]
}

interface UnitSaveToClientProps {
  unitId: string
  clients: Client[]
  onSave: (clientId: string, unitId: string, notes?: string) => Promise<void>
  onRemove: (clientId: string, unitId: string) => Promise<void>
}

export function UnitSaveToClient({ unitId, clients, onSave, onRemove }: UnitSaveToClientProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [savingTo, setSavingTo] = useState<string | null>(null)
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState('')

  const isUnitSavedToClient = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId)
    return client?.savedListings?.some((sl) => sl.listingId === unitId) || false
  }

  const handleToggle = async (clientId: string) => {
    const isSaved = isUnitSavedToClient(clientId)
    setSavingTo(clientId)

    try {
      if (isSaved) {
        await onRemove(clientId, unitId)
      } else {
        await onSave(clientId, unitId, notes || undefined)
      }
      setNotes('')
    } finally {
      setSavingTo(null)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-muted transition-colors"
        aria-label="Add to client"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <UserPlus className="w-4 h-4 text-muted-foreground" />
      </button>

      {isOpen && (
        <>
          <button
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => {
              setIsOpen(false)
              setShowNotes(false)
              setNotes('')
            }}
            aria-label="Close menu"
            tabIndex={-1}
          />
          <div
            className="absolute right-0 top-full mt-2 w-72 bg-background rounded-lg border shadow-lg z-50"
            role="menu"
            aria-label="Save to client"
          >
            <div className="p-3 border-b">
              <p className="text-sm font-medium">Save unit to client</p>
            </div>

            {clients.length > 0 ? (
              <>
                <div className="max-h-48 overflow-y-auto">
                  {clients.map((client) => {
                    const isSaved = isUnitSavedToClient(client.id)
                    const isLoading = savingTo === client.id
                    return (
                      <button
                        key={client.id}
                        onClick={() => handleToggle(client.id)}
                        disabled={isLoading}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-muted transition-colors disabled:opacity-50"
                        role="menuitem"
                      >
                        <span className="truncate">{client.name}</span>
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        ) : isSaved ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : null}
                      </button>
                    )
                  })}
                </div>

                <div className="border-t">
                  <button
                    onClick={() => setShowNotes(!showNotes)}
                    className="w-full flex items-center justify-between px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span>Add note (optional)</span>
                    {showNotes ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                  {showNotes && (
                    <div className="px-4 pb-3">
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g., Great fit for their budget..."
                        className="w-full px-3 py-2 text-sm rounded-md border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                        rows={2}
                      />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">No active clients</p>
                <Link
                  href="/clients/new"
                  className="text-sm font-medium text-foreground hover:underline"
                >
                  Add a client
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
