import * as XLSX from 'xlsx'
import type { RawFileData } from '@/types/client-import'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_ROWS = 1000

export class ParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ParseError'
  }
}

export async function parseFile(file: File): Promise<RawFileData> {
  if (file.size > MAX_FILE_SIZE) {
    throw new ParseError(`File too large. Maximum size is 5MB, got ${(file.size / 1024 / 1024).toFixed(2)}MB`)
  }

  const extension = file.name.split('.').pop()?.toLowerCase()

  if (!extension || !['csv', 'xlsx', 'xls'].includes(extension)) {
    throw new ParseError('Invalid file type. Please upload a CSV or Excel file (.csv, .xlsx, .xls)')
  }

  const arrayBuffer = await file.arrayBuffer()

  try {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]

    if (!sheetName) {
      throw new ParseError('File appears to be empty or invalid')
    }

    const worksheet = workbook.Sheets[sheetName]
    const data: string[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      raw: false
    })

    if (data.length === 0) {
      throw new ParseError('File contains no data')
    }

    const headers = data[0].map((h) => String(h).trim())

    if (headers.length === 0 || headers.every((h) => h === '')) {
      throw new ParseError('File has no column headers')
    }

    // Filter out empty rows (all cells empty)
    const rows = data.slice(1).filter((row) =>
      row.some((cell) => String(cell).trim() !== '')
    ).map((row) =>
      row.map((cell) => String(cell).trim())
    )

    if (rows.length === 0) {
      throw new ParseError('File has headers but no data rows')
    }

    if (rows.length > MAX_ROWS) {
      throw new ParseError(`Too many rows. Maximum is ${MAX_ROWS}, got ${rows.length}`)
    }

    return {
      headers,
      rows,
      totalRows: rows.length,
    }
  } catch (error) {
    if (error instanceof ParseError) {
      throw error
    }
    throw new ParseError('Failed to parse file. Please ensure it is a valid CSV or Excel file.')
  }
}

export function parseFileFromBuffer(buffer: ArrayBuffer, filename: string): RawFileData {
  const extension = filename.split('.').pop()?.toLowerCase()

  if (!extension || !['csv', 'xlsx', 'xls'].includes(extension)) {
    throw new ParseError('Invalid file type. Please upload a CSV or Excel file (.csv, .xlsx, .xls)')
  }

  try {
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]

    if (!sheetName) {
      throw new ParseError('File appears to be empty or invalid')
    }

    const worksheet = workbook.Sheets[sheetName]
    const data: string[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      raw: false
    })

    if (data.length === 0) {
      throw new ParseError('File contains no data')
    }

    const headers = data[0].map((h) => String(h).trim())

    if (headers.length === 0 || headers.every((h) => h === '')) {
      throw new ParseError('File has no column headers')
    }

    const rows = data.slice(1).filter((row) =>
      row.some((cell) => String(cell).trim() !== '')
    ).map((row) =>
      row.map((cell) => String(cell).trim())
    )

    if (rows.length === 0) {
      throw new ParseError('File has headers but no data rows')
    }

    if (rows.length > MAX_ROWS) {
      throw new ParseError(`Too many rows. Maximum is ${MAX_ROWS}, got ${rows.length}`)
    }

    return {
      headers,
      rows,
      totalRows: rows.length,
    }
  } catch (error) {
    if (error instanceof ParseError) {
      throw error
    }
    throw new ParseError('Failed to parse file. Please ensure it is a valid CSV or Excel file.')
  }
}

export function getPreviewRows(data: RawFileData, count: number = 5): string[][] {
  return data.rows.slice(0, count)
}
