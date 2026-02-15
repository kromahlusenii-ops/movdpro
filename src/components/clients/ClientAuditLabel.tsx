'use client'

import { formatDistanceToNow } from '@/lib/utils'
import type { ClientFieldEditRecord } from '@/types/client-edits'
import { cn } from '@/lib/utils'

interface ClientAuditLabelProps {
  lastEdit: ClientFieldEditRecord | null
  onClick?: () => void
  className?: string
}

/**
 * Displays attribution for the last edit on a client field.
 * Shows "Edited by [Name] X days ago"
 */
export function ClientAuditLabel({ lastEdit, onClick, className }: ClientAuditLabelProps) {
  if (!lastEdit) {
    return null
  }

  const timeAgo = formatDistanceToNow(lastEdit.createdAt)
  const fullDate = new Date(lastEdit.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const editorName = lastEdit.editedBy
    ? `${lastEdit.editedBy.firstName} ${lastEdit.editedBy.lastName.charAt(0) || ''}.`.trim()
    : 'Unknown'

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center gap-1',
        className
      )}
      title={`${fullDate}${onClick ? ' - Click for history' : ''}`}
    >
      <span>Edited by {editorName} · {timeAgo}</span>
    </button>
  )
}
