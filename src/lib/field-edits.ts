import prisma from './db'
import { Prisma } from '@prisma/client'
import type {
  EditableFieldName,
  EditSource,
  EditTargetType,
  FieldEditRecord,
  FieldWithEdit,
} from '@/types/field-edits'

/**
 * Check if a field has a locator edit (for "sticky" edits feature)
 * When a locator has edited a field, scrapers should not overwrite it
 */
export async function hasLocatorEdit(
  targetType: EditTargetType,
  targetId: string,
  fieldName: EditableFieldName
): Promise<boolean> {
  const edit = await prisma.fieldEdit.findFirst({
    where: {
      ...(targetType === 'unit' ? { unitId: targetId } : { buildingId: targetId }),
      fieldName,
      source: 'locator',
    },
  })
  return !!edit
}

/**
 * Get all field names that have locator edits for an entity
 * Useful for scrapers to know which fields to skip
 */
export async function getLocatorEditedFields(
  targetType: EditTargetType,
  targetId: string
): Promise<Set<string>> {
  const edits = await prisma.fieldEdit.findMany({
    where: {
      ...(targetType === 'unit' ? { unitId: targetId } : { buildingId: targetId }),
      source: 'locator',
    },
    select: { fieldName: true },
    distinct: ['fieldName'],
  })
  return new Set(edits.map(e => e.fieldName))
}

/**
 * Parse user name, falling back to email prefix if name is not set
 */
function parseEditorName(user: { name: string | null; email: string } | null | undefined): { firstName: string; lastName: string } {
  if (!user) return { firstName: '', lastName: '' }

  if (user.name) {
    const parts = user.name.split(' ')
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || '',
    }
  }

  // Use email prefix as name fallback
  const emailPrefix = user.email.split('@')[0]
  // Capitalize first letter
  return {
    firstName: emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1),
    lastName: '',
  }
}

/**
 * Get the current display value for a field, applying any locator edits as overlay
 */
export async function getFieldWithEdit<T>(
  targetType: EditTargetType,
  targetId: string,
  fieldName: EditableFieldName,
  scrapedValue: T
): Promise<FieldWithEdit<T>> {
  // Find the most recent edit for this field
  const lastEdit = await prisma.fieldEdit.findFirst({
    where: targetType === 'unit'
      ? { unitId: targetId, fieldName }
      : { buildingId: targetId, fieldName },
    orderBy: { createdAt: 'desc' },
    include: {
      editedBy: {
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      },
    },
  })

  if (!lastEdit) {
    return {
      currentValue: scrapedValue,
      scrapedValue,
      lastEdit: null,
      hasConflict: false,
    }
  }

  // Parse editor name
  const { firstName, lastName } = parseEditorName(lastEdit.editedBy?.user)

  const formattedEdit: FieldEditRecord = {
    id: lastEdit.id,
    unitId: lastEdit.unitId,
    buildingId: lastEdit.buildingId,
    fieldName: lastEdit.fieldName as EditableFieldName,
    previousValue: lastEdit.previousValue,
    newValue: lastEdit.newValue,
    source: lastEdit.source as EditSource,
    editedBy: lastEdit.editedBy ? {
      id: lastEdit.editedBy.id,
      firstName,
      lastName,
    } : null,
    hasConflict: lastEdit.hasConflict,
    conflictValue: lastEdit.conflictValue,
    createdAt: lastEdit.createdAt,
  }

  return {
    currentValue: lastEdit.newValue as T,
    scrapedValue,
    lastEdit: formattedEdit,
    hasConflict: lastEdit.hasConflict,
  }
}

/**
 * Create a new field edit record
 */
