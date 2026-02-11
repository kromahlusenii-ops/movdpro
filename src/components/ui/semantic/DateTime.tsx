/**
 * DateTime Component - Machine-Readable Date/Time Display
 *
 * Renders dates and times with the <time> element for AI parsability.
 * Uses the datetime attribute with ISO 8601 format.
 */

import { fieldAttr, FIELD_TYPES, type FieldType } from '@/lib/ai-readability'

type DateFormatStyle = 'full' | 'long' | 'medium' | 'short'

interface DateTimeProps {
  /** Date value - accepts Date object, ISO string, or timestamp */
  value: Date | string | number
  /** Display format style */
  format?: DateFormatStyle
  /** Include time in display */
  showTime?: boolean
  /** Custom format function */
  formatFn?: (date: Date) => string
  /** CSS class name */
  className?: string
  /** Data field type for AI readability */
  field?: FieldType
  /** Relative time display (e.g., "2 days ago") */
  relative?: boolean
}

/**
 * Convert various date inputs to Date object
 */
function toDate(value: Date | string | number): Date {
  if (value instanceof Date) return value
  return new Date(value)
}

/**
 * Format date to ISO 8601 string for the datetime attribute
 */
function toISOString(date: Date): string {
  return date.toISOString()
}

/**
 * Format date for display
 */
function formatDate(
  date: Date,
  style: DateFormatStyle,
  showTime: boolean
): string {
  const options: Intl.DateTimeFormatOptions = {
    dateStyle: style,
    ...(showTime && { timeStyle: 'short' }),
  }
  return new Intl.DateTimeFormat('en-US', options).format(date)
}

/**
 * Get relative time string
 */
function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

export function DateTime({
  value,
  format = 'medium',
  showTime = false,
  formatFn,
  className,
  field,
  relative = false,
}: DateTimeProps) {
  const date = toDate(value)
  const isoString = toISOString(date)

  // Determine display text
  let displayText: string
  if (formatFn) {
    displayText = formatFn(date)
  } else if (relative) {
    displayText = getRelativeTime(date)
  } else {
    displayText = formatDate(date, format, showTime)
  }

  return (
    <time
      dateTime={isoString}
      className={className}
      {...(field && fieldAttr(field))}
    >
      {displayText}
    </time>
  )
}

/**
 * Availability date component - for property move-in dates
 */
export function AvailableDate({
  value,
  className,
}: {
  value: Date | string | number | null | undefined
  className?: string
}) {
  if (!value) {
    return (
      <span className={className} {...fieldAttr(FIELD_TYPES.AVAILABLE_DATE)}>
        Available Now
      </span>
    )
  }

  const date = toDate(value)
  const now = new Date()

  // If date is in the past or today, show "Available Now"
  if (date <= now) {
    return (
      <time
        dateTime={toISOString(date)}
        className={className}
        {...fieldAttr(FIELD_TYPES.AVAILABLE_DATE)}
      >
        Available Now
      </time>
    )
  }

  // Format as "Available Mar 1"
  const displayDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date)

  return (
    <time
      dateTime={toISOString(date)}
      className={className}
      {...fieldAttr(FIELD_TYPES.AVAILABLE_DATE)}
    >
      Available {displayDate}
    </time>
  )
}

export default DateTime
