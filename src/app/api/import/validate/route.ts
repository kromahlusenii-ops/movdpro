import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserCached, getLocatorProfileCached } from '@/lib/pro-auth'
import { parseFileFromBuffer, ParseError } from '@/lib/import/parse-file'
import { validateAllRows } from '@/lib/import/validate-row'
import { detectDuplicates } from '@/lib/import/duplicate-detector'
import { getUnmappedRequiredFields } from '@/lib/import/column-matcher'
import prisma from '@/lib/db'
import type { ColumnMapping } from '@/types/client-import'

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

    const mappings: ColumnMapping[] = JSON.parse(mappingsJson)

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

    // Detect duplicates
    const duplicates = detectDuplicates(validRows, existingClients)

    return NextResponse.json({
      totalRows: data.totalRows,
      validCount: validRows.length,
      errorCount: errors.length,
      duplicateCount: duplicates.length,
      errors: errors.slice(0, 50), // Limit errors to first 50
      duplicates,
      validRows, // Send valid rows for preview
    })
  } catch (error) {
    console.error('Validate file error:', error)

    if (error instanceof ParseError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid mappings format' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Failed to validate file' }, { status: 500 })
  }
}