export async function createFieldEdit(
  targetType: EditTargetType,
  targetId: string,
  fieldName: EditableFieldName,
  newValue: Prisma.InputJsonValue,
  locatorId: string
): Promise<FieldEditRecord> {
  // Get the current value (either from last edit or scraped data)
  let previousValue: Prisma.InputJsonValue | null = null

  // First check for existing edits
  const existingEdit = await prisma.fieldEdit.findFirst({
    where: targetType === 'unit'
      ? { unitId: targetId, fieldName }
      : { buildingId: targetId, fieldName },
    orderBy: { createdAt: 'desc' },
  })

  if (existingEdit) {
    previousValue = existingEdit.newValue as Prisma.InputJsonValue
  } else {
    // Try to get from scraped data, but don't fail if field doesn't exist on model
    try {
      if (targetType === 'unit') {
        const unit = await prisma.unit.findUnique({
          where: { id: targetId },
          select: { [fieldName]: true },
        })
        const val = unit?.[fieldName as keyof typeof unit]
        previousValue = val !== undefined ? (val as Prisma.InputJsonValue) : null
      } else {
        const building = await prisma.building.findUnique({
          where: { id: targetId },
          select: { [fieldName]: true },
        })
        const val = building?.[fieldName as keyof typeof building]
        previousValue = val !== undefined ? (val as Prisma.InputJsonValue) : null
      }
    } catch {
      // Field doesn't exist on the model - that's OK, we'll treat it as null
      previousValue = null
    }
  }

  // Create the edit record
  const edit = await prisma.fieldEdit.create({
    data: {
      ...(targetType === 'unit' ? { unitId: targetId } : { buildingId: targetId }),
      fieldName,
      previousValue: previousValue ?? Prisma.JsonNull,
      newValue,
      source: 'locator',
      editedById: locatorId,
      hasConflict: false,
    },
    include: {
      editedBy: {
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      },
    },
  })

  // Parse editor name
  const { firstName, lastName } = parseEditorName(edit.editedBy?.user)

  return {
    id: edit.id,
    unitId: edit.unitId,
    buildingId: edit.buildingId,
    fieldName: edit.fieldName as EditableFieldName,
    previousValue: edit.previousValue,
    newValue: edit.newValue,
    source: edit.source as EditSource,
    editedBy: edit.editedBy ? {
      id: edit.editedBy.id,
      firstName,
      lastName,
    } : null,
    hasConflict: edit.hasConflict,
    conflictValue: edit.conflictValue,
    createdAt: edit.createdAt,
  }
}

/**
 * Get edit history for a specific field
 */
export async function getFieldEditHistory(
  targetType: EditTargetType,
  targetId: string,
  fieldName: EditableFieldName
): Promise<FieldEditRecord[]> {
  const edits = await prisma.fieldEdit.findMany({
    where: targetType === 'unit'
      ? { unitId: targetId, fieldName }
      : { buildingId: targetId, fieldName },
    orderBy: { createdAt: 'desc' },
    include: {
      editedBy: {
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      },
    },
  })

  return edits.map((edit) => {
    const { firstName, lastName } = parseEditorName(edit.editedBy?.user)

    return {
      id: edit.id,
      unitId: edit.unitId,
      buildingId: edit.buildingId,
      fieldName: edit.fieldName as EditableFieldName,
      previousValue: edit.previousValue,
      newValue: edit.newValue,
      source: edit.source as EditSource,
      editedBy: edit.editedBy ? {
        id: edit.editedBy.id,
        firstName,
        lastName,
      } : null,
      hasConflict: edit.hasConflict,
      conflictValue: edit.conflictValue,
      createdAt: edit.createdAt,
    }
  })
}

/**
 * Get all field edits for an entity (unit or building)
 */
export async function getEntityFieldEdits(
  targetType: EditTargetType,
  targetId: string
): Promise<Map<string, FieldEditRecord>> {
  const edits = await prisma.fieldEdit.findMany({
    where: targetType === 'unit'
      ? { unitId: targetId }
      : { buildingId: targetId },
    orderBy: { createdAt: 'desc' },
    include: {
      editedBy: {
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      },
    },
  })

  // Group by field name, keeping only the most recent edit for each field
  const editsByField = new Map<string, FieldEditRecord>()

  for (const edit of edits) {
    if (!editsByField.has(edit.fieldName)) {
      const { firstName, lastName } = parseEditorName(edit.editedBy?.user)

      editsByField.set(edit.fieldName, {
        id: edit.id,
        unitId: edit.unitId,
        buildingId: edit.buildingId,
        fieldName: edit.fieldName as EditableFieldName,
        previousValue: edit.previousValue,
        newValue: edit.newValue,
        source: edit.source as EditSource,
        editedBy: edit.editedBy ? {
          id: edit.editedBy.id,
          firstName,
          lastName,
        } : null,
        hasConflict: edit.hasConflict,
        conflictValue: edit.conflictValue,
        createdAt: edit.createdAt,
      })
    }
  }

  return editsByField
}

