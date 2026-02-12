import { z } from 'zod'
import type { ColumnMapping, ParsedClientRow, ValidationError } from '@/types/client-import'
import { NEIGHBORHOODS, BEDROOM_OPTIONS, VIBES, PRIORITIES } from '@/lib/constants'

// Extract IDs from the constant objects
const BEDROOM_IDS = BEDROOM_OPTIONS.map((opt) => opt.id)
const VIBE_IDS = VIBES.map((opt) => opt.id)
const PRIORITY_IDS = PRIORITIES.map((opt) => opt.id)
const NEIGHBORHOOD_NAMES = [
  ...NEIGHBORHOODS.tier1.map((n) => n.name),
  ...NEIGHBORHOODS.tier2.map((n) => n.name),
  ...NEIGHBORHOODS.tier3.map((n) => n.name),
]

const phoneRegex = /^[\d\s\-\(\)\+\.]+$/
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const clientRowSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name is too long'),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().regex(phoneRegex, 'Invalid phone format').optional().or(z.literal('')),
  budgetMin: z.number().min(0, 'Budget must be positive').optional(),
  budgetMax: z.number().min(0, 'Budget must be positive').optional(),
  bedrooms: z.array(z.string()).optional(),
  neighborhoods: z.array(z.string()).optional(),
  moveInDate: z.date().optional(),
  vibes: z.array(z.string()).optional(),
  priorities: z.array(z.string()).optional(),
  hasDog: z.boolean().optional(),
  hasCat: z.boolean().optional(),
  hasKids: z.boolean().optional(),
  worksFromHome: z.boolean().optional(),
  needsParking: z.boolean().optional(),
  commuteAddress: z.string().max(500, 'Commute address too long').optional(),
  commutePreference: z.string().optional(),
  contactPreference: z.string().optional(),
  notes: z.string().max(5000, 'Notes too long').optional(),
  status: z.enum(['active', 'placed', 'archived']).optional(),
})

function parseBoolean(value: string): boolean | undefined {
  const normalized = value.toLowerCase().trim()
  if (['yes', 'true', '1', 'y', 'x'].includes(normalized)) return true
  if (['no', 'false', '0', 'n', ''].includes(normalized)) return false
  return undefined
}

function parseNumber(value: string): number | undefined {
  if (!value.trim()) return undefined
  // Remove currency symbols and commas
  const cleaned = value.replace(/[$,\s]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? undefined : num
}

function parseDate(value: string): Date | undefined {
  if (!value.trim()) return undefined
  const date = new Date(value)
  return isNaN(date.getTime()) ? undefined : date
}

function parseArray(value: string, validOptions?: string[]): string[] {
  if (!value.trim()) return []

  // Split by comma, semicolon, or newline
  const items = value.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean)

  if (validOptions) {
    // Try to match to valid options (case-insensitive)
    return items.map((item) => {
      const lower = item.toLowerCase()
      const match = validOptions.find((opt) =>
        opt.toLowerCase() === lower ||
        opt.toLowerCase().includes(lower) ||
        lower.includes(opt.toLowerCase())
      )
      return match || item
    })
  }

  return items
}

function parseStatus(value: string): 'active' | 'placed' | 'archived' | undefined {
  const normalized = value.toLowerCase().trim()

  // Direct matches
  if (['active', 'placed', 'archived'].includes(normalized)) {
    return normalized as 'active' | 'placed' | 'archived'
  }

  // Common CRM status mappings
  const statusMappings: Record<string, 'active' | 'placed' | 'archived'> = {
    // HubSpot-style
    'lead': 'active',
    'new': 'active',
    'open': 'active',
    'working': 'active',
    'in progress': 'active',
    'qualified': 'active',
    'contacted': 'active',
    'engaged': 'active',

    // Closed/won
    'closed': 'placed',
    'won': 'placed',
    'converted': 'placed',
    'customer': 'placed',
    'closed won': 'placed',
    'successful': 'placed',
    'completed': 'placed',

    // Lost/inactive
    'lost': 'archived',
    'closed lost': 'archived',
    'unqualified': 'archived',
    'inactive': 'archived',
    'dead': 'archived',
    'cancelled': 'archived',
    'canceled': 'archived',
  }

  return statusMappings[normalized]
}

