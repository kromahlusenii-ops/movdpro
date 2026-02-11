'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Hook to manage focus on route changes for accessibility.
 * Moves focus to the main content area when the route changes.
 */
export function useFocusOnRouteChange() {
  const pathname = usePathname()

  useEffect(() => {
    // Find the main content element
    const mainContent = document.getElementById('main-content')

    if (mainContent) {
      // Set tabindex to -1 to make it programmatically focusable
      if (!mainContent.hasAttribute('tabindex')) {
        mainContent.setAttribute('tabindex', '-1')
      }

      // Focus the main content after a brief delay to ensure DOM is ready
      const timeoutId = setTimeout(() => {
        mainContent.focus({ preventScroll: true })
      }, 100)

      return () => clearTimeout(timeoutId)
    }
  }, [pathname])
}

/**
 * Hook to announce page changes to screen readers
 */
export function useRouteAnnouncer() {
  const pathname = usePathname()

  useEffect(() => {
    // Create or find the announcer element
    let announcer = document.getElementById('route-announcer')

    if (!announcer) {
      announcer = document.createElement('div')
      announcer.id = 'route-announcer'
      announcer.setAttribute('role', 'status')
      announcer.setAttribute('aria-live', 'polite')
      announcer.setAttribute('aria-atomic', 'true')
      announcer.className = 'sr-only'
      document.body.appendChild(announcer)
    }

    // Get the page title or generate from pathname
    const pageTitle = document.title || pathname.split('/').pop() || 'Page'

    // Announce the page change
    announcer.textContent = `Navigated to ${pageTitle}`

    return () => {
      // Clear the announcer after announcement
      if (announcer) {
        announcer.textContent = ''
      }
    }
  }, [pathname])
}