/**
 * Resolve a conflict between locator edit and scraped value
 */
export async function resolveConflict(
  editId: string,
  resolution: 'keep_locator' | 'accept_scraper',
  locatorId: string
): Promise<void> {
  const edit = await prisma.fieldEdit.findUnique({
    where: { id: editId },
  })

  if (!edit || !edit.hasConflict) {
    throw new Error('Edit not found or no conflict to resolve')
  }

  if (resolution === 'keep_locator') {
    // Just clear the conflict flag, keeping the locator's value
    await prisma.fieldEdit.update({
      where: { id: editId },
      data: {
        hasConflict: false,
        conflictValue: Prisma.JsonNull,
      },
    })
  } else {
    // Accept scraper value: create a new edit with the scraped value
    await prisma.fieldEdit.create({
      data: {
        unitId: edit.unitId,
        buildingId: edit.buildingId,
        fieldName: edit.fieldName,
        previousValue: edit.newValue ?? Prisma.JsonNull,
        newValue: edit.conflictValue ?? Prisma.JsonNull,
        source: 'locator', // Locator approved the scraper value
        editedById: locatorId,
        hasConflict: false,
      },
    })

    // Clear the conflict on the old edit
    await prisma.fieldEdit.update({
      where: { id: editId },
      data: {
        hasConflict: false,
      },
    })
  }
}

/**
 * Record a new scraped value and detect conflicts with existing locator edits
 * Call this from scrapers when updating field values
 */
export async function recordScraperValue(
  targetType: EditTargetType,
  targetId: string,
  fieldName: EditableFieldName,
  newScrapedValue: Prisma.InputJsonValue
): Promise<{ hasConflict: boolean }> {
  // Check for existing locator edits
  const existingEdit = await prisma.fieldEdit.findFirst({
    where: {
      ...(targetType === 'unit' ? { unitId: targetId } : { buildingId: targetId }),
      fieldName,
      source: 'locator',
    },
    orderBy: { createdAt: 'desc' },
  })

  // If no locator edit exists, no conflict possible
  if (!existingEdit) {
    return { hasConflict: false }
  }

  // Compare values (handle JSON comparison)
  const locatorValue = existingEdit.newValue
  const valuesMatch = JSON.stringify(locatorValue) === JSON.stringify(newScrapedValue)

  if (valuesMatch) {
    // Values match, no conflict
    return { hasConflict: false }
  }

  // Values differ - flag the conflict
  await prisma.fieldEdit.update({
    where: { id: existingEdit.id },
    data: {
      hasConflict: true,
      conflictValue: newScrapedValue,
    },
  })

  return { hasConflict: true }
}

/**
 * Get all unresolved conflicts
 */
export async function getUnresolvedConflicts(): Promise<FieldEditRecord[]> {
  const edits = await prisma.fieldEdit.findMany({
    where: { hasConflict: true },
    orderBy: { createdAt: 'desc' },
    include: {
      editedBy: {
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      },
      unit: {
        include: {
          building: {
            select: { id: true, name: true, address: true },
          },
        },
      },
      building: {
        select: { id: true, name: true, address: true },
      },
    },
  })

  return edits.map((edit) => {
    const { firstName, lastName } = parseEditorName(edit.editedBy?.user)

    return {
      id: edit.id,
      unitId: edit.unitId,
      buildingId: edit.buildingId,
      fieldName: edit.fieldName as EditableFieldName,
      previousValue: edit.previousValue,
      newValue: edit.newValue,
      source: edit.source as EditSource,
      editedBy: edit.editedBy ? {
        id: edit.editedBy.id,
        firstName,
        lastName,
      } : null,
      hasConflict: edit.hasConflict,
      conflictValue: edit.conflictValue,
      createdAt: edit.createdAt,
    }
  })
}
