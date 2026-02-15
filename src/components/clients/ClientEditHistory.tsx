'use client'

import * as Popover from '@radix-ui/react-popover'
import { X, History } from 'lucide-react'
import { formatDistanceToNow } from '@/lib/utils'
import type { ClientFieldEditRecord } from '@/types/client-edits'

interface ClientEditHistoryProps {
  editHistory: ClientFieldEditRecord[]
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  trigger: React.ReactNode
  fieldLabel: string
  formatValue?: (value: unknown) => string
}

/**
 * Popover showing the edit history for a client field.
 */
export function ClientEditHistory({
  editHistory,
  isOpen,
  onOpenChange,
  trigger,
  fieldLabel,
  formatValue = (v) => String(v ?? 'N/A'),
}: ClientEditHistoryProps) {
  return (
    <Popover.Root open={isOpen} onOpenChange={onOpenChange}>
      <Popover.Trigger asChild>
        {trigger}
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="z-50 w-80 rounded-lg border bg-background shadow-lg animate-in fade-in-0 zoom-in-95"
          sideOffset={4}
          align="start"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-sm">{fieldLabel} History</span>
            </div>
            <Popover.Close className="rounded-md p-1 hover:bg-muted transition-colors">
              <X className="w-4 h-4" />
              <span className="sr-only">Close</span>
            </Popover.Close>
          </div>

          {/* History List */}
          <div className="max-h-64 overflow-y-auto">
            {editHistory.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No edit history
              </div>
            ) : (
              <div className="divide-y">
                {editHistory.map((edit, index) => {
                  const editorName = edit.editedBy
                    ? `${edit.editedBy.firstName} ${edit.editedBy.lastName.charAt(0) || ''}.`.trim()
                    : 'Unknown'
                  const timeAgo = formatDistanceToNow(edit.createdAt)

                  return (
                    <div key={edit.id} className="p-3">
                      {/* Value change */}
                      <div className="flex items-center gap-2 text-sm mb-1">
                        <span className="text-muted-foreground line-through">
                          {formatValue(edit.previousValue)}
                        </span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-medium">
                          {formatValue(edit.newValue)}
                        </span>
                        {index === 0 && (
                          <span className="px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                            Current
                          </span>
                        )}
                      </div>

                      {/* Attribution */}
                      <div className="text-xs text-muted-foreground">
                        <span>by {editorName}</span>
                        <span className="mx-1">·</span>
                        <span title={new Date(edit.createdAt).toLocaleString()}>
                          {timeAgo}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <Popover.Arrow className="fill-border" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
