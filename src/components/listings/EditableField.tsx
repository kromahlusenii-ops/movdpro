'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Pencil, Check, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AuditLabel } from './AuditLabel'
import { EditHistory } from './EditHistory'
import type { EditableFieldName, EditTargetType, FieldEditRecord } from '@/types/field-edits'

interface EditableFieldProps {
  targetType: EditTargetType
  targetId: string
  fieldName: EditableFieldName
  label: string
  type: 'number' | 'text'
  currentValue: string | number | null
  lastEdit: FieldEditRecord | null
  prefix?: string
  suffix?: string
  placeholder?: string
  className?: string
  onSave?: (newValue: unknown) => void
}

/**
 * Inline editable field with audit trail.
 * Shows value with pencil icon on hover, switches to input on click.
 */
export function EditableField({
  targetType,
  targetId,
  fieldName,
  label,
  type,
  currentValue,
  lastEdit,
  prefix = '',
  suffix = '',
  placeholder,
  className,
  onSave,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localLastEdit, setLocalLastEdit] = useState<FieldEditRecord | null>(lastEdit)
  const [localValue, setLocalValue] = useState(currentValue)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [editHistory, setEditHistory] = useState<FieldEditRecord[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Update local state when props change
  useEffect(() => {
    setLocalLastEdit(lastEdit)
    setLocalValue(currentValue)
  }, [lastEdit, currentValue])

  const displayValue = localValue !== null && localValue !== undefined
    ? `${prefix}${typeof localValue === 'number' ? localValue.toLocaleString() : localValue}${suffix}`
    : 'Not set'

  const startEditing = useCallback(() => {
    setEditValue(localValue?.toString() ?? '')
    setIsEditing(true)
    setError(null)
    // Focus input on next tick
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [localValue])

  const cancelEditing = useCallback(() => {
    setIsEditing(false)
    setEditValue('')
    setError(null)
  }, [])

  const saveEdit = useCallback(async () => {
    // Parse the value based on type
    let parsedValue: unknown
    if (type === 'number') {
      const numValue = parseFloat(editValue.replace(/[,$]/g, ''))
      if (isNaN(numValue)) {
        setError('Please enter a valid number')
        return
      }
      parsedValue = numValue
    } else {
      parsedValue = editValue.trim()
    }

    // Don't save if value hasn't changed
    if (parsedValue === localValue) {
      cancelEditing()
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/field-edits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType,
          targetId,
          fieldName,
          newValue: parsedValue,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save')
      }

      const { edit } = await response.json()

      // Update local state
      setLocalValue(parsedValue as string | number)
      setLocalLastEdit(edit)
      setIsEditing(false)

      // Notify parent
      onSave?.(parsedValue)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }, [editValue, type, localValue, targetType, targetId, fieldName, cancelEditing, onSave])

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
        targetType,
        targetId,
        fieldName,
        mode: 'history',
      })
      const response = await fetch(`/api/field-edits?${params}`)
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
  }, [targetType, targetId, fieldName, historyLoading, editHistory.length])

  const formatValueForHistory = useCallback((value: unknown): string => {
    if (value === null || value === undefined) return 'Not set'
    if (type === 'number' && typeof value === 'number') {
      return `${prefix}${value.toLocaleString()}${suffix}`
    }
    return String(value)
  }, [type, prefix, suffix])

  return (
    <div className={cn('group', className)}>
      {/* Label */}
      <div className="text-xs text-muted-foreground mb-1">{label}</div>

      {/* Value / Edit */}
      {isEditing ? (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            {prefix && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                {prefix}
              </span>
            )}
            <input
              ref={inputRef}
              type={type === 'number' ? 'text' : 'text'}
              inputMode={type === 'number' ? 'decimal' : 'text'}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={cn(
                'w-full h-8 rounded border bg-background text-sm',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
                prefix ? 'pl-6 pr-3' : 'px-3',
                error && 'border-red-500 focus:ring-red-500'
              )}
              disabled={isSaving}
            />
          </div>
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
          <span className="font-medium">{displayValue}</span>
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
        <EditHistory
          editHistory={editHistory}
          isOpen={historyOpen}
          onOpenChange={setHistoryOpen}
          fieldLabel={label}
          formatValue={formatValueForHistory}
          trigger={
            <div>
              <AuditLabel
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
