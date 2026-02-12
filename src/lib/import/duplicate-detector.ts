import type { ParsedClientRow, DuplicateMatch } from '@/types/client-import'

interface ExistingClient {
  id: string
  name: string
  email: string | null
}

function normalizeEmail(email: string | undefined | null): string | null {
  if (!email) return null
  return email.toLowerCase().trim()
}

export function detectDuplicates(
  importedRows: ParsedClientRow[],
  existingClients: ExistingClient[]
): DuplicateMatch[] {
  const duplicates: DuplicateMatch[] = []

  // Create lookup map for existing clients by email
  const existingByEmail = new Map<string, ExistingClient>()
  for (const client of existingClients) {
    const email = normalizeEmail(client.email)
    if (email) {
      existingByEmail.set(email, client)
    }
  }

  // Check each imported row against existing clients
  for (let i = 0; i < importedRows.length; i++) {
    const row = importedRows[i]
    const email = normalizeEmail(row.email)

    if (email) {
      const existing = existingByEmail.get(email)
      if (existing) {
        duplicates.push({
          importedRow: row,
          existingClient: {
            id: existing.id,
            name: existing.name,
            email: existing.email || '',
          },
          rowIndex: i,
          resolution: null,
        })
      }
    }
  }

  return duplicates
}

export function filterDuplicates(
  validRows: ParsedClientRow[],
  duplicates: DuplicateMatch[]
): {
  toImport: ParsedClientRow[]
  toSkip: ParsedClientRow[]
  toOverwrite: { row: ParsedClientRow; existingId: string }[]
} {
  const duplicateIndices = new Set(duplicates.map((d) => d.rowIndex))
  const toSkip: ParsedClientRow[] = []
  const toOverwrite: { row: ParsedClientRow; existingId: string }[] = []
  const toImport: ParsedClientRow[] = []

  for (let i = 0; i < validRows.length; i++) {
    const row = validRows[i]

    if (duplicateIndices.has(i)) {
      const duplicate = duplicates.find((d) => d.rowIndex === i)
      if (duplicate) {
        if (duplicate.resolution === 'skip') {
          toSkip.push(row)
        } else if (duplicate.resolution === 'overwrite') {
          toOverwrite.push({ row, existingId: duplicate.existingClient.id })
        }
        // If resolution is null, we skip by default
        else {
          toSkip.push(row)
        }
      }
    } else {
      toImport.push(row)
    }
  }

  return { toImport, toSkip, toOverwrite }
}

export function updateDuplicateResolution(
  duplicates: DuplicateMatch[],
  rowIndex: number,
  resolution: 'skip' | 'overwrite'
): DuplicateMatch[] {
  return duplicates.map((d) =>
    d.rowIndex === rowIndex ? { ...d, resolution } : d
  )
}

export function setAllDuplicateResolutions(
  duplicates: DuplicateMatch[],
  resolution: 'skip' | 'overwrite'
): DuplicateMatch[] {
  return duplicates.map((d) => ({ ...d, resolution }))
}
