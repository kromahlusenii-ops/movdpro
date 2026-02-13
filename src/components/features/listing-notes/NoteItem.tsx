'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronUp, ChevronDown, Eye, EyeOff, Trash2, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ClientListingNote } from './types'

interface NoteItemProps {
  note: ClientListingNote
  onUpdate: (id: string, updates: { content?: string; visibleToClient?: boolean }) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  isFirst: boolean
  isLast: boolean
  readOnly?: boolean
}

export function NoteItem({
  note,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  readOnly = false,
}: NoteItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(note.content)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = async () => {
    if (!editContent.trim()) return
    if (editContent.trim() === note.content) {
      setIsEditing(false)
      return
    }
    setIsSaving(true)
    try {
      await onUpdate(note.id, { content: editContent.trim() })
      setIsEditing(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditContent(note.content)
    setIsEditing(false)
  }

  const handleToggleVisibility = async () => {
    await onUpdate(note.id, { visibleToClient: !note.visibleToClient })
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete(note.id)
    } catch {
      setIsDeleting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (readOnly) {
    return (
      <div
        className={cn(
          'py-1.5 text-sm',
          !note.visibleToClient && 'opacity-50'
        )}
      >
        {note.content}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group flex items-center gap-2 py-1.5 px-2 -mx-2 rounded-md hover:bg-muted/50 transition-colors',
        !note.visibleToClient && 'opacity-60'
      )}
    >
      {/* Reorder buttons */}
      <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => onMoveUp(note.id)}
          disabled={isFirst}
          className={cn(
            'p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors',
            isFirst && 'opacity-30 cursor-not-allowed'
          )}
          aria-label="Move up"
        >
          <ChevronUp className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => onMoveDown(note.id)}
          disabled={isLast}
          className={cn(
            'p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors',
            isLast && 'opacity-30 cursor-not-allowed'
          )}
          aria-label="Move down"
        >
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSaving}
              className="flex-1 px-2 py-1 text-sm rounded border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !editContent.trim()}
              className="p-1 rounded text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
              aria-label="Save"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="w-full text-left text-sm truncate hover:text-foreground"
          >
            {note.content}
          </button>
        )}
      </div>

      {/* Actions */}
      {!isEditing && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={handleToggleVisibility}
            className={cn(
              'p-1.5 rounded transition-colors',
              note.visibleToClient
                ? 'text-muted-foreground hover:text-foreground hover:bg-muted'
                : 'text-amber-600 hover:bg-amber-50'
            )}
            aria-label={note.visibleToClient ? 'Hide from client' : 'Show to client'}
            title={note.visibleToClient ? 'Visible in reports' : 'Hidden from reports'}
          >
            {note.visibleToClient ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 rounded text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            aria-label="Delete note"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
