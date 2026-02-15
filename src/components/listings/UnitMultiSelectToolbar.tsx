'use client'

import { X, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UnitMultiSelectToolbarProps {
  selectedCount: number
  onAddToClient: () => void
  onClear: () => void
}

export function UnitMultiSelectToolbar({
  selectedCount,
  onAddToClient,
  onClear,
}: UnitMultiSelectToolbarProps) {
  if (selectedCount === 0) return null

  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
        'flex items-center gap-3 px-4 py-3 rounded-xl',
        'bg-foreground text-background shadow-2xl',
        'animate-in slide-in-from-bottom-4 fade-in-0 duration-200'
      )}
      role="toolbar"
      aria-label="Selection actions"
    >
      <span className="text-sm font-medium">
        {selectedCount} unit{selectedCount !== 1 ? 's' : ''} selected
      </span>

      <div className="w-px h-5 bg-background/20" />

      <button
        onClick={onAddToClient}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/10 hover:bg-background/20 transition-colors text-sm font-medium"
      >
        <UserPlus className="w-4 h-4" />
        Add to Client
      </button>

      <button
        onClick={onClear}
        className="p-1.5 rounded-lg hover:bg-background/20 transition-colors"
        aria-label="Clear selection"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
