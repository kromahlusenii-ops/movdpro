import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserCached, getLocatorProfileCached } from '@/lib/pro-auth'
import { parseFileFromBuffer, getPreviewRows, ParseError } from '@/lib/import/parse-file'
import { matchAllColumns } from '@/lib/import/column-matcher'

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

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is 5MB, got ${(file.size / 1024 / 1024).toFixed(2)}MB` },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const data = parseFileFromBuffer(arrayBuffer, file.name)

    const suggestedMappings = matchAllColumns(data.headers)
    const previewRows = getPreviewRows(data, 5)

    return NextResponse.json({
      headers: data.headers,
      previewRows,
      totalRows: data.totalRows,
      suggestedMappings,
      fileName: file.name,
      fileSize: file.size,
    })
  } catch (error) {
    console.error('Parse file error:', error)

    if (error instanceof ParseError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: 'Failed to parse file' }, { status: 500 })
  }
}
