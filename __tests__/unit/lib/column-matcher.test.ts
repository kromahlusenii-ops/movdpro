import {
  matchColumn,
  matchAllColumns,
  getUnmappedRequiredFields,
  updateMapping,
} from '@/lib/import/column-matcher'
import { MAPPABLE_FIELDS } from '@/types/client-import'

describe('matchColumn', () => {
  it('matches exact field key', () => {
    const result = matchColumn('name')
    expect(result.targetField).toBe('name')
    expect(result.confidence).toBe(1.0)
  })

  it('matches exact field label', () => {
    const result = matchColumn('Budget Max')
    expect(result.targetField).toBe('budgetMax')
    expect(result.confidence).toBe(1.0)
  })

  it('matches alias exactly', () => {
    const result = matchColumn('Full Name')
    expect(result.targetField).toBe('name')
    expect(result.confidence).toBe(0.95)
  })

  it('matches alias with different case', () => {
    const result = matchColumn('FULL NAME')
    expect(result.targetField).toBe('name')
    expect(result.confidence).toBe(0.95)
  })

  it('fuzzy matches similar text', () => {
    const result = matchColumn('Client Name')
    expect(result.targetField).toBe('name')
    expect(result.confidence).toBeGreaterThan(0.4)
  })

  it('matches email variations', () => {
    expect(matchColumn('Email Address').targetField).toBe('email')
    expect(matchColumn('E-mail').targetField).toBe('email')
    expect(matchColumn('Contact Email').targetField).toBe('email')
  })

  it('matches phone variations', () => {
    expect(matchColumn('Phone Number').targetField).toBe('phone')
    expect(matchColumn('Mobile').targetField).toBe('phone')
    expect(matchColumn('Cell').targetField).toBe('phone')
  })

  it('matches budget variations', () => {
    expect(matchColumn('Min Budget').targetField).toBe('budgetMin')
    expect(matchColumn('Max Budget').targetField).toBe('budgetMax')
    expect(matchColumn('Budget High').targetField).toBe('budgetMax')
  })

  it('matches HubSpot/CRM field names', () => {
    expect(matchColumn('Lifecycle Stage').targetField).toBe('status')
    expect(matchColumn('Lead Status').targetField).toBe('status')
  })

  it('returns null for unrecognized columns', () => {
    const result = matchColumn('xyzabc123')
    expect(result.targetField).toBeNull()
    expect(result.confidence).toBe(0)
  })

  it('returns low confidence for very short/generic columns', () => {
    const result = matchColumn('xyz123abc')
    // Random string should not match any field well
    expect(result.targetField).toBeNull()
  })
})

describe('matchAllColumns', () => {
  it('matches multiple columns', () => {
    const headers = ['Full Name', 'Email', 'Phone Number', 'Notes']
    const mappings = matchAllColumns(headers)

    expect(mappings).toHaveLength(4)
    expect(mappings.find((m) => m.sourceColumn === 'Full Name')?.targetField).toBe('name')
    expect(mappings.find((m) => m.sourceColumn === 'Email')?.targetField).toBe('email')
    expect(mappings.find((m) => m.sourceColumn === 'Phone Number')?.targetField).toBe('phone')
    expect(mappings.find((m) => m.sourceColumn === 'Notes')?.targetField).toBe('notes')
  })

  it('prevents duplicate field assignments', () => {
    // Two columns that could both match "name"
    const headers = ['Name', 'Full Name', 'Contact Name']
    const mappings = matchAllColumns(headers)

    const nameMappings = mappings.filter((m) => m.targetField === 'name')
    expect(nameMappings).toHaveLength(1)
  })

  it('prioritizes higher confidence matches', () => {
    const headers = ['Contact Name', 'Name']
    const mappings = matchAllColumns(headers)

    // "Name" should get the mapping because it's exact match (confidence 1.0)
    const nameMapping = mappings.find((m) => m.targetField === 'name')
    expect(nameMapping?.sourceColumn).toBe('Name')
  })

  it('handles mixed recognizable and unrecognizable columns', () => {
    const headers = ['Name', 'Unknown Column', 'Email', 'Random Data']
    const mappings = matchAllColumns(headers)

    expect(mappings.find((m) => m.sourceColumn === 'Name')?.targetField).toBe('name')
    expect(mappings.find((m) => m.sourceColumn === 'Email')?.targetField).toBe('email')
    expect(mappings.find((m) => m.sourceColumn === 'Unknown Column')?.targetField).toBeNull()
    expect(mappings.find((m) => m.sourceColumn === 'Random Data')?.targetField).toBeNull()
  })

  it('returns mappings in original header order', () => {
    const headers = ['Notes', 'Name', 'Email']
    const mappings = matchAllColumns(headers)

    expect(mappings[0].sourceColumn).toBe('Notes')
    expect(mappings[1].sourceColumn).toBe('Name')
    expect(mappings[2].sourceColumn).toBe('Email')
  })
})

describe('getUnmappedRequiredFields', () => {
  it('returns required fields that are not mapped', () => {
    const mappings = [
      { sourceColumn: 'Email', targetField: 'email', confidence: 1.0 },
      { sourceColumn: 'Phone', targetField: 'phone', confidence: 1.0 },
    ]

    const unmapped = getUnmappedRequiredFields(mappings)

    expect(unmapped.some((f) => f.key === 'name')).toBe(true)
  })

  it('returns empty array when all required fields are mapped', () => {
    const mappings = [
      { sourceColumn: 'Name', targetField: 'name', confidence: 1.0 },
    ]

    const unmapped = getUnmappedRequiredFields(mappings)

    expect(unmapped).toHaveLength(0)
  })
})

describe('updateMapping', () => {
  it('updates a mapping to a new target field', () => {
    const mappings = [
      { sourceColumn: 'Column A', targetField: null, confidence: 0 },
      { sourceColumn: 'Column B', targetField: 'email', confidence: 1.0 },
    ]

    const updated = updateMapping(mappings, 'Column A', 'name')

    expect(updated.find((m) => m.sourceColumn === 'Column A')?.targetField).toBe('name')
    expect(updated.find((m) => m.sourceColumn === 'Column A')?.confidence).toBe(1.0)
  })

  it('clears previous mapping when reassigning a field', () => {
    const mappings = [
      { sourceColumn: 'Column A', targetField: 'name', confidence: 1.0 },
      { sourceColumn: 'Column B', targetField: null, confidence: 0 },
    ]

    const updated = updateMapping(mappings, 'Column B', 'name')

    expect(updated.find((m) => m.sourceColumn === 'Column A')?.targetField).toBeNull()
    expect(updated.find((m) => m.sourceColumn === 'Column B')?.targetField).toBe('name')
  })

  it('clears a mapping when setting to null', () => {
    const mappings = [
      { sourceColumn: 'Column A', targetField: 'name', confidence: 1.0 },
    ]

    const updated = updateMapping(mappings, 'Column A', null)

    expect(updated.find((m) => m.sourceColumn === 'Column A')?.targetField).toBeNull()
    expect(updated.find((m) => m.sourceColumn === 'Column A')?.confidence).toBe(0)
  })
})
