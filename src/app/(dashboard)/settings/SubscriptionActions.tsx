'use client'

import { useState } from 'react'
import { Loader2, CheckCircle, ExternalLink, AlertCircle } from 'lucide-react'

interface SubscriptionActionsProps {
  subscriptionStatus: string
  stripeCustomerId: string | null
  showSuccess: boolean
}

export function SubscriptionActions({
  subscriptionStatus,
  stripeCustomerId,
  showSuccess,
}: SubscriptionActionsProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpgrade = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Failed to start checkout')
        setLoading(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const handleManageBilling = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Failed to open billing portal')
        setLoading(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const showUpgrade = subscriptionStatus === 'trialing' || subscriptionStatus === 'canceled' || subscriptionStatus === 'past_due'
  const showManage = subscriptionStatus === 'active' && stripeCustomerId

  return (
    <div className="space-y-4">
      {showSuccess && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-medium text-emerald-800">
            Subscription activated! You now have unlimited access.
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      {showUpgrade && (
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-lg font-semibold bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Upgrade to Pro — $99/mo
              <ExternalLink className="w-4 h-4" />
            </>
          )}
        </button>
      )}

      {showManage && (
        <button
          onClick={handleManageBilling}
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-lg font-medium border hover:bg-muted transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Manage Billing
              <ExternalLink className="w-4 h-4" />
            </>
          )}
        </button>
      )}
    </div>
  )
}
