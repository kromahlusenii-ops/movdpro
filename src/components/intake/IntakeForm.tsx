'use client'

import { useState } from 'react'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { IntakeProgress } from './IntakeProgress'
import { IntakeSuccess } from './IntakeSuccess'
import { ContactStep } from './steps/ContactStep'
import { MoveInStep } from './steps/MoveInStep'
import { BudgetStep } from './steps/BudgetStep'
import { VibeStep } from './steps/VibeStep'

interface IntakeFormProps {
  slug: string
  locatorName: string
  welcomeMessage?: string | null
}

const TOTAL_STEPS = 4

export function IntakeForm({ slug, locatorName, welcomeMessage }: IntakeFormProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [contactPreference, setContactPreference] = useState('')
  const [moveInDate, setMoveInDate] = useState('')
  const [budgetMin, setBudgetMin] = useState(1200)
  const [budgetMax, setBudgetMax] = useState(2000)
  const [vibes, setVibes] = useState<string[]>([])

  // Capture UTM param for tracking
  const getIntakeRef = () => {
    if (typeof window === 'undefined') return undefined
    const params = new URLSearchParams(window.location.search)
    return params.get('ref') || params.get('utm_source') || undefined
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return name.trim().length > 0 && (email.trim().length > 0 || phone.trim().length > 0)
      case 2:
        return moveInDate.length > 0
      case 3:
        return budgetMin > 0 && budgetMax > budgetMin
      case 4:
        return vibes.length > 0
      default:
        return false
    }
  }

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1)
      setError('')
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
      setError('')
    }
  }

  const handleSubmit = async () => {
    if (!canProceed()) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/intake/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          contactPreference: contactPreference || undefined,
          moveInDate: moveInDate === 'flexible' ? undefined : moveInDate,
          budgetMin,
          budgetMax,
          vibes,
          intakeRef: getIntakeRef(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit form')
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return <IntakeSuccess locatorName={locatorName} clientName={name} />
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Welcome message on first step */}
      {step === 1 && welcomeMessage && (
        <div className="text-center mb-6 p-4 bg-muted/50 rounded-xl">
          <p className="text-sm text-muted-foreground">{welcomeMessage}</p>
        </div>
      )}

      {/* Progress indicator */}
      <div className="mb-8">
        <IntakeProgress currentStep={step} totalSteps={TOTAL_STEPS} />
      </div>

      {/* Step content */}
      <div className="min-h-[320px]">
        {step === 1 && (
          <ContactStep
            name={name}
            setName={setName}
            email={email}
            setEmail={setEmail}
            phone={phone}
            setPhone={setPhone}
            contactPreference={contactPreference}
            setContactPreference={setContactPreference}
          />
        )}
        {step === 2 && (
          <MoveInStep moveInDate={moveInDate} setMoveInDate={setMoveInDate} />
        )}
        {step === 3 && (
          <BudgetStep
            budgetMin={budgetMin}
            setBudgetMin={setBudgetMin}
            budgetMax={budgetMax}
            setBudgetMax={setBudgetMax}
          />
        )}
        {step === 4 && (
          <VibeStep vibes={vibes} setVibes={setVibes} />
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={step === 1}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
            step === 1
              ? 'opacity-0 pointer-events-none'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {step < TOTAL_STEPS ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed()}
            className={cn(
              'flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors',
              canProceed()
                ? 'bg-foreground text-background hover:bg-foreground/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canProceed() || loading}
            className={cn(
              'flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors',
              canProceed() && !loading
                ? 'bg-foreground text-background hover:bg-foreground/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit'
            )}
          </button>
        )}
      </div>
    </div>
  )
}
