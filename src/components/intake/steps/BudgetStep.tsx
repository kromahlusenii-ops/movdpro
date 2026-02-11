'use client'

import { useState, useEffect } from 'react'

interface BudgetStepProps {
  budgetMin: number
  setBudgetMin: (value: number) => void
  budgetMax: number
  setBudgetMax: (value: number) => void
}

const MIN_BUDGET = 800
const MAX_BUDGET = 4000
const STEP = 100

export function BudgetStep({
  budgetMin,
  setBudgetMin,
  budgetMax,
  setBudgetMax,
}: BudgetStepProps) {
  const [localMin, setLocalMin] = useState(budgetMin)
  const [localMax, setLocalMax] = useState(budgetMax)

  // Sync local state with props
  useEffect(() => {
    setLocalMin(budgetMin)
    setLocalMax(budgetMax)
  }, [budgetMin, budgetMax])

  const handleMinChange = (value: number) => {
    const newMin = Math.min(value, localMax - STEP)
    setLocalMin(newMin)
    setBudgetMin(newMin)
  }

  const handleMaxChange = (value: number) => {
    const newMax = Math.max(value, localMin + STEP)
    setLocalMax(newMax)
    setBudgetMax(newMax)
  }

  // Calculate positions for the track fill
  const minPercent = ((localMin - MIN_BUDGET) / (MAX_BUDGET - MIN_BUDGET)) * 100
  const maxPercent = ((localMax - MIN_BUDGET) / (MAX_BUDGET - MIN_BUDGET)) * 100

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">What&apos;s your budget?</h2>
        <p className="text-muted-foreground">
          Set your monthly rent range
        </p>
      </div>

      {/* Budget display */}
      <div className="text-center py-6">
        <div className="text-4xl font-bold tracking-tight">
          ${localMin.toLocaleString()} - ${localMax.toLocaleString()}
        </div>
        <p className="text-muted-foreground mt-1">per month</p>
      </div>

      {/* Range slider */}
      <div className="px-2">
        <div className="relative h-2 bg-muted rounded-full">
          {/* Active track */}
          <div
            className="absolute h-full bg-foreground rounded-full"
            style={{
              left: `${minPercent}%`,
              width: `${maxPercent - minPercent}%`,
            }}
          />

          {/* Min slider */}
          <input
            type="range"
            min={MIN_BUDGET}
            max={MAX_BUDGET}
            step={STEP}
            value={localMin}
            onChange={(e) => handleMinChange(parseInt(e.target.value))}
            className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-foreground [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-background [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-foreground [&::-moz-range-thumb]:cursor-pointer"
            aria-label="Minimum budget"
          />

          {/* Max slider */}
          <input
            type="range"
            min={MIN_BUDGET}
            max={MAX_BUDGET}
            step={STEP}
            value={localMax}
            onChange={(e) => handleMaxChange(parseInt(e.target.value))}
            className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-foreground [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-background [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-foreground [&::-moz-range-thumb]:cursor-pointer"
            aria-label="Maximum budget"
          />
        </div>

        {/* Labels */}
        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
          <span>${MIN_BUDGET.toLocaleString()}</span>
          <span>${MAX_BUDGET.toLocaleString()}+</span>
        </div>
      </div>
    </div>
  )
}
