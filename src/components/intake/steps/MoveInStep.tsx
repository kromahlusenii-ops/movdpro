'use client'

import { cn } from '@/lib/utils'

interface MoveInStepProps {
  moveInDate: string
  setMoveInDate: (value: string) => void
}

// Generate month options for the next 6 months
function getMonthOptions() {
  const options: { value: string; label: string }[] = []
  const now = new Date()

  for (let i = 0; i < 6; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const value = date.toISOString().split('T')[0]
    const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    options.push({ value, label })
  }

  return options
}

export function MoveInStep({ moveInDate, setMoveInDate }: MoveInStepProps) {
  const monthOptions = getMonthOptions()

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">When are you moving?</h2>
        <p className="text-muted-foreground">
          Select your target move-in month
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3" role="group" aria-label="Move-in month selection">
        {monthOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setMoveInDate(option.value)}
            aria-pressed={moveInDate === option.value}
            className={cn(
              'px-4 py-4 rounded-xl text-center font-medium transition-all',
              moveInDate === option.value
                ? 'bg-foreground text-background ring-2 ring-foreground ring-offset-2'
                : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setMoveInDate('flexible')}
        aria-pressed={moveInDate === 'flexible'}
        className={cn(
          'w-full px-4 py-4 rounded-xl text-center font-medium transition-all',
          moveInDate === 'flexible'
            ? 'bg-foreground text-background ring-2 ring-foreground ring-offset-2'
            : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
        )}
      >
        I&apos;m flexible
      </button>
    </div>
  )
}
