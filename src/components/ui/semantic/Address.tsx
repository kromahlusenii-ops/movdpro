/**
 * Address Component - Machine-Readable Address Display
 *
 * Renders addresses with the <address> element and microdata
 * for AI parsability.
 */

import { fieldAttr, FIELD_TYPES } from '@/lib/ai-readability'

interface AddressProps {
  /** Street address */
  street: string
  /** City name */
  city?: string
  /** State abbreviation (e.g., "NC") */
  state?: string
  /** ZIP/postal code */
  zip?: string | null
  /** Display format */
  format?: 'full' | 'street-only' | 'city-state' | 'inline'
  /** CSS class name */
  className?: string
  /** Latitude for geo coordinates */
  lat?: number
  /** Longitude for geo coordinates */
  lng?: number
}

/**
 * Format address based on display format
 */
function formatAddress(
  props: AddressProps,
  format: AddressProps['format']
): string {
  const { street, city, state, zip } = props

  switch (format) {
    case 'street-only':
      return street
    case 'city-state':
      return [city, state].filter(Boolean).join(', ')
    case 'inline':
      const parts = [street]
      if (city || state) {
        parts.push([city, state].filter(Boolean).join(', '))
      }
      if (zip) {
        parts.push(zip)
      }
      return parts.join(', ')
    case 'full':
    default:
      return street
  }
}

export function Address({
  street,
  city = 'Charlotte',
  state = 'NC',
  zip,
  format = 'inline',
  className,
  lat,
  lng,
}: AddressProps) {
  const hasGeo = lat !== undefined && lng !== undefined

  // Full structured address with microdata
  if (format === 'full') {
    return (
      <address
        className={className}
        itemScope
        itemType="https://schema.org/PostalAddress"
        {...fieldAttr(FIELD_TYPES.ADDRESS)}
      >
        <span itemProp="streetAddress" data-field="street">
          {street}
        </span>
        <br />
        <span itemProp="addressLocality" data-field="city">
          {city}
        </span>
        ,{' '}
        <span itemProp="addressRegion" data-field="state">
          {state}
        </span>
        {zip && (
          <>
            {' '}
            <span itemProp="postalCode" data-field="zip">
              {zip}
            </span>
          </>
        )}
        {hasGeo && (
          <meta
            itemProp="geo"
            content={`${lat},${lng}`}
            data-lat={lat}
            data-lng={lng}
          />
        )}
      </address>
    )
  }

  // Inline format (most common)
  return (
    <address
      className={`not-italic ${className || ''}`}
      itemScope
      itemType="https://schema.org/PostalAddress"
      {...fieldAttr(FIELD_TYPES.ADDRESS)}
      {...(hasGeo && { 'data-lat': lat, 'data-lng': lng })}
    >
      <span itemProp="streetAddress">{street}</span>
      {(city || state) && (
        <>
          ,{' '}
          {city && <span itemProp="addressLocality">{city}</span>}
          {city && state && ', '}
          {state && <span itemProp="addressRegion">{state}</span>}
        </>
      )}
      {zip && (
        <>
          {' '}
          <span itemProp="postalCode">{zip}</span>
        </>
      )}
    </address>
  )
}

/**
 * Compact address for cards - just street + neighborhood
 */
export function CompactAddress({
  street,
  neighborhood,
  className,
}: {
  street: string
  neighborhood?: string
  className?: string
}) {
  return (
    <address
      className={`not-italic ${className || ''}`}
      {...fieldAttr(FIELD_TYPES.ADDRESS)}
    >
      <span data-field="street">{street}</span>
      {neighborhood && (
        <>
          {' '}
          <span className="text-muted-foreground">·</span>{' '}
          <span data-field="neighborhood">{neighborhood}</span>
        </>
      )}
    </address>
  )
}

export default Address
