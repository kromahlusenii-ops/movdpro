/**
 * Price Component - Machine-Readable Price Display
 *
 * Renders prices with the <data> element for AI parsability.
 * Uses the value attribute for machine-readable amounts.
 */

import { fieldAttr, FIELD_TYPES } from '@/lib/ai-readability'

interface PriceProps {
  /** Single amount - required unless min/max are provided */
  amount?: number
  currency?: 'USD'
  period?: 'month' | 'year' | 'one-time'
  className?: string
  showCurrency?: boolean
  /** For price ranges, provide min and max */
  min?: number
  max?: number
}

/**
 * Format a number as currency
 */
function formatCurrency(amount: number, showSymbol: boolean = true): string {
  const formatted = new Intl.NumberFormat('en-US', {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
  return formatted
}

/**
 * Get the period suffix text
 */
function getPeriodSuffix(period?: PriceProps['period']): string {
  switch (period) {
    case 'month':
      return '/mo'
    case 'year':
      return '/yr'
    default:
      return ''
  }
}

export function Price({
  amount,
  currency = 'USD',
  period,
  className,
  showCurrency = true,
  min,
  max,
}: PriceProps) {
  const periodSuffix = getPeriodSuffix(period)

  // Handle price ranges
  if (min !== undefined && max !== undefined) {
    const displayText =
      min === max
        ? `${formatCurrency(min, showCurrency)}${periodSuffix}`
        : `${formatCurrency(min, showCurrency)} - ${formatCurrency(max, showCurrency)}${periodSuffix}`

    // For ranges, use the min value as the machine-readable value
    return (
      <data
        value={min}
        data-min={min}
        data-max={max}
        data-currency={currency}
        data-period={period || 'one-time'}
        className={className}
        {...fieldAttr(FIELD_TYPES.PRICE)}
      >
        {displayText}
      </data>
    )
  }

  // Single price - amount is required at this point
  const priceAmount = amount ?? 0

  return (
    <data
      value={priceAmount}
      data-currency={currency}
      data-period={period || 'one-time'}
      className={className}
      {...fieldAttr(FIELD_TYPES.PRICE)}
    >
      {formatCurrency(priceAmount, showCurrency)}
      {periodSuffix}
    </data>
  )
}

/**
 * Rent-specific component with month period pre-set
 */
export function Rent({
  amount,
  min,
  max,
  className,
}: {
  amount?: number
  min?: number
  max?: number
  className?: string
}) {
  if (min !== undefined && max !== undefined) {
    return <Price min={min} max={max} period="month" className={className} />
  }
  return <Price amount={amount || 0} period="month" className={className} />
}

export default Price
