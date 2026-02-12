import { compareTwoStrings } from 'string-similarity'
import type { ColumnMapping, MappableField } from '@/types/client-import'
import { MAPPABLE_FIELDS } from '@/types/client-import'

const CONFIDENCE_THRESHOLD = 0.4

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function matchColumn(header: string, fields: MappableField[] = MAPPABLE_FIELDS): ColumnMapping {
  const normalizedHeader = normalizeString(header)

  let bestMatch: { field: string | null; confidence: number } = {
    field: null,
    confidence: 0,
  }

  for (const field of fields) {
    // Check exact match with key
    if (normalizedHeader === normalizeString(field.key)) {
      return {
        sourceColumn: header,
        targetField: field.key,
        confidence: 1.0,
      }
    }

    // Check exact match with label
    if (normalizedHeader === normalizeString(field.label)) {
      return {
        sourceColumn: header,
        targetField: field.key,
        confidence: 1.0,
      }
    }

    // Check exact match with aliases
    for (const alias of field.aliases) {
      if (normalizedHeader === normalizeString(alias)) {
        return {
          sourceColumn: header,
          targetField: field.key,
          confidence: 0.95,
        }
      }
    }

    // Fuzzy match with key
    const keyScore = compareTwoStrings(normalizedHeader, normalizeString(field.key))
    if (keyScore > bestMatch.confidence) {
      bestMatch = { field: field.key, confidence: keyScore }
    }

    // Fuzzy match with label
    const labelScore = compareTwoStrings(normalizedHeader, normalizeString(field.label))
    if (labelScore > bestMatch.confidence) {
      bestMatch = { field: field.key, confidence: labelScore }
    }

    // Fuzzy match with aliases
    for (const alias of field.aliases) {
      const aliasScore = compareTwoStrings(normalizedHeader, normalizeString(alias))
      if (aliasScore > bestMatch.confidence) {
        bestMatch = { field: field.key, confidence: aliasScore }
      }
    }
  }

  // Only return match if confidence exceeds threshold
  if (bestMatch.confidence >= CONFIDENCE_THRESHOLD) {
    return {
      sourceColumn: header,
      targetField: bestMatch.field,
      confidence: bestMatch.confidence,
    }
  }

  return {
    sourceColumn: header,
    targetField: null,
    confidence: 0,
  }
}

export function matchAllColumns(headers: string[], fields: MappableField[] = MAPPABLE_FIELDS): ColumnMapping[] {
  const mappings: ColumnMapping[] = []
  const usedFields = new Set<string>()

  // First pass: get all potential matches with confidence scores
  const allMatches = headers.map((header) => {
    const match = matchColumn(header, fields)
    return {
      ...match,
      header,
    }
  })

  // Sort by confidence (descending) to prioritize high-confidence matches
  const sortedMatches = [...allMatches].sort((a, b) => b.confidence - a.confidence)

  // Assign fields, ensuring no duplicates
  const finalMappings = new Map<string, ColumnMapping>()

  for (const match of sortedMatches) {
    if (match.targetField && !usedFields.has(match.targetField)) {
      usedFields.add(match.targetField)
      finalMappings.set(match.header, {
        sourceColumn: match.header,
        targetField: match.targetField,
        confidence: match.confidence,
      })
    } else if (!finalMappings.has(match.header)) {
      // No target field or already used
      finalMappings.set(match.header, {
        sourceColumn: match.header,
        targetField: null,
        confidence: 0,
      })
    }
  }

  // Return mappings in original header order
  return headers.map((header) => finalMappings.get(header)!)
}

export function getUnmappedRequiredFields(mappings: ColumnMapping[], fields: MappableField[] = MAPPABLE_FIELDS): MappableField[] {
  const mappedFields = new Set(mappings.filter((m) => m.targetField).map((m) => m.targetField))
  return fields.filter((field) => field.required && !mappedFields.has(field.key))
}

export function updateMapping(
  mappings: ColumnMapping[],
  sourceColumn: string,
  newTargetField: string | null
): ColumnMapping[] {
  // If assigning to a new field, first clear it from any other mapping
  if (newTargetField) {
    mappings = mappings.map((m) =>
      m.targetField === newTargetField
        ? { ...m, targetField: null, confidence: 0 }
        : m
    )
  }

  // Update the target mapping
  return mappings.map((m) =>
    m.sourceColumn === sourceColumn
      ? { ...m, targetField: newTargetField, confidence: newTargetField ? 1.0 : 0 }
      : m
  )
}
