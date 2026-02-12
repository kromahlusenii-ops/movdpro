import { transformRow, validateRow, validateAllRows } from '@/lib/import/validate-row'
import type { ColumnMapping } from '@/types/client-import'

describe('transformRow', () => {
  const headers = ['Name', 'Email', 'Budget Min', 'Budget Max', 'Has Dog', 'Status']
  const mappings: ColumnMapping[] = [
    { sourceColumn: 'Name', targetField: 'name', confidence: 1.0 },
    { sourceColumn: 'Email', targetField: 'email', confidence: 1.0 },
    { sourceColumn: 'Budget Min', targetField: 'budgetMin', confidence: 1.0 },
    { sourceColumn: 'Budget Max', targetField: 'budgetMax', confidence: 1.0 },
    { sourceColumn: 'Has Dog', targetField: 'hasDog', confidence: 1.0 },
    { sourceColumn: 'Status', targetField: 'status', confidence: 1.0 },
  ]

  it('transforms a row with all fields', () => {
    const row = ['John Doe', 'john@test.com', '1500', '2500', 'yes', 'active']

    const result = transformRow(row, headers, mappings)

    expect(result.name).toBe('John Doe')
    expect(result.email).toBe('john@test.com')
    expect(result.budgetMin).toBe(1500)
    expect(result.budgetMax).toBe(2500)
    expect(result.hasDog).toBe(true)
    expect(result.status).toBe('active')
  })

  it('handles missing optional fields', () => {
    const row = ['Jane Smith', '', '', '', '', '']

    const result = transformRow(row, headers, mappings)

    expect(result.name).toBe('Jane Smith')
    expect(result.email).toBeUndefined()
    expect(result.budgetMin).toBeUndefined()
    // Empty string for boolean is parsed as false
    expect(result.hasDog).toBe(false)
  })

  it('parses boolean values correctly', () => {
    const testCases = [
      ['yes', true],
      ['YES', true],
      ['true', true],
      ['1', true],
      ['y', true],
      ['x', true],
      ['no', false],
      ['NO', false],
      ['false', false],
      ['0', false],
      ['n', false],
      ['', false],
    ]

    for (const [input, expected] of testCases) {
      const row = ['Test', '', '', '', input as string, '']
      const result = transformRow(row, headers, mappings)
      expect(result.hasDog).toBe(expected)
    }
  })

  it('parses budget with currency symbols', () => {
    const row = ['Test', '', '$1,500', '$2,500.00', '', '']

    const result = transformRow(row, headers, mappings)

    expect(result.budgetMin).toBe(1500)
    expect(result.budgetMax).toBe(2500)
  })

  it('maps CRM status values', () => {
    const statusTests = [
      ['lead', 'active'],
      ['new', 'active'],
      ['working', 'active'],
      ['qualified', 'active'],
      ['closed', 'placed'],
      ['won', 'placed'],
      ['converted', 'placed'],
      ['closed won', 'placed'],
      ['lost', 'archived'],
      ['closed lost', 'archived'],
      ['inactive', 'archived'],
    ]

    for (const [input, expected] of statusTests) {
      const row = ['Test', '', '', '', '', input]
      const result = transformRow(row, headers, mappings)
      expect(result.status).toBe(expected)
    }
  })

  it('ignores unmapped columns', () => {
    const partialMappings: ColumnMapping[] = [
      { sourceColumn: 'Name', targetField: 'name', confidence: 1.0 },
      { sourceColumn: 'Email', targetField: null, confidence: 0 },
    ]

    const row = ['John', 'john@test.com', '', '', '', '']
    const result = transformRow(row, headers, partialMappings)

    expect(result.name).toBe('John')
    expect(result.email).toBeUndefined()
  })
})

describe('validateRow', () => {
  it('validates a complete valid row', () => {
    const row = {
      name: 'John Doe',
      email: 'john@test.com',
      phone: '555-123-4567',
      budgetMin: 1500,
      budgetMax: 2500,
    }

    const result = validateRow(row, 1)

    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.data).toEqual(row)
  })

  it('requires name field', () => {
    const row = {
      email: 'test@test.com',
    }

    const result = validateRow(row, 1)

    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.field === 'name')).toBe(true)
  })

  it('rejects empty name', () => {
    const row = {
      name: '',
      email: 'test@test.com',
    }

    const result = validateRow(row, 1)

    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.field === 'name')).toBe(true)
  })

  it('validates email format', () => {
    const row = {
      name: 'Test',
      email: 'not-an-email',
    }

    const result = validateRow(row, 1)

    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.field === 'email')).toBe(true)
  })

  it('allows empty email', () => {
    const row = {
      name: 'Test',
      email: '',
    }

    const result = validateRow(row, 1)

    expect(result.valid).toBe(true)
  })

  it('validates phone format', () => {
    const validPhones = ['555-123-4567', '(555) 123-4567', '+1 555 123 4567', '5551234567']
    const invalidPhones = ['call me', 'abc123']

    for (const phone of validPhones) {
      const result = validateRow({ name: 'Test', phone }, 1)
      expect(result.valid).toBe(true)
    }

    for (const phone of invalidPhones) {
      const result = validateRow({ name: 'Test', phone }, 1)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.field === 'phone')).toBe(true)
    }
  })

  it('validates budget range', () => {
    const row = {
      name: 'Test',
      budgetMin: 3000,
      budgetMax: 2000,
    }

    const result = validateRow(row, 1)

    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.message.includes('Minimum budget cannot exceed'))).toBe(true)
  })

  it('includes row number in errors', () => {
    const row = { name: '' }

    const result = validateRow(row, 5)

    expect(result.errors[0].row).toBe(5)
  })
})

describe('validateAllRows', () => {
  const headers = ['Name', 'Email']
  const mappings: ColumnMapping[] = [
    { sourceColumn: 'Name', targetField: 'name', confidence: 1.0 },
    { sourceColumn: 'Email', targetField: 'email', confidence: 1.0 },
  ]

  it('validates multiple rows', () => {
    const rows = [
      ['John', 'john@test.com'],
      ['Jane', 'jane@test.com'],
    ]

    const result = validateAllRows(rows, headers, mappings)

    expect(result.validRows).toHaveLength(2)
    expect(result.errors).toHaveLength(0)
  })

  it('separates valid and invalid rows', () => {
    const rows = [
      ['John', 'john@test.com'],
      ['', 'invalid'], // Missing name and invalid email
      ['Jane', 'jane@test.com'],
    ]

    const result = validateAllRows(rows, headers, mappings)

    expect(result.validRows).toHaveLength(2)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('uses 1-indexed row numbers for errors', () => {
    const rows = [
      ['', ''], // Row 1 - invalid
    ]

    const result = validateAllRows(rows, headers, mappings)

    expect(result.errors[0].row).toBe(1)
  })
})
