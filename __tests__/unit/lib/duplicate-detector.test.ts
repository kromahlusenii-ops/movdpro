import {
  detectDuplicates,
  filterDuplicates,
  updateDuplicateResolution,
  setAllDuplicateResolutions,
} from '@/lib/import/duplicate-detector'
import type { ParsedClientRow } from '@/types/client-import'

describe('detectDuplicates', () => {
  const existingClients = [
    { id: '1', name: 'John Doe', email: 'john@test.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@test.com' },
    { id: '3', name: 'No Email', email: null },
  ]

  it('detects duplicate by email', () => {
    const importedRows: ParsedClientRow[] = [
      { name: 'John D', email: 'john@test.com' },
    ]

    const duplicates = detectDuplicates(importedRows, existingClients)

    expect(duplicates).toHaveLength(1)
    expect(duplicates[0].existingClient.id).toBe('1')
    expect(duplicates[0].rowIndex).toBe(0)
  })

  it('handles case-insensitive email matching', () => {
    const importedRows: ParsedClientRow[] = [
      { name: 'John', email: 'JOHN@TEST.COM' },
    ]

    const duplicates = detectDuplicates(importedRows, existingClients)

    expect(duplicates).toHaveLength(1)
  })

  it('handles email with whitespace', () => {
    const importedRows: ParsedClientRow[] = [
      { name: 'John', email: '  john@test.com  ' },
    ]

    const duplicates = detectDuplicates(importedRows, existingClients)

    expect(duplicates).toHaveLength(1)
  })

  it('does not flag rows without email', () => {
    const importedRows: ParsedClientRow[] = [
      { name: 'New Person' },
      { name: 'Another Person', email: '' },
    ]

    const duplicates = detectDuplicates(importedRows, existingClients)

    expect(duplicates).toHaveLength(0)
  })

  it('detects multiple duplicates', () => {
    const importedRows: ParsedClientRow[] = [
      { name: 'John', email: 'john@test.com' },
      { name: 'New Person', email: 'new@test.com' },
      { name: 'Jane', email: 'jane@test.com' },
    ]

    const duplicates = detectDuplicates(importedRows, existingClients)

    expect(duplicates).toHaveLength(2)
    expect(duplicates[0].rowIndex).toBe(0)
    expect(duplicates[1].rowIndex).toBe(2)
  })

  it('initializes resolution as null', () => {
    const importedRows: ParsedClientRow[] = [
      { name: 'John', email: 'john@test.com' },
    ]

    const duplicates = detectDuplicates(importedRows, existingClients)

    expect(duplicates[0].resolution).toBeNull()
  })
})

describe('filterDuplicates', () => {
  const validRows: ParsedClientRow[] = [
    { name: 'John', email: 'john@test.com' },
    { name: 'New Person', email: 'new@test.com' },
    { name: 'Jane', email: 'jane@test.com' },
  ]

  it('filters out skipped duplicates', () => {
    const duplicates = [
      {
        importedRow: validRows[0],
        existingClient: { id: '1', name: 'John', email: 'john@test.com' },
        rowIndex: 0,
        resolution: 'skip' as const,
      },
    ]

    const result = filterDuplicates(validRows, duplicates)

    expect(result.toImport).toHaveLength(2)
    expect(result.toSkip).toHaveLength(1)
    expect(result.toOverwrite).toHaveLength(0)
  })

  it('separates overwrite duplicates', () => {
    const duplicates = [
      {
        importedRow: validRows[0],
        existingClient: { id: '1', name: 'John', email: 'john@test.com' },
        rowIndex: 0,
        resolution: 'overwrite' as const,
      },
    ]

    const result = filterDuplicates(validRows, duplicates)

    expect(result.toImport).toHaveLength(2)
    expect(result.toSkip).toHaveLength(0)
    expect(result.toOverwrite).toHaveLength(1)
    expect(result.toOverwrite[0].existingId).toBe('1')
  })

  it('skips by default when resolution is null', () => {
    const duplicates = [
      {
        importedRow: validRows[0],
        existingClient: { id: '1', name: 'John', email: 'john@test.com' },
        rowIndex: 0,
        resolution: null,
      },
    ]

    const result = filterDuplicates(validRows, duplicates)

    expect(result.toSkip).toHaveLength(1)
    expect(result.toOverwrite).toHaveLength(0)
  })

  it('handles multiple duplicates with different resolutions', () => {
    const duplicates = [
      {
        importedRow: validRows[0],
        existingClient: { id: '1', name: 'John', email: 'john@test.com' },
        rowIndex: 0,
        resolution: 'skip' as const,
      },
      {
        importedRow: validRows[2],
        existingClient: { id: '2', name: 'Jane', email: 'jane@test.com' },
        rowIndex: 2,
        resolution: 'overwrite' as const,
      },
    ]

    const result = filterDuplicates(validRows, duplicates)

    expect(result.toImport).toHaveLength(1)
    expect(result.toImport[0].name).toBe('New Person')
    expect(result.toSkip).toHaveLength(1)
    expect(result.toOverwrite).toHaveLength(1)
  })
})

describe('updateDuplicateResolution', () => {
  it('updates resolution for specific row', () => {
    const duplicates = [
      {
        importedRow: { name: 'John' },
        existingClient: { id: '1', name: 'John', email: 'john@test.com' },
        rowIndex: 0,
        resolution: null,
      },
      {
        importedRow: { name: 'Jane' },
        existingClient: { id: '2', name: 'Jane', email: 'jane@test.com' },
        rowIndex: 2,
        resolution: null,
      },
    ]

    const updated = updateDuplicateResolution(duplicates, 0, 'overwrite')

    expect(updated[0].resolution).toBe('overwrite')
    expect(updated[1].resolution).toBeNull()
  })
})

describe('setAllDuplicateResolutions', () => {
  it('sets all resolutions to skip', () => {
    const duplicates = [
      {
        importedRow: { name: 'John' },
        existingClient: { id: '1', name: 'John', email: 'john@test.com' },
        rowIndex: 0,
        resolution: null,
      },
      {
        importedRow: { name: 'Jane' },
        existingClient: { id: '2', name: 'Jane', email: 'jane@test.com' },
        rowIndex: 2,
        resolution: 'overwrite' as const,
      },
    ]

    const updated = setAllDuplicateResolutions(duplicates, 'skip')

    expect(updated[0].resolution).toBe('skip')
    expect(updated[1].resolution).toBe('skip')
  })

  it('sets all resolutions to overwrite', () => {
    const duplicates = [
      {
        importedRow: { name: 'John' },
        existingClient: { id: '1', name: 'John', email: 'john@test.com' },
        rowIndex: 0,
        resolution: null,
      },
    ]

    const updated = setAllDuplicateResolutions(duplicates, 'overwrite')

    expect(updated[0].resolution).toBe('overwrite')
  })
})
