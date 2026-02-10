'use client'

import { useEffect } from 'react'
import { preloadListings } from '@/lib/listings-client-cache'

/**
 * Invisible component that preloads listings in the background
 * Add this to the dashboard layout so listings are ready when
 * user navigates to search
 */
export function ListingsPreloader() {
  useEffect(() => {
    // Start preloading listings in the background
    // Don't await - let it run in background
    preloadListings()
  }, [])

  // Renders nothing - just triggers the preload
  return null
}
