/**
 * useJsonLd Hook - Dynamic JSON-LD Injection for Client Components
 *
 * This hook manages JSON-LD structured data for client-side rendered pages.
 * It injects/updates the JSON-LD script tag when data changes.
 */

import { useEffect, useRef } from 'react'
import { serializeJsonLd } from '@/lib/structured-data'

/**
 * Injects JSON-LD structured data into the document head.
 * Updates when the data changes and cleans up on unmount.
 *
 * @param data - The structured data object to embed, or null to remove
 * @param id - Unique identifier for this JSON-LD block
 *
 * @example
 * ```tsx
 * import { useJsonLd } from '@/hooks/useJsonLd'
 * import { generateApartmentSchema } from '@/lib/structured-data'
 *
 * export default function PropertyPage({ property }) {
 *   useJsonLd(
 *     property ? generateApartmentSchema(property) : null,
 *     'property-schema'
 *   )
 *
 *   return <main>...</main>
 * }
 * ```
 */
export function useJsonLd(data: object | null, id: string) {
  const scriptRef = useRef<HTMLScriptElement | null>(null)

  useEffect(() => {
    // Remove existing script if data is null
    if (!data) {
      if (scriptRef.current) {
        scriptRef.current.remove()
        scriptRef.current = null
      }
      return
    }

    // Find or create the script element
    let script = document.querySelector(
      `script[data-json-ld-id="${id}"]`
    ) as HTMLScriptElement | null

    if (!script) {
      script = document.createElement('script')
      script.type = 'application/ld+json'
      script.setAttribute('data-json-ld-id', id)
      document.head.appendChild(script)
    }

    // Update content
    script.textContent = serializeJsonLd(data)
    scriptRef.current = script

    // Cleanup on unmount
    return () => {
      if (scriptRef.current) {
        scriptRef.current.remove()
        scriptRef.current = null
      }
    }
  }, [data, id])
}

/**
 * Inject multiple JSON-LD schemas
 */
export function useMultiJsonLd(
  schemas: Array<{ data: object | null; id: string }>
) {
  schemas.forEach(({ data, id }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useJsonLd(data, id)
  })
}

export default useJsonLd
