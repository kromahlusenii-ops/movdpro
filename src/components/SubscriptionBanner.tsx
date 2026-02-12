'use client'

import Link from 'next/link'
import { Sparkles, AlertTriangle } from 'lucide-react'

export interface SubscriptionBannerProps {
  subscriptionStatus: string
  trialEndsAt?: Date | null
  onUpgrade: () => void
  upgrading?: boolean
}

export function SubscriptionBanner({
  subscriptionStatus,
  trialEndsAt,
  onUpgrade,
  upgrading = false,
}: SubscriptionBannerProps) {
  // Calculate days left in trial
  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  // Trial status with days remaining
  if (subscriptionStatus === 'trialing' && trialDaysLeft > 0) {
    return (
      <div className="p-4 border-t" role="region" aria-label="Subscription status">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-amber-600" aria-hidden="true" />
            <span className="text-sm font-medium text-amber-800">Free Trial</span>
          </div>
          <p className="text-xs text-amber-700">
            {trialDaysLeft} day{trialDaysLeft === 1 ? '' : 's'} remaining
          </p>
          <button
            onClick={onUpgrade}
            disabled={upgrading}
            className="text-xs font-medium text-amber-800 hover:underline mt-2 inline-block focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 rounded"
            aria-describedby="trial-status"
          >
            {upgrading ? 'Processing...' : 'Upgrade now →'}
          </button>
          <span id="trial-status" className="sr-only">
            You are currently on a free trial with {trialDaysLeft} days remaining
          </span>
        </div>
      </div>
    )
  }

  // Trial expired state
  if (subscriptionStatus === 'trialing' && trialDaysLeft === 0) {
    return (
      <div className="p-4 border-t" role="alert" aria-label="Trial expired">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-600" aria-hidden="true" />
            <span className="text-sm font-medium text-red-800">Trial Expired</span>
          </div>
          <p className="text-xs text-red-700">
            Upgrade to keep using MOVD Pro
          </p>
          <button
            onClick={onUpgrade}
            disabled={upgrading}
            className="text-xs font-medium text-red-800 hover:underline mt-2 inline-block focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 rounded"
          >
            {upgrading ? 'Processing...' : 'Upgrade now →'}
          </button>
        </div>
      </div>
    )
  }

  // Past due state
  if (subscriptionStatus === 'past_due') {
    return (
      <div className="p-4 border-t" role="alert" aria-label="Payment failed">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-600" aria-hidden="true" />
            <span className="text-sm font-medium text-red-800">Payment Failed</span>
          </div>
          <p className="text-xs text-red-700">
            Please update your payment method
          </p>
          <Link
            href="/settings"
            className="text-xs font-medium text-red-800 hover:underline mt-2 inline-block focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 rounded"
          >
            Manage billing →
          </Link>
        </div>
      </div>
    )
  }

  // Active subscription state
  if (subscriptionStatus === 'active') {
    return (
      <div className="p-4 border-t" role="region" aria-label="Subscription status">
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
            <span className="text-sm font-medium text-emerald-800">
              <span className="sr-only">Status: </span>
              Unlimited Access
            </span>
          </div>
          <p className="text-xs text-emerald-600 mt-1">$99/month</p>
        </div>
      </div>
    )
  }

  // No banner for other statuses
  return null
}
