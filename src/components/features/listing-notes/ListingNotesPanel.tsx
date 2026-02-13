'use client'

import { useState, useCallback } from 'react'
import { ChevronDown, ChevronRight, Plus, ThumbsUp, ThumbsDown, StickyNote } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NoteItem } from './NoteItem'
import type { ClientListingNote, NoteType } from './types'

interface ListingNotesPanelProps {
  clientId: string
  unitId: string
  initialNotes: ClientListingNote[]
  readOnly?: boolean
}

interface NoteSection {
  type: NoteType
  label: string
  icon: React.ReactNode
  colorClass: string
  bgClass: string
}

const SECTIONS: NoteSection[] = [
  {
    type: 'pro',
    label: 'Pros',
    icon: <ThumbsUp className="w-4 h-4" />,
    colorClass: 'text-emerald-700',
    bgClass: 'bg-emerald-50',
  },
  {
    type: 'con',
    label: 'Cons',
    icon: <ThumbsDown className="w-4 h-4" />,
    colorClass: 'text-red-700',
    bgClass: 'bg-red-50',
  },
  {
    type: 'note',
    label: 'Notes',
    icon: <StickyNote className="w-4 h-4" />,
    colorClass: 'text-gray-700',
    bgClass: 'bg-gray-50',
  },
]

export function ListingNotesPanel({
  clientId,
  unitId,
  initialNotes,
  readOnly = false,
}: ListingNotesPanelProps) {
  const [notes, setNotes] = useState<ClientListingNote[]>(initialNotes)
  const [expandedSections, setExpandedSections] = useState<Set<NoteType>>(() => {
    const hasNotes = new Set(initialNotes.map((n) => n.type))
    return hasNotes
  })
  const [addingTo, setAddingTo] = useState<NoteType | null>(null)
  const [newContent, setNewContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const groupedNotes = SECTIONS.map((section) => ({
    ...section,
    notes: notes
      .filter((n) => n.type === section.type)
      .sort((a, b) => a.sortOrder - b.sortOrder),
  }))

  const toggleSection = (type: NoteType) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  const handleAddNote = async (type: NoteType) => {
    if (!newContent.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/listings/${unitId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, content: newContent.trim() }),
      })

      if (res.ok) {
        const { note } = await res.json()
        setNotes((prev) => [...prev, note])
        setNewContent('')
        setAddingTo(null)
        setExpandedSections((prev) => new Set([...prev, type]))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateNote = useCallback(
    async (id: string, updates: { content?: string; visibleToClient?: boolean }) => {
      const res = await fetch(`/api/clients/${clientId}/listings/${unitId}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      })

      if (res.ok) {
        const { note } = await res.json()
        setNotes((prev) => prev.map((n) => (n.id === id ? note : n)))
      }
    },
    [clientId, unitId]
  )

  const handleDeleteNote = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/clients/${clientId}/listings/${unitId}/notes`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== id))
      }
    },
    [clientId, unitId]
  )

  const handleMoveNote = useCallback(
    async (id: string, direction: 'up' | 'down') => {
      const note = notes.find((n) => n.id === id)
      if (!note) return

      const typeNotes = notes
        .filter((n) => n.type === note.type)
        .sort((a, b) => a.sortOrder - b.sortOrder)

      const currentIndex = typeNotes.findIndex((n) => n.id === id)
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

      if (newIndex < 0 || newIndex >= typeNotes.length) return

      const reorderedIds = [...typeNotes.map((n) => n.id)]
      const [movedId] = reorderedIds.splice(currentIndex, 1)
      reorderedIds.splice(newIndex, 0, movedId)

      // Optimistic update
      const updatedNotes = notes.map((n) => {
        if (n.type !== note.type) return n
        const newOrder = reorderedIds.indexOf(n.id)
        return { ...n, sortOrder: newOrder }
      })
      setNotes(updatedNotes)

      // Persist
      await fetch(`/api/clients/${clientId}/listings/${unitId}/notes/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteIds: reorderedIds }),
      })
    },
    [notes, clientId, unitId]
  )

  if (readOnly && notes.length === 0) {
    return null
  }

  return (
    <div className="mt-3 pt-3 border-t border-dashed">
      <div className="space-y-2">
        {groupedNotes.map((section) => {
          const isExpanded = expandedSections.has(section.type)
          const count = section.notes.length

          return (
            <div key={section.type}>
              {/* Section Header */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleSection(section.type)}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-medium transition-colors',
                    section.bgClass,
                    section.colorClass,
                    'hover:opacity-80'
                  )}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                  {section.icon}
                  <span>{section.label}</span>
                  {count > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/50 text-xs">
                      {count}
                    </span>
                  )}
                </button>

                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => {
                      setAddingTo(section.type)
                      setExpandedSections((prev) => new Set([...prev, section.type]))
                    }}
                    className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    aria-label={`Add ${section.label.toLowerCase()}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Section Content */}
              {isExpanded && (
                <div className="mt-1 ml-2 pl-2 border-l-2 border-muted">
                  {section.notes.length > 0 ? (
                    <div className="space-y-0.5">
                      {section.notes.map((note, index) => (
                        <NoteItem
                          key={note.id}
                          note={note}
                          onUpdate={handleUpdateNote}
                          onDelete={handleDeleteNote}
                          onMoveUp={(id) => handleMoveNote(id, 'up')}
                          onMoveDown={(id) => handleMoveNote(id, 'down')}
                          isFirst={index === 0}
                          isLast={index === section.notes.length - 1}
                          readOnly={readOnly}
                        />
                      ))}
                    </div>
                  ) : (
                    !readOnly && (
                      <p className="text-xs text-muted-foreground py-1">
                        No {section.label.toLowerCase()} yet
                      </p>
                    )
                  )}

                  {/* Add input */}
                  {!readOnly && addingTo === section.type && (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="text"
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddNote(section.type)
                          } else if (e.key === 'Escape') {
                            setAddingTo(null)
                            setNewContent('')
                          }
                        }}
                        placeholder={`Add a ${section.type}...`}
                        className="flex-1 px-2 py-1 text-sm rounded border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        autoFocus
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddNote(section.type)}
                        disabled={isSubmitting || !newContent.trim()}
                        className="px-2 py-1 text-xs font-medium rounded bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAddingTo(null)
                          setNewContent('')
                        }}
                        className="px-2 py-1 text-xs font-medium rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
