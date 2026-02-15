'use client'

import { useCallback, useRef } from 'react'

interface UseLongPressOptions {
  onLongPress: () => void
  onPress?: () => void
  delay?: number
}

export function useLongPress({ onLongPress, onPress, delay = 500 }: UseLongPressOptions) {
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const isLongPressRef = useRef(false)

  const start = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      // Prevent context menu on mobile
      if ('touches' in e) {
        e.preventDefault()
      }

      isLongPressRef.current = false
      timerRef.current = setTimeout(() => {
        isLongPressRef.current = true
        onLongPress()
      }, delay)
    },
    [onLongPress, delay]
  )

  const stop = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }

      // If it wasn't a long press, trigger onPress
      if (!isLongPressRef.current && onPress) {
        onPress()
      }
    },
    [onPress]
  )

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    isLongPressRef.current = false
  }, [])

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: stop,
    onTouchCancel: cancel,
  }
}
