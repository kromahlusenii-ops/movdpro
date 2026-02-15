'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, RefreshCw, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReMatchPromptProps {
  show: boolean
  onDismiss: () => void
  onConfirm: () => Promise<void>
  className?: string
}

/**
 * Toast-like prompt that appears when preference fields are edited,
 * asking if the user wants to refresh recommendations.
 */
export function ReMatchPrompt({
  show,
  onDismiss,
  onConfirm,
  className,
}: ReMatchPromptProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (show) {
      // Slight delay for animation
      const timer = setTimeout(() => setVisible(true), 50)
      return () => clearTimeout(timer)
    } else {
      setVisible(false)
    }
  }, [show])

  const handleConfirm = useCallback(async () => {
    setIsLoading(true)
    try {
      await onConfirm()
    } finally {
      setIsLoading(false)
      onDismiss()
    }
  }, [onConfirm, onDismiss])

  if (!show) return null

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 transition-all duration-300',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
        className
      )}
    >
      <div className="bg-background border rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <RefreshCw className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">Preferences updated</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Would you like to refresh this client&apos;s saved listings based on their new preferences?
            </p>
            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isLoading}
                className="px-3 py-1.5 rounded bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  'Refresh recommendations'
                )}
              </button>
              <button
                type="button"
                onClick={onDismiss}
                disabled={isLoading}
                className="px-3 py-1.5 rounded bg-muted text-sm font-medium hover:bg-muted/80 transition-colors disabled:opacity-50"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            disabled={isLoading}
            className="flex-shrink-0 p-1 rounded hover:bg-muted transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4 text-muted-foreground" />
            <span className="sr-only">Dismiss</span>
          </button>
        </div>
      </div>
    </div>
  )
}
