'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Pencil, Check, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ClientAuditLabel } from './ClientAuditLabel'
import { ClientEditHistory } from './ClientEditHistory'
import type { ClientEditableFieldName, ClientFieldEditRecord } from '@/types/client-edits'

interface EditableDateFieldProps {
  clientId: string
  fieldName: ClientEditableFieldName
  label: string
  currentValue: Date | string | null
  lastEdit: ClientFieldEditRecord | null
  className?: string
  onSave?: (newValue: string | null, preferencesChanged: boolean) => void
}

/**
 * Inline editable date field with audit trail
 */
export function EditableDateField({
  clientId,
  fieldName,
  label,
  currentValue,
  lastEdit,
  className,
  onSave,
}: EditableDateFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localLastEdit, setLocalLastEdit] = useState<ClientFieldEditRecord | null>(lastEdit)
  const [localValue, setLocalValue] = useState<Date | null>(
    currentValue ? new Date(currentValue) : null
  )
  const [historyOpen, setHistoryOpen] = useState(false)
  const [editHistory, setEditHistory] = useState<ClientFieldEditRecord[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLocalLastEdit(lastEdit)
    setLocalValue(currentValue ? new Date(currentValue) : null)
  }, [lastEdit, currentValue])

  const formatDate = (date: Date | null): string => {
    if (!date) return 'Not set'
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const toInputDate = (date: Date | null): string => {
    if (!date) return ''
    // Format as YYYY-MM-DD for input[type="date"]
    return date.toISOString().split('T')[0]
  }

  const startEditing = useCallback(() => {
    setEditValue(toInputDate(localValue))
    setIsEditing(true)
    setError(null)
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [localValue])

  const cancelEditing = useCallback(() => {
    setIsEditing(false)
    setEditValue('')
    setError(null)
  }, [])

  const saveEdit = useCallback(async () => {
    const newDate = editValue ? new Date(editValue) : null

    // Check if value changed
    const oldDateStr = localValue?.toISOString().split('T')[0] || null
    const newDateStr = newDate?.toISOString().split('T')[0] || null
    if (oldDateStr === newDateStr) {
      cancelEditing()
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [fieldName]: newDate?.toISOString() || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save')
      }

      const { preferencesChanged } = await response.json()

      // Fetch the new edit record
      const historyRes = await fetch(`/api/clients/${clientId}/history`)
      if (historyRes.ok) {
        const { edits } = await historyRes.json()
        if (edits[fieldName]) {
          setLocalLastEdit(edits[fieldName])
        }
      }

      setLocalValue(newDate)
      setIsEditing(false)

      onSave?.(newDate?.toISOString() || null, preferencesChanged)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }, [editValue, localValue, clientId, fieldName, cancelEditing, onSave])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveEdit()
    } else if (e.key === 'Escape') {
      cancelEditing()
    }
  }, [saveEdit, cancelEditing])

  const loadHistory = useCallback(async () => {
    if (historyLoading || editHistory.length > 0) {
      setHistoryOpen(true)
      return
    }

    setHistoryLoading(true)
    try {
      const params = new URLSearchParams({
        fieldName,
        mode: 'history',
      })
      const response = await fetch(`/api/clients/${clientId}/history?${params}`)
      if (response.ok) {
        const { history } = await response.json()
        setEditHistory(history)
      }
    } catch (err) {
      console.error('Failed to load history:', err)
    } finally {
      setHistoryLoading(false)
      setHistoryOpen(true)
    }
  }, [clientId, fieldName, historyLoading, editHistory.length])

  const formatValueForHistory = useCallback((value: unknown): string => {
    if (!value) return 'Not set'
    const date = new Date(value as string)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }, [])

  return (
    <div className={cn('group', className)}>
      {/* Label */}
      <div className="text-xs text-muted-foreground mb-1">{label}</div>

      {/* Value / Edit */}
      {isEditing ? (
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="date"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              'h-8 rounded border bg-background text-sm px-3',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
              error && 'border-red-500 focus:ring-red-500'
            )}
            disabled={isSaving}
          />
          <button
            type="button"
            onClick={saveEdit}
            disabled={isSaving}
            className="p-1.5 rounded hover:bg-emerald-100 text-emerald-600 transition-colors disabled:opacity-50"
            title="Save"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
          </button>
          <button
            type="button"
            onClick={cancelEditing}
            disabled={isSaving}
            className="p-1.5 rounded hover:bg-red-100 text-red-600 transition-colors disabled:opacity-50"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className={cn('font-medium', !localValue && 'text-muted-foreground')}>
            {formatDate(localValue)}
          </span>
          <button
            type="button"
            onClick={startEditing}
            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
            title={`Edit ${label.toLowerCase()}`}
          >
            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="text-xs text-red-500 mt-1">{error}</div>
      )}

      {/* Audit label with history popover */}
      {localLastEdit && !isEditing && (
        <ClientEditHistory
          editHistory={editHistory}
          isOpen={historyOpen}
          onOpenChange={setHistoryOpen}
          fieldLabel={label}
          formatValue={formatValueForHistory}
          trigger={
            <div>
              <ClientAuditLabel
                lastEdit={localLastEdit}
                onClick={loadHistory}
                className="mt-1"
              />
            </div>
          }
        />
      )}
    </div>
  )
}
