/**
 * Breadcrumbs Component - Navigation with Schema.org Markup
 *
 * Renders breadcrumb navigation with JSON-LD structured data
 * for AI agents and search engines.
 */

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { JsonLd } from './JsonLd'
import { generateBreadcrumbSchema, type BreadcrumbItem } from '@/lib/structured-data'
import { sectionAttr, SECTION_TYPES } from '@/lib/ai-readability'

interface BreadcrumbsProps {
  /** Array of breadcrumb items */
  items: BreadcrumbItem[]
  /** Show home icon for first item */
  showHomeIcon?: boolean
  /** CSS class name */
  className?: string
  /** Include JSON-LD structured data */
  includeSchema?: boolean
}

export function Breadcrumbs({
  items,
  showHomeIcon = true,
  className = '',
  includeSchema = true,
}: BreadcrumbsProps) {
  // Always include home as the first item if not present
  const allItems: BreadcrumbItem[] =
    items[0]?.url === '/' || items[0]?.url === '/dashboard'
      ? items
      : [{ name: 'Home', url: '/dashboard' }, ...items]

  return (
    <>
      {includeSchema && <JsonLd data={generateBreadcrumbSchema(allItems)} />}
      <nav
        aria-label="Breadcrumb"
        className={`text-sm ${className}`}
        {...sectionAttr(SECTION_TYPES.NAVIGATION)}
      >
        <ol
          className="flex items-center gap-1.5 flex-wrap"
          itemScope
          itemType="https://schema.org/BreadcrumbList"
        >
          {allItems.map((item, index) => {
            const isLast = index === allItems.length - 1
            const isFirst = index === 0

            return (
              <li
                key={item.url}
                className="flex items-center gap-1.5"
                itemProp="itemListElement"
                itemScope
                itemType="https://schema.org/ListItem"
              >
                {index > 0 && (
                  <ChevronRight
                    className="h-3.5 w-3.5 text-muted-foreground"
                    aria-hidden="true"
                  />
                )}
                {isLast ? (
                  <span
                    className="text-foreground font-medium"
                    itemProp="name"
                    aria-current="page"
                  >
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={item.url}
                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    itemProp="item"
                  >
                    {isFirst && showHomeIcon && (
                      <Home className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    <span itemProp="name">{item.name}</span>
                  </Link>
                )}
                <meta itemProp="position" content={String(index + 1)} />
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}

/**
 * Helper to generate breadcrumb items for common page types
 */
export const breadcrumbHelpers = {
  /** Property detail page breadcrumbs */
  property: (property: { id: string; name: string; neighborhoodName?: string }): BreadcrumbItem[] => [
    { name: 'Search', url: '/search' },
    ...(property.neighborhoodName
      ? [{ name: property.neighborhoodName, url: `/search?neighborhoods=${encodeURIComponent(property.neighborhoodName)}` }]
      : []),
    { name: property.name, url: `/property/${property.id}` },
  ],

  /** Client detail page breadcrumbs */
  client: (client: { id: string; name: string }): BreadcrumbItem[] => [
    { name: 'Clients', url: '/clients' },
    { name: client.name, url: `/clients/${client.id}` },
  ],

  /** Report detail page breadcrumbs */
  report: (report: { id: string; title: string }): BreadcrumbItem[] => [
    { name: 'Reports', url: '/reports' },
    { name: report.title, url: `/reports/${report.id}` },
  ],

  /** Neighborhood detail page breadcrumbs */
  neighborhood: (neighborhood: { slug: string; name: string }): BreadcrumbItem[] => [
    { name: 'Neighborhoods', url: '/neighborhoods' },
    { name: neighborhood.name, url: `/neighborhoods/${neighborhood.slug}` },
  ],
}

export default Breadcrumbs
