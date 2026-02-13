'use client'

import { formatDistanceToNow } from '@/lib/utils'
import type { FieldEditRecord } from '@/types/field-edits'
import { cn } from '@/lib/utils'

interface AuditLabelProps {
  lastEdit: FieldEditRecord | null
  onClick?: () => void
  className?: string
}

/**
 * Displays attribution for the last edit on a field.
 * Shows "Auto-updated" for scraper edits, "Verified by [Name]" for locator edits.
 */
export function AuditLabel({ lastEdit, onClick, className }: AuditLabelProps) {
  if (!lastEdit) {
    return null
  }

  const timeAgo = formatDistanceToNow(lastEdit.createdAt)
  const fullDate = new Date(lastEdit.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const isLocatorEdit = lastEdit.source === 'locator' || lastEdit.source === 'admin'
  const editorName = lastEdit.editedBy
    ? `${lastEdit.editedBy.firstName} ${lastEdit.editedBy.lastName.charAt(0)}.`
    : 'Unknown'

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center gap-1',
        lastEdit.hasConflict && 'text-amber-600 hover:text-amber-700',
        className
      )}
      title={`${fullDate}${onClick ? ' - Click for history' : ''}`}
    >
      {lastEdit.hasConflict && (
        <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1" />
      )}
      {isLocatorEdit ? (
        <span>
          Verified by {editorName} · {timeAgo}
        </span>
      ) : (
        <span>
          Auto-updated {timeAgo}
        </span>
      )}
    </button>
  )
}
