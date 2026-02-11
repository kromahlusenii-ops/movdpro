/**
 * JSON-LD Component - Structured Data Script Injection
 *
 * Renders JSON-LD structured data in a script tag for search engines
 * and AI agents to consume.
 */

import { serializeJsonLd } from '@/lib/structured-data'

interface JsonLdProps {
  /** The structured data object(s) to embed */
  data: object | object[]
}

/**
 * Embeds JSON-LD structured data in the page
 *
 * @example
 * ```tsx
 * import { JsonLd } from '@/components/ui/semantic/JsonLd'
 * import { generateApartmentSchema } from '@/lib/structured-data'
 *
 * export default function PropertyPage({ property }) {
 *   return (
 *     <>
 *       <JsonLd data={generateApartmentSchema(property)} />
 *       <main>...</main>
 *     </>
 *   )
 * }
 * ```
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: serializeJsonLd(data),
      }}
    />
  )
}

/**
 * Combine multiple JSON-LD schemas into a single script tag
 *
 * @example
 * ```tsx
 * import { MultiJsonLd } from '@/components/ui/semantic/JsonLd'
 * import {
 *   generateApartmentSchema,
 *   generateBreadcrumbSchema,
 * } from '@/lib/structured-data'
 *
 * export default function PropertyPage({ property, breadcrumbs }) {
 *   return (
 *     <>
 *       <MultiJsonLd
 *         schemas={[
 *           generateApartmentSchema(property),
 *           generateBreadcrumbSchema(breadcrumbs),
 *         ]}
 *       />
 *       <main>...</main>
 *     </>
 *   )
 * }
 * ```
 */
export function MultiJsonLd({ schemas }: { schemas: object[] }) {
  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(schema),
          }}
        />
      ))}
    </>
  )
}

export default JsonLd
