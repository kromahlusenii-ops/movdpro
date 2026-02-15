'use client'

import { useState, useCallback, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ClientAuditLabel } from './ClientAuditLabel'
import { ClientEditHistory } from './ClientEditHistory'
import type { ClientEditableFieldName, ClientFieldEditRecord } from '@/types/client-edits'

interface EditableBooleanFieldProps {
  clientId: string
  fieldName: ClientEditableFieldName
  label: string
  currentValue: boolean
  lastEdit: ClientFieldEditRecord | null
  icon?: React.ReactNode
  activeClassName?: string
  className?: string
  onSave?: (newValue: boolean, preferencesChanged: boolean) => void
}

/**
 * Toggle field for boolean values (hasDog, hasCat, etc.)
 */
export function EditableBooleanField({
  clientId,
  fieldName,
  label,
  currentValue,
  lastEdit,
  icon,
  activeClassName = 'bg-foreground text-background',
  className,
  onSave,
}: EditableBooleanFieldProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localLastEdit, setLocalLastEdit] = useState<ClientFieldEditRecord | null>(lastEdit)
  const [localValue, setLocalValue] = useState(currentValue)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [editHistory, setEditHistory] = useState<ClientFieldEditRecord[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => {
    setLocalLastEdit(lastEdit)
    setLocalValue(currentValue)
  }, [lastEdit, currentValue])

  const toggleValue = useCallback(async () => {
    const newValue = !localValue

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [fieldName]: newValue,
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

      setLocalValue(newValue)

      onSave?.(newValue, preferencesChanged)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }, [localValue, clientId, fieldName, onSave])

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
    return value ? 'Yes' : 'No'
  }, [])

  return (
    <div className={cn('group inline-flex flex-col', className)}>
      <button
        type="button"
        onClick={toggleValue}
        disabled={isSaving}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-medium transition-colors',
          localValue ? activeClassName : 'bg-muted text-muted-foreground hover:bg-muted/80',
          isSaving && 'opacity-50 cursor-not-allowed'
        )}
      >
        {isSaving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          icon
        )}
        {label}
      </button>

      {/* Error message */}
      {error && (
        <div className="text-xs text-red-500 mt-1">{error}</div>
      )}

      {/* Audit label with history popover */}
      {localLastEdit && (
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
