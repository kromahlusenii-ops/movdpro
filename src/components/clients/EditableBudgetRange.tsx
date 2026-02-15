'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Pencil, Check, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ClientAuditLabel } from './ClientAuditLabel'
import { ClientEditHistory } from './ClientEditHistory'
import type { ClientFieldEditRecord } from '@/types/client-edits'

interface EditableBudgetRangeProps {
  clientId: string
  budgetMin: number | null
  budgetMax: number | null
  lastEditMin: ClientFieldEditRecord | null
  lastEditMax: ClientFieldEditRecord | null
  className?: string
  onSave?: (budgetMin: number | null, budgetMax: number | null, preferencesChanged: boolean) => void
}

/**
 * Combined budget range editor (min/max) with audit trail
 */
export function EditableBudgetRange({
  clientId,
  budgetMin,
  budgetMax,
  lastEditMin,
  lastEditMax,
  className,
  onSave,
}: EditableBudgetRangeProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editMin, setEditMin] = useState('')
  const [editMax, setEditMax] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localMin, setLocalMin] = useState(budgetMin)
  const [localMax, setLocalMax] = useState(budgetMax)
  const [localLastEditMin, setLocalLastEditMin] = useState<ClientFieldEditRecord | null>(lastEditMin)
  const [localLastEditMax, setLocalLastEditMax] = useState<ClientFieldEditRecord | null>(lastEditMax)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [editHistory, setEditHistory] = useState<ClientFieldEditRecord[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const minRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLocalMin(budgetMin)
    setLocalMax(budgetMax)
    setLocalLastEditMin(lastEditMin)
    setLocalLastEditMax(lastEditMax)
  }, [budgetMin, budgetMax, lastEditMin, lastEditMax])

  const displayValue = localMin !== null && localMax !== null
    ? `$${localMin.toLocaleString()} - $${localMax.toLocaleString()}`
    : localMin !== null
    ? `$${localMin.toLocaleString()}+`
    : localMax !== null
    ? `Up to $${localMax.toLocaleString()}`
    : 'Not specified'

  const startEditing = useCallback(() => {
    setEditMin(localMin?.toString() ?? '')
    setEditMax(localMax?.toString() ?? '')
    setIsEditing(true)
    setError(null)
    setTimeout(() => minRef.current?.focus(), 0)
  }, [localMin, localMax])

  const cancelEditing = useCallback(() => {
    setIsEditing(false)
    setEditMin('')
    setEditMax('')
    setError(null)
  }, [])

  const saveEdit = useCallback(async () => {
    // Parse values
    const parsedMin = editMin.trim() === '' ? null : parseInt(editMin.replace(/[,$]/g, ''), 10)
    const parsedMax = editMax.trim() === '' ? null : parseInt(editMax.replace(/[,$]/g, ''), 10)

    if (editMin.trim() !== '' && (parsedMin === null || isNaN(parsedMin))) {
      setError('Please enter a valid minimum budget')
      return
    }
    if (editMax.trim() !== '' && (parsedMax === null || isNaN(parsedMax))) {
      setError('Please enter a valid maximum budget')
      return
    }
    if (parsedMin !== null && parsedMax !== null && parsedMin > parsedMax) {
      setError('Minimum cannot exceed maximum')
      return
    }

    // Don't save if values haven't changed
    if (parsedMin === localMin && parsedMax === localMax) {
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
          budgetMin: parsedMin,
          budgetMax: parsedMax,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save')
      }

      const { preferencesChanged } = await response.json()

      // Fetch the new edit records
      const historyRes = await fetch(`/api/clients/${clientId}/history`)
      if (historyRes.ok) {
        const { edits } = await historyRes.json()
        if (edits.budgetMin) setLocalLastEditMin(edits.budgetMin)
        if (edits.budgetMax) setLocalLastEditMax(edits.budgetMax)
      }

      setLocalMin(parsedMin)
      setLocalMax(parsedMax)
      setIsEditing(false)

      onSave?.(parsedMin, parsedMax, preferencesChanged)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }, [editMin, editMax, localMin, localMax, clientId, cancelEditing, onSave])

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
      // Load history for both budget fields
      const [minRes, maxRes] = await Promise.all([
        fetch(`/api/clients/${clientId}/history?fieldName=budgetMin&mode=history`),
        fetch(`/api/clients/${clientId}/history?fieldName=budgetMax&mode=history`),
      ])

      const combined: ClientFieldEditRecord[] = []

      if (minRes.ok) {
        const { history } = await minRes.json()
        combined.push(...history.map((h: ClientFieldEditRecord) => ({
          ...h,
          fieldName: 'budgetMin' as const,
        })))
      }
      if (maxRes.ok) {
        const { history } = await maxRes.json()
        combined.push(...history.map((h: ClientFieldEditRecord) => ({
          ...h,
          fieldName: 'budgetMax' as const,
        })))
      }

      // Sort by date descending
      combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setEditHistory(combined)
    } catch (err) {
      console.error('Failed to load history:', err)
    } finally {
      setHistoryLoading(false)
      setHistoryOpen(true)
    }
  }, [clientId, historyLoading, editHistory.length])

  const formatValueForHistory = useCallback((value: unknown): string => {
    if (value === null || value === undefined) return 'Not set'
    if (typeof value === 'number') return `$${value.toLocaleString()}`
    return String(value)
  }, [])

  // Get the most recent edit (either min or max)
  const lastEdit = localLastEditMin && localLastEditMax
    ? new Date(localLastEditMin.createdAt) > new Date(localLastEditMax.createdAt)
      ? localLastEditMin
      : localLastEditMax
    : localLastEditMin || localLastEditMax

  return (
    <div className={cn('group', className)}>
      {/* Label */}
      <div className="text-xs text-muted-foreground mb-1">Budget</div>

      {/* Value / Edit */}
      {isEditing ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                $
              </span>
              <input
                ref={minRef}
                type="text"
                inputMode="numeric"
                value={editMin}
                onChange={(e) => setEditMin(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Min"
                className={cn(
                  'w-full h-8 rounded border bg-background text-sm pl-6 pr-3',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
                  error && 'border-red-500 focus:ring-red-500'
                )}
                disabled={isSaving}
              />
            </div>
            <span className="text-muted-foreground">-</span>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                $
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={editMax}
                onChange={(e) => setEditMax(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Max"
                className={cn(
                  'w-full h-8 rounded border bg-background text-sm pl-6 pr-3',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
                  error && 'border-red-500 focus:ring-red-500'
                )}
                disabled={isSaving}
              />
            </div>
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
        <div className="flex items-center gap-2">
          <span className={cn(
            'font-medium',
            localMin === null && localMax === null && 'text-muted-foreground'
          )}>
            {displayValue}
          </span>
          <button
            type="button"
            onClick={startEditing}
            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
            title="Edit budget"
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
      {lastEdit && !isEditing && (
        <ClientEditHistory
          editHistory={editHistory}
          isOpen={historyOpen}
          onOpenChange={setHistoryOpen}
          fieldLabel="Budget"
          formatValue={formatValueForHistory}
          trigger={
            <div>
              <ClientAuditLabel
                lastEdit={lastEdit}
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
