'use client'

import { cn } from '@/lib/utils'
import { VIBES } from '@/lib/constants'

interface VibeStepProps {
  vibes: string[]
  setVibes: (value: string[]) => void
}

const MAX_VIBES = 2

export function VibeStep({ vibes, setVibes }: VibeStepProps) {
  const toggleVibe = (vibeId: string) => {
    if (vibes.includes(vibeId)) {
      setVibes(vibes.filter((v) => v !== vibeId))
    } else if (vibes.length < MAX_VIBES) {
      setVibes([...vibes, vibeId])
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">What&apos;s your vibe?</h2>
        <p className="text-muted-foreground">
          Pick 1-2 that describe your lifestyle
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3" role="group" aria-label="Lifestyle vibes">
        {VIBES.map((vibe) => {
          const isSelected = vibes.includes(vibe.id)
          const isDisabled = !isSelected && vibes.length >= MAX_VIBES

          return (
            <button
              key={vibe.id}
              type="button"
              onClick={() => toggleVibe(vibe.id)}
              disabled={isDisabled}
              aria-pressed={isSelected}
              className={cn(
                'p-4 rounded-xl text-left transition-all',
                isSelected
                  ? 'bg-foreground text-background ring-2 ring-foreground ring-offset-2'
                  : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80',
                isDisabled && 'opacity-40 cursor-not-allowed'
              )}
            >
              <div className="font-medium text-sm">{vibe.label}</div>
              <div className={cn(
                'text-xs mt-0.5',
                isSelected ? 'text-background/70' : 'text-muted-foreground'
              )}>
                {vibe.description}
              </div>
            </button>
          )
        })}
      </div>

      {vibes.length > 0 && (
        <p className="text-sm text-muted-foreground text-center" aria-live="polite">
          {vibes.length}/{MAX_VIBES} selected
        </p>
      )}
    </div>
  )
}
