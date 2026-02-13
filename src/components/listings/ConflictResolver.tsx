'use client'

import { useState } from 'react'
import { AlertTriangle, Check, RefreshCw, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FieldEditRecord } from '@/types/field-edits'
import { EDITABLE_FIELD_CONFIGS } from '@/types/field-edits'

interface ConflictResolverProps {
  conflict: FieldEditRecord
  onResolve: () => void
  formatValue?: (value: unknown) => string
  className?: string
}

/**
 * Side-by-side conflict resolution UI.
 * Shows locator edit vs scraped value with resolve buttons.
 */
export function ConflictResolver({
  conflict,
  onResolve,
  formatValue,
  className,
}: ConflictResolverProps) {
  const [resolving, setResolving] = useState<'keep_locator' | 'accept_scraper' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const config = EDITABLE_FIELD_CONFIGS[conflict.fieldName]
  const defaultFormatValue = (value: unknown): string => {
    if (value === null || value === undefined) return 'Not set'
    if (config?.type === 'number' && typeof value === 'number') {
      return `${config.prefix || ''}${value.toLocaleString()}${config.suffix || ''}`
    }
    return String(value)
  }

  const format = formatValue || defaultFormatValue

  const handleResolve = async (resolution: 'keep_locator' | 'accept_scraper') => {
    setResolving(resolution)
    setError(null)

    try {
      const response = await fetch('/api/field-edits/conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          editId: conflict.id,
          resolution,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to resolve conflict')
      }

      onResolve()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve conflict')
    } finally {
      setResolving(null)
    }
  }

  return (
    <div className={cn('rounded-lg border border-amber-200 bg-amber-50 p-4', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-amber-600" />
        <span className="font-medium text-amber-800">Data Conflict</span>
      </div>

      {/* Side by side comparison */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Locator edit */}
        <div className="rounded-md border border-amber-200 bg-white p-3">
          <div className="text-xs text-muted-foreground mb-1">Your edit</div>
          <div className="font-medium text-amber-900">
            {format(conflict.newValue)}
          </div>
          {conflict.editedBy && (
            <div className="text-xs text-muted-foreground mt-1">
              by {conflict.editedBy.firstName} {conflict.editedBy.lastName.charAt(0)}.
            </div>
          )}
        </div>

        {/* Scraped value */}
        <div className="rounded-md border border-amber-200 bg-white p-3">
          <div className="text-xs text-muted-foreground mb-1">New scraped value</div>
          <div className="font-medium text-amber-900">
            {format(conflict.conflictValue)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            from auto-sync
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="text-sm text-red-600 mb-3">{error}</div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleResolve('keep_locator')}
          disabled={resolving !== null}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
            'bg-amber-600 text-white hover:bg-amber-700',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {resolving === 'keep_locator' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          Keep mine
        </button>
        <button
          type="button"
          onClick={() => handleResolve('accept_scraper')}
          disabled={resolving !== null}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
            'bg-white text-amber-700 border border-amber-300 hover:bg-amber-50',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {resolving === 'accept_scraper' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Accept update
        </button>
      </div>
    </div>
  )
}
