'use client'

import { CheckCircle2 } from 'lucide-react'

interface IntakeSuccessProps {
  locatorName: string
  clientName: string
}

export function IntakeSuccess({ locatorName, clientName }: IntakeSuccessProps) {
  return (
    <div className="text-center py-8">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-6">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      <h2 className="text-2xl font-bold mb-2">You&apos;re all set!</h2>

      <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
        Thanks, {clientName}! {locatorName} has your info and will reach out soon to help find your perfect place.
      </p>

      <div className="bg-muted/50 rounded-xl p-6 max-w-sm mx-auto">
        <h3 className="font-medium mb-3">What happens next</h3>
        <ul className="text-sm text-muted-foreground space-y-2 text-left">
          <li className="flex items-start gap-2">
            <span className="text-foreground font-medium">1.</span>
            {locatorName} will review your preferences
          </li>
          <li className="flex items-start gap-2">
            <span className="text-foreground font-medium">2.</span>
            They&apos;ll reach out with personalized recommendations
          </li>
          <li className="flex items-start gap-2">
            <span className="text-foreground font-medium">3.</span>
            You&apos;ll tour apartments that match your vibe
          </li>
        </ul>
      </div>
    </div>
  )
}
