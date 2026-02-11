'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface LiveRegionProps {
  children: React.ReactNode
  mode?: 'polite' | 'assertive'
  atomic?: boolean
  className?: string
  visible?: boolean
}

/**
 * LiveRegion component for announcing dynamic content changes to screen readers.
 *
 * @param mode - 'polite' waits for user to be idle, 'assertive' interrupts immediately
 * @param atomic - If true, announces entire region content, not just changes
 * @param visible - If false (default), content is visually hidden but announced
 */
export function LiveRegion({
  children,
  mode = 'polite',
  atomic = true,
  className,
  visible = false,
}: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={mode}
      aria-atomic={atomic}
      className={cn(!visible && 'sr-only', className)}
    >
      {children}
    </div>
  )
}

/**
 * Hook to create a live region announcer
 */
export function useAnnounce() {
  const [message, setMessage] = React.useState('')

  const announce = React.useCallback((text: string, clearAfter = 1000) => {
    setMessage(text)
    if (clearAfter > 0) {
      setTimeout(() => setMessage(''), clearAfter)
    }
  }, [])

  const clear = React.useCallback(() => setMessage(''), [])

  return { message, announce, clear }
}