export function transformRow(
  row: string[],
  headers: string[],
  mappings: ColumnMapping[]
): Partial<ParsedClientRow> {
  const result: Partial<ParsedClientRow> = {}

  for (let i = 0; i < headers.length; i++) {
    const mapping = mappings.find((m) => m.sourceColumn === headers[i])
    if (!mapping || !mapping.targetField) continue

    const value = row[i] || ''
    const field = mapping.targetField

    switch (field) {
      case 'name':
        result.name = value.trim()
        break
      case 'email':
        result.email = value.trim() || undefined
        break
      case 'phone':
        result.phone = value.trim() || undefined
        break
      case 'budgetMin':
        result.budgetMin = parseNumber(value)
        break
      case 'budgetMax':
        result.budgetMax = parseNumber(value)
        break
      case 'bedrooms':
        result.bedrooms = parseArray(value, BEDROOM_IDS)
        break
      case 'neighborhoods':
        result.neighborhoods = parseArray(value, NEIGHBORHOOD_NAMES)
        break
      case 'moveInDate':
        result.moveInDate = parseDate(value)
        break
      case 'vibes':
        result.vibes = parseArray(value, VIBE_IDS)
        break
      case 'priorities':
        result.priorities = parseArray(value, PRIORITY_IDS)
        break
      case 'hasDog':
        result.hasDog = parseBoolean(value)
        break
      case 'hasCat':
        result.hasCat = parseBoolean(value)
        break
      case 'hasKids':
        result.hasKids = parseBoolean(value)
        break
      case 'worksFromHome':
        result.worksFromHome = parseBoolean(value)
        break
      case 'needsParking':
        result.needsParking = parseBoolean(value)
        break
      case 'commuteAddress':
        result.commuteAddress = value.trim() || undefined
        break
      case 'commutePreference':
        result.commutePreference = value.trim() || undefined
        break
      case 'contactPreference':
        result.contactPreference = value.trim() || undefined
        break
      case 'notes':
        result.notes = value.trim() || undefined
        break
      case 'status':
        result.status = parseStatus(value)
        break
    }
  }

  return result
}

export function validateRow(
  row: Partial<ParsedClientRow>,
  rowIndex: number
): { valid: boolean; errors: ValidationError[]; data: ParsedClientRow | null } {
  const errors: ValidationError[] = []

  // Clean up empty strings
  const cleaned = { ...row }
  if (cleaned.email === '') cleaned.email = undefined
  if (cleaned.phone === '') cleaned.phone = undefined

  // Validate email format if provided
  if (cleaned.email && !emailRegex.test(cleaned.email)) {
    errors.push({
      row: rowIndex,
      field: 'email',
      message: 'Invalid email format',
      value: cleaned.email,
    })
  }

  // Validate phone format if provided
  if (cleaned.phone && !phoneRegex.test(cleaned.phone)) {
    errors.push({
      row: rowIndex,
      field: 'phone',
      message: 'Invalid phone format',
      value: cleaned.phone,
    })
  }

  // Validate budget range
  if (cleaned.budgetMin !== undefined && cleaned.budgetMax !== undefined) {
    if (cleaned.budgetMin > cleaned.budgetMax) {
      errors.push({
        row: rowIndex,
        field: 'budgetMin',
        message: 'Minimum budget cannot exceed maximum budget',
        value: `${cleaned.budgetMin} > ${cleaned.budgetMax}`,
      })
    }
  }

  // Use Zod for overall validation
  const result = clientRowSchema.safeParse(cleaned)

  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = issue.path[0] as string
      // Don't duplicate errors we already added
      if (!errors.some((e) => e.field === field)) {
        errors.push({
          row: rowIndex,
          field,
          message: issue.message,
          value: String((cleaned as Record<string, unknown>)[field] || ''),
        })
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, data: null }
  }

  return {
    valid: true,
    errors: [],
    data: cleaned as ParsedClientRow,
  }
}

export function validateAllRows(
  rows: string[][],
  headers: string[],
  mappings: ColumnMapping[]
): {
  validRows: ParsedClientRow[]
  errors: ValidationError[]
} {
  const validRows: ParsedClientRow[] = []
  const allErrors: ValidationError[] = []

  for (let i = 0; i < rows.length; i++) {
    const transformed = transformRow(rows[i], headers, mappings)
    const { valid, errors, data } = validateRow(transformed, i + 1) // 1-indexed for user display

    if (valid && data) {
      validRows.push(data)
    } else {
      allErrors.push(...errors)
    }
  }

  return { validRows, errors: allErrors }
}
