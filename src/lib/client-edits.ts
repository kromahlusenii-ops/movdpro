import prisma from './db'
import { Prisma } from '@prisma/client'
import type {
  ClientEditableFieldName,
  ClientFieldEditRecord,
  ClientFieldEditEditor,
} from '@/types/client-edits'

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
  return {
    firstName: emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1),
    lastName: '',
  }
}

/**
 * Create a new client field edit record
 */
export async function createClientFieldEdit(
  clientId: string,
  fieldName: ClientEditableFieldName,
  newValue: Prisma.InputJsonValue,
  locatorId: string,
  previousValue?: Prisma.InputJsonValue | null
): Promise<ClientFieldEditRecord> {
  // If previous value not provided, get it from the client or last edit
  let prevVal: Prisma.InputJsonValue | null = previousValue ?? null

  if (previousValue === undefined) {
    // First check for existing edits
    const existingEdit = await prisma.clientFieldEdit.findFirst({
      where: { clientId, fieldName },
      orderBy: { createdAt: 'desc' },
    })

    if (existingEdit) {
      prevVal = existingEdit.newValue as Prisma.InputJsonValue
    } else {
      // Try to get from client record
      try {
        const client = await prisma.locatorClient.findUnique({
          where: { id: clientId },
        })
        if (client) {
          const val = client[fieldName as keyof typeof client]
          prevVal = val !== undefined ? (val as Prisma.InputJsonValue) : null
        }
      } catch {
        prevVal = null
      }
    }
  }

  // Create the edit record
  const edit = await prisma.clientFieldEdit.create({
    data: {
      clientId,
      fieldName,
      previousValue: prevVal ?? Prisma.JsonNull,
      newValue,
      editedById: locatorId,
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

  const { firstName, lastName } = parseEditorName(edit.editedBy?.user)

  return {
    id: edit.id,
    clientId: edit.clientId,
    fieldName: edit.fieldName as ClientEditableFieldName,
    previousValue: edit.previousValue,
    newValue: edit.newValue,
    editedBy: edit.editedBy ? {
      id: edit.editedBy.id,
      firstName,
      lastName,
    } : null,
    createdAt: edit.createdAt,
  }
}

/**
 * Get edit history for a specific client field
 */
export async function getClientFieldEditHistory(
  clientId: string,
  fieldName: ClientEditableFieldName
): Promise<ClientFieldEditRecord[]> {
  const edits = await prisma.clientFieldEdit.findMany({
    where: { clientId, fieldName },
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
      clientId: edit.clientId,
      fieldName: edit.fieldName as ClientEditableFieldName,
      previousValue: edit.previousValue,
      newValue: edit.newValue,
      editedBy: edit.editedBy ? {
        id: edit.editedBy.id,
        firstName,
        lastName,
      } : null,
      createdAt: edit.createdAt,
    }
  })
}

/**
 * Get the most recent edit for each field of a client
 */
export async function getClientLastEdits(
  clientId: string
): Promise<Map<string, ClientFieldEditRecord>> {
  const edits = await prisma.clientFieldEdit.findMany({
    where: { clientId },
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
  const editsByField = new Map<string, ClientFieldEditRecord>()

  for (const edit of edits) {
    if (!editsByField.has(edit.fieldName)) {
      const { firstName, lastName } = parseEditorName(edit.editedBy?.user)

      editsByField.set(edit.fieldName, {
        id: edit.id,
        clientId: edit.clientId,
        fieldName: edit.fieldName as ClientEditableFieldName,
        previousValue: edit.previousValue,
        newValue: edit.newValue,
        editedBy: edit.editedBy ? {
          id: edit.editedBy.id,
          firstName,
          lastName,
        } : null,
        createdAt: edit.createdAt,
      })
    }
  }

  return editsByField
}

/**
 * Serialize a Map of edits to a plain object for JSON response
 */
export function serializeEditsMap(
  editsMap: Map<string, ClientFieldEditRecord>
): Record<string, ClientFieldEditRecord> {
  const result: Record<string, ClientFieldEditRecord> = {}
  editsMap.forEach((value, key) => {
    result[key] = value
  })
  return result
}
