'use client'

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import type { Step } from './types'

const STEPS: { id: Step; label: string }[] = [
  { id: 'client', label: 'Client Info' },
  { id: 'properties', label: 'Properties' },
  { id: 'neighborhoods', label: 'Neighborhoods' },
  { id: 'costs', label: 'Move-In Costs' },
  { id: 'preview', label: 'Preview' },
]

type StepIndicatorProps = {
  currentStep: Step
  onStepClick: (step: Step) => void
  completedSteps: Set<Step>
}

export default function StepIndicator({
  currentStep,
  onStepClick,
  completedSteps,
}: StepIndicatorProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep)

  return (
    <div className="mb-8">
      <nav aria-label="Report builder progress">
        <ol className="flex items-center">
          {STEPS.map((step, index) => {
            const isCompleted = completedSteps.has(step.id)
            const isCurrent = step.id === currentStep
            const isPast = index < currentIndex
            const isClickable = isCompleted || isCurrent || isPast

            // Determine the step status for screen readers
            let stepStatus = ''
            if (isCompleted) {
              stepStatus = 'completed'
            } else if (isCurrent) {
              stepStatus = 'current'
            } else if (isPast) {
              stepStatus = 'incomplete'
            } else {
              stepStatus = 'upcoming'
            }

            return (
              <li
                key={step.id}
                className={cn('relative', index !== STEPS.length - 1 && 'flex-1')}
              >
                <div className="flex items-center">
                  <button
                    onClick={() => isClickable && onStepClick(step.id)}
                    disabled={!isClickable}
                    aria-label={`Step ${index + 1}: ${step.label}, ${stepStatus}`}
                    aria-current={isCurrent ? 'step' : undefined}
                    className={cn(
                      'relative flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      isCurrent &&
                        'bg-foreground text-background ring-4 ring-foreground/20',
                      isCompleted && !isCurrent && 'bg-emerald-500 text-white',
                      !isCurrent && !isCompleted && isPast && 'bg-gray-300 text-gray-600',
                      !isCurrent &&
                        !isCompleted &&
                        !isPast &&
                        'bg-gray-200 text-gray-400',
                      !isClickable && 'cursor-not-allowed'
                    )}
                  >
                    {isCompleted ? (
                      <>
                        <Check className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Completed</span>
                      </>
                    ) : (
                      <span aria-hidden="true">{index + 1}</span>
                    )}
                  </button>

                  {/* Connector line */}
                  {index !== STEPS.length - 1 && (
                    <div
                      className={cn(
                        'ml-2 h-0.5 flex-1 mr-2',
                        index < currentIndex ? 'bg-emerald-500' : 'bg-gray-200'
                      )}
                      aria-hidden="true"
                    />
                  )}
                </div>

                {/* Step label */}
                <span
                  className={cn(
                    'absolute -bottom-6 left-0 text-xs whitespace-nowrap hidden sm:block',
                    isCurrent && 'font-medium text-foreground',
                    !isCurrent && 'text-muted-foreground'
                  )}
                  aria-hidden="true"
                >
                  {step.label}
                </span>
              </li>
            )
          })}
        </ol>
      </nav>
    </div>
  )
}
