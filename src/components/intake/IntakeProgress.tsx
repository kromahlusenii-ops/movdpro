'use client'

import { cn } from '@/lib/utils'

interface IntakeProgressProps {
  currentStep: number
  totalSteps: number
}

export function IntakeProgress({ currentStep, totalSteps }: IntakeProgressProps) {
  return (
    <div className="flex items-center justify-center gap-2" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={totalSteps} aria-label={`Step ${currentStep} of ${totalSteps}`}>
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div
          key={step}
          className={cn(
            'w-2.5 h-2.5 rounded-full transition-colors',
            step === currentStep
              ? 'bg-foreground'
              : step < currentStep
              ? 'bg-foreground/60'
              : 'bg-muted-foreground/30'
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}
