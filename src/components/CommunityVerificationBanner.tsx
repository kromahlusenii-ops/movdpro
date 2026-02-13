'use client'

import { useState, useEffect } from 'react'
import { X, Users, Sparkles } from 'lucide-react'

const STORAGE_KEY = 'movd-community-verification-seen'

interface CommunityVerificationBannerProps {
  className?: string
}

export function CommunityVerificationBanner({ className = '' }: CommunityVerificationBannerProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    // Check if user has seen the banner before
    const hasSeen = localStorage.getItem(STORAGE_KEY)
    if (!hasSeen) {
      setIsVisible(true)
    }
  }, [])

  const handleDismiss = () => {
    setIsAnimating(true)
    setTimeout(() => {
      setIsVisible(false)
      localStorage.setItem(STORAGE_KEY, 'true')
    }, 300)
  }

  if (!isVisible) return null

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 transition-all duration-300 ${
        isAnimating ? 'opacity-0 translate-y-[-10px]' : 'opacity-100'
      } ${className}`}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/50 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-100/50 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          <Users className="w-5 h-5 text-blue-600" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-blue-900">Community-Verified Data</h3>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-sm text-blue-800/80 leading-relaxed">
            We index listing data automatically, but together we create the best source of truth.{' '}
            <span className="font-medium text-blue-900">
              Click any editable field to add corrections
            </span>{' '}
            - your updates help all locators and are preserved across data refreshes.
          </p>
        </div>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1.5 rounded-lg text-blue-400 hover:text-blue-600 hover:bg-blue-100 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
