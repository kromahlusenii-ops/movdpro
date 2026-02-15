'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Client {
  id: string
  name: string
}

interface ClientPickerDialogProps {
  isOpen: boolean
  onClose: () => void
  clients: Client[]
  selectedUnitCount: number
  onSave: (clientIds: string[], notes?: string) => Promise<void>
}

export function ClientPickerDialog({
  isOpen,
  onClose,
  clients,
  selectedUnitCount,
  onSave,
}: ClientPickerDialogProps) {
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set())
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedClients(new Set())
      setNotes('')
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const toggleClient = useCallback((clientId: string) => {
    setSelectedClients((prev) => {
      const next = new Set(prev)
      if (next.has(clientId)) {
        next.delete(clientId)
      } else {
        next.add(clientId)
      }
      return next
    })
  }, [])

  const handleSave = async () => {
    if (selectedClients.size === 0) return
    setIsSaving(true)
    try {
      await onSave(Array.from(selectedClients), notes || undefined)
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      {/* Backdrop */}
      <button
        className="absolute inset-0 bg-black/50 cursor-default"
        onClick={onClose}
        aria-label="Close dialog"
        tabIndex={-1}
      />

      {/* Dialog */}
      <div className="relative bg-background rounded-xl border shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 fade-in-0 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 id="dialog-title" className="text-lg font-semibold">
            Add {selectedUnitCount} unit{selectedUnitCount !== 1 ? 's' : ''} to client
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {clients.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-3">
                Select clients to save the selected units to:
              </p>
              <div className="max-h-64 overflow-y-auto space-y-1 mb-4">
                {clients.map((client) => {
                  const isSelected = selectedClients.has(client.id)
                  return (
                    <button
                      key={client.id}
                      onClick={() => toggleClient(client.id)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors',
                        isSelected
                          ? 'bg-emerald-50 border border-emerald-200'
                          : 'hover:bg-muted border border-transparent'
                      )}
                    >
                      <span className="truncate">{client.name}</span>
                      {isSelected && <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                    </button>
                  )
                })}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1.5">Note (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add a note for these saved units..."
                  className="w-full px-3 py-2 text-sm rounded-lg border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={2}
                />
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-2">No active clients</p>
              <Link
                href="/clients/new"
                className="text-sm font-medium text-foreground hover:underline"
              >
                Add a client
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        {clients.length > 0 && (
          <div className="flex items-center justify-end gap-3 p-4 border-t bg-muted/30">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={selectedClients.size === 0 || isSaving}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSaving ? 'Saving...' : `Save to ${selectedClients.size || '...'} client${selectedClients.size !== 1 ? 's' : ''}`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
