import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getSessionUserCached, getLocatorProfileCached } from '@/lib/pro-auth'
import { parseFileFromBuffer, ParseError } from '@/lib/import/parse-file'
import { validateAllRows } from '@/lib/import/validate-row'
import { detectDuplicates, filterDuplicates } from '@/lib/import/duplicate-detector'
import { getUnmappedRequiredFields } from '@/lib/import/column-matcher'
import prisma from '@/lib/db'
import type { ColumnMapping, DuplicateMatch, ImportResult } from '@/types/client-import'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUserCached()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const locator = await getLocatorProfileCached(user.id)

    if (!locator) {
      return NextResponse.json({ error: 'No locator profile' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const mappingsJson = formData.get('mappings') as string | null
    const duplicateResolutionsJson = formData.get('duplicateResolutions') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!mappingsJson) {
      return NextResponse.json({ error: 'No column mappings provided' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is 5MB` },
        { status: 400 }
      )
    }

    let mappings: ColumnMapping[]
    let duplicateResolutions: DuplicateMatch[] = []
    try {
      mappings = JSON.parse(mappingsJson) as ColumnMapping[]
      if (duplicateResolutionsJson) {
        duplicateResolutions = JSON.parse(duplicateResolutionsJson) as DuplicateMatch[]
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in mappings or duplicateResolutions' },
        { status: 400 }
      )
    }

    // Check required fields are mapped
    const unmappedRequired = getUnmappedRequiredFields(mappings)
    if (unmappedRequired.length > 0) {
      return NextResponse.json({
        error: `Required fields not mapped: ${unmappedRequired.map((f) => f.label).join(', ')}`,
      }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const data = parseFileFromBuffer(arrayBuffer, file.name)

    // Validate all rows
    const { validRows, errors } = validateAllRows(data.rows, data.headers, mappings)

    // Fetch existing clients to check for duplicates
    const existingClients = await prisma.locatorClient.findMany({
      where: { locatorId: locator.id },
      select: { id: true, name: true, email: true },
    })

    // Detect duplicates and apply resolutions from frontend
    const detectedDuplicates = detectDuplicates(validRows, existingClients)

    // Merge resolutions from frontend
    const duplicatesWithResolutions = detectedDuplicates.map((d) => {
      const resolution = duplicateResolutions.find((r) => r.rowIndex === d.rowIndex)
      return resolution ? { ...d, resolution: resolution.resolution } : d
    })

    const { toImport, toSkip, toOverwrite } = filterDuplicates(validRows, duplicatesWithResolutions)

    // Try to create import log (optional - may fail if migration not run)
    let importLogId: string | null = null
    try {
      const importLog = await (prisma as any).importLog?.create({
        data: {
          locatorId: locator.id,
          fileName: file.name,
          fileSize: file.size,
          totalRows: data.totalRows,
          importedRows: 0,
          skippedRows: toSkip.length,
          failedRows: errors.length,
          duplicateRows: detectedDuplicates.length,
          columnMapping: mappings as object,
          status: 'processing',
        },
      })
      importLogId = importLog?.id || null
    } catch (logError) {
      // ImportLog table may not exist yet - continue without logging
      console.warn('ImportLog not available, continuing without logging:', logError)
    }

    let importedCount = 0
    const importErrors: string[] = []

    // Import new clients
    for (const row of toImport) {
      try {
        // Ensure budgets are integers if provided
        const budgetMin = row.budgetMin ? Math.round(row.budgetMin) : null
        const budgetMax = row.budgetMax ? Math.round(row.budgetMax) : null

        await prisma.locatorClient.create({
          data: {
            locatorId: locator.id,
            name: row.name,
            email: row.email || null,
            phone: row.phone || null,
            budgetMin,
            budgetMax,
            bedrooms: row.bedrooms || [],
            neighborhoods: row.neighborhoods || [],
            moveInDate: row.moveInDate || null,
            vibes: row.vibes || [],
            priorities: row.priorities || [],
            hasDog: row.hasDog ?? false,
            hasCat: row.hasCat ?? false,
            hasKids: row.hasKids ?? false,
            worksFromHome: row.worksFromHome ?? false,
            needsParking: row.needsParking ?? false,
            commuteAddress: row.commuteAddress || null,
            commutePreference: row.commutePreference || null,
            contactPreference: row.contactPreference || null,
            notes: row.notes || null,
            status: row.status || 'active',
            source: 'manual',
            amenities: [],
          },
        })
        importedCount++
      } catch (err: any) {
        console.error('Failed to import client:', row.name, 'Error:', err?.message || err)
        console.error('Row data:', JSON.stringify(row, null, 2))
        importErrors.push(`Failed to import ${row.name}: ${err?.message || 'Unknown error'}`)
      }
    }

    // Update existing clients (overwrites)
    for (const { row, existingId } of toOverwrite) {
      try {
        const budgetMin = row.budgetMin ? Math.round(row.budgetMin) : null
        const budgetMax = row.budgetMax ? Math.round(row.budgetMax) : null

        await prisma.locatorClient.update({
          where: { id: existingId },
          data: {
            name: row.name,
            email: row.email || null,
            phone: row.phone || null,
            budgetMin,
            budgetMax,
            bedrooms: row.bedrooms || [],
            neighborhoods: row.neighborhoods || [],
            moveInDate: row.moveInDate || null,
            vibes: row.vibes || [],
            priorities: row.priorities || [],
            hasDog: row.hasDog ?? false,
            hasCat: row.hasCat ?? false,
            hasKids: row.hasKids ?? false,
            worksFromHome: row.worksFromHome ?? false,
            needsParking: row.needsParking ?? false,
            commuteAddress: row.commuteAddress || null,
            commutePreference: row.commutePreference || null,
            contactPreference: row.contactPreference || null,
            notes: row.notes || null,
            status: row.status || 'active',
          },
        })
        importedCount++
      } catch (err: any) {
        console.error('Failed to update client:', row.name, 'Error:', err?.message || err)
        importErrors.push(`Failed to update ${row.name}: ${err?.message || 'Unknown error'}`)
      }
    }

    // Update import log with final counts (if it was created)
    if (importLogId) {
      try {
        await (prisma as any).importLog?.update({
          where: { id: importLogId },
          data: {
            importedRows: importedCount,
            failedRows: errors.length + importErrors.length,
            status: 'completed',
          },
        })
      } catch {
        // Ignore update errors
      }
    }

    // Bust caches
    revalidateTag(`clients-${user.id}`, 'max')
    revalidateTag(`locator-${user.id}`, 'max')

    const result: ImportResult = {
      imported: importedCount,
      skipped: toSkip.length,
      failed: errors.length + importErrors.length,
      duplicates: detectedDuplicates.length,
      batchId: importLogId || 'no-log',
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Import commit error:', error)

    if (error instanceof ParseError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Failed to import clients' }, { status: 500 })
  }
}
