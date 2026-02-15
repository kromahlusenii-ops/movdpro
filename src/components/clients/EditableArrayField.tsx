'use client'

import { useState, useCallback, useEffect } from 'react'
import { Pencil, Check, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ClientAuditLabel } from './ClientAuditLabel'
import { ClientEditHistory } from './ClientEditHistory'
import type { ClientEditableFieldName, ClientFieldEditRecord } from '@/types/client-edits'

interface EditableArrayFieldProps {
  clientId: string
  fieldName: ClientEditableFieldName
  label: string
  currentValue: string[]
  options: { id: string; label: string }[]
  lastEdit: ClientFieldEditRecord | null
  className?: string
  onSave?: (newValue: string[], preferencesChanged: boolean) => void
}

/**
 * Inline editable multi-select field for arrays (neighborhoods, vibes, bedrooms, etc.)
 */
export function EditableArrayField({
  clientId,
  fieldName,
  label,
  currentValue,
  options,
  lastEdit,
  className,
  onSave,
}: EditableArrayFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [selectedValues, setSelectedValues] = useState<string[]>(currentValue || [])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localLastEdit, setLocalLastEdit] = useState<ClientFieldEditRecord | null>(lastEdit)
  const [localValue, setLocalValue] = useState<string[]>(currentValue || [])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [editHistory, setEditHistory] = useState<ClientFieldEditRecord[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => {
    setLocalLastEdit(lastEdit)
    setLocalValue(currentValue || [])
  }, [lastEdit, currentValue])

  const displayValue = localValue.length > 0
    ? localValue.map(v => options.find(o => o.id === v)?.label || v).join(', ')
    : 'Not specified'

  const startEditing = useCallback(() => {
    setSelectedValues(localValue)
    setIsEditing(true)
    setError(null)
  }, [localValue])

  const cancelEditing = useCallback(() => {
    setIsEditing(false)
    setSelectedValues(localValue)
    setError(null)
  }, [localValue])

  const toggleValue = useCallback((value: string) => {
    setSelectedValues(prev =>
      prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value]
    )
  }, [])

  const saveEdit = useCallback(async () => {
    // Don't save if value hasn't changed
    const sortedNew = [...selectedValues].sort()
    const sortedOld = [...localValue].sort()
    if (JSON.stringify(sortedNew) === JSON.stringify(sortedOld)) {
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
          [fieldName]: selectedValues,
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

      setLocalValue(selectedValues)
      setIsEditing(false)

      onSave?.(selectedValues, preferencesChanged)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }, [selectedValues, localValue, clientId, fieldName, cancelEditing, onSave])

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
    if (!value || !Array.isArray(value) || value.length === 0) return 'None'
    return value.map(v => options.find(o => o.id === v)?.label || v).join(', ')
  }, [options])

  return (
    <div className={cn('group', className)}>
      {/* Label */}
      <div className="text-xs text-muted-foreground mb-1">{label}</div>

      {/* Value / Edit */}
      {isEditing ? (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {options.map((option) => {
              const isSelected = selectedValues.includes(option.id)
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggleValue(option.id)}
                  disabled={isSaving}
                  className={cn(
                    'px-2 py-1 rounded text-sm transition-colors',
                    isSelected
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-2">
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
        </div>
      ) : (
        <div className="flex items-start gap-2">
          {localValue.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {localValue.map((v) => (
                <span key={v} className="px-2 py-0.5 rounded bg-muted text-sm">
                  {options.find(o => o.id === v)?.label || v}
                </span>
              ))}
            </div>
          ) : (
            <span className="font-medium text-muted-foreground">{displayValue}</span>
          )}
          <button
            type="button"
            onClick={startEditing}
            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted transition-all flex-shrink-0"
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
