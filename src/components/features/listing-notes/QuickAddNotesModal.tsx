'use client'

import { useState, useCallback } from 'react'
import { X, ThumbsUp, ThumbsDown, StickyNote, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NoteType } from './types'

interface QuickAddNotesModalProps {
  isOpen: boolean
  onClose: () => void
  clientId: string
  unitId: string
  buildingName: string
}

interface NoteSection {
  type: NoteType
  label: string
  icon: React.ReactNode
  colorClass: string
  bgClass: string
  placeholder: string
}

const SECTIONS: NoteSection[] = [
  {
    type: 'pro',
    label: 'Pros',
    icon: <ThumbsUp className="w-4 h-4" />,
    colorClass: 'text-emerald-700',
    bgClass: 'bg-emerald-50 border-emerald-200',
    placeholder: 'Great location, modern amenities...',
  },
  {
    type: 'con',
    label: 'Cons',
    icon: <ThumbsDown className="w-4 h-4" />,
    colorClass: 'text-red-700',
    bgClass: 'bg-red-50 border-red-200',
    placeholder: 'Street noise, older building...',
  },
  {
    type: 'note',
    label: 'Notes',
    icon: <StickyNote className="w-4 h-4" />,
    colorClass: 'text-gray-700',
    bgClass: 'bg-gray-50 border-gray-200',
    placeholder: 'Ask about move-in specials...',
  },
]

interface PendingNote {
  type: NoteType
  content: string
}

export function QuickAddNotesModal({
  isOpen,
  onClose,
  clientId,
  unitId,
  buildingName,
}: QuickAddNotesModalProps) {
  const [pendingNotes, setPendingNotes] = useState<PendingNote[]>([])
  const [inputs, setInputs] = useState<Record<NoteType, string>>({
    pro: '',
    con: '',
    note: '',
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleAddNote = useCallback((type: NoteType) => {
    const content = inputs[type].trim()
    if (!content) return

    setPendingNotes((prev) => [...prev, { type, content }])
    setInputs((prev) => ({ ...prev, [type]: '' }))
  }, [inputs])

  const handleRemoveNote = useCallback((index: number) => {
    setPendingNotes((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent, type: NoteType) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAddNote(type)
    }
  }, [handleAddNote])

  const handleSave = async () => {
    if (pendingNotes.length === 0) {
      onClose()
      return
    }

    setIsSaving(true)
    try {
      // Save all notes in parallel
      await Promise.all(
        pendingNotes.map((note) =>
          fetch(`/api/clients/${clientId}/listings/${unitId}/notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: note.type, content: note.content }),
          })
        )
      )
      onClose()
    } catch (error) {
      console.error('Failed to save notes:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSkip = () => {
    setPendingNotes([])
    setInputs({ pro: '', con: '', note: '' })
    onClose()
  }

  if (!isOpen) return null

  const groupedPending = SECTIONS.map((section) => ({
    ...section,
    notes: pendingNotes
      .map((n, i) => ({ ...n, index: i }))
      .filter((n) => n.type === section.type),
  }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleSkip}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-background rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="font-semibold">Add Notes</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Quick notes for <span className="font-medium">{buildingName}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleSkip}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {groupedPending.map((section) => (
            <div key={section.type}>
              <label className={cn('flex items-center gap-2 text-sm font-medium mb-2', section.colorClass)}>
                {section.icon}
                {section.label}
              </label>

              {/* Pending notes for this type */}
              {section.notes.length > 0 && (
                <div className="space-y-1.5 mb-2">
                  {section.notes.map((note) => (
                    <div
                      key={note.index}
                      className={cn('flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm', section.bgClass)}
                    >
                      <span className="flex-1">{note.content}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveNote(note.index)}
                        className="p-0.5 rounded hover:bg-black/5 transition-colors"
                        aria-label="Remove"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputs[section.type]}
                  onChange={(e) =>
                    setInputs((prev) => ({ ...prev, [section.type]: e.target.value }))
                  }
                  onKeyDown={(e) => handleKeyDown(e, section.type)}
                  placeholder={section.placeholder}
                  className="flex-1 px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => handleAddNote(section.type)}
                  disabled={!inputs[section.type].trim()}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    inputs[section.type].trim()
                      ? 'bg-foreground text-background hover:bg-foreground/90'
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  )}
                  aria-label={`Add ${section.type}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t bg-muted/30">
          <button
            type="button"
            onClick={handleSkip}
            className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors"
          >
            {isSaving ? 'Saving...' : pendingNotes.length > 0 ? `Save ${pendingNotes.length} Note${pendingNotes.length > 1 ? 's' : ''}` : 'Done'}
          </button>
        </div>
      </div>
    </div>
  )
}
