'use client'

import { cn } from '@/lib/utils'

interface SavedClient {
  id: string
  name: string
}

interface SavedIndicatorProps {
  clients: SavedClient[]
  maxDisplay?: number
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase()
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

export function SavedIndicator({ clients, maxDisplay = 3 }: SavedIndicatorProps) {
  if (clients.length === 0) return null

  const displayed = clients.slice(0, maxDisplay)
  const remaining = clients.length - maxDisplay

  const tooltip = clients.map((c) => c.name).join(', ')

  return (
    <div className="flex items-center -space-x-1.5" title={tooltip}>
      {displayed.map((client, index) => (
        <div
          key={client.id}
          className={cn(
            'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium',
            'border-2 border-background',
            // Alternate colors for visual distinction
            index % 3 === 0 && 'bg-emerald-100 text-emerald-700',
            index % 3 === 1 && 'bg-blue-100 text-blue-700',
            index % 3 === 2 && 'bg-purple-100 text-purple-700'
          )}
        >
          {getInitials(client.name)}
        </div>
      ))}
      {remaining > 0 && (
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium bg-muted text-muted-foreground border-2 border-background">
          +{remaining}
        </div>
      )}
    </div>
  )
}
