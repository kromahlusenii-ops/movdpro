import { parseFileFromBuffer, getPreviewRows, ParseError } from '@/lib/import/parse-file'
import * as XLSX from 'xlsx'

describe('parseFileFromBuffer', () => {
  function createCSVBuffer(content: string): ArrayBuffer {
    const encoder = new TextEncoder()
    return encoder.encode(content).buffer
  }

  function createXLSXBuffer(data: string[][]): ArrayBuffer {
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet(data)
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
    return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
  }

  it('parses a simple CSV file', () => {
    const csv = 'Name,Email,Phone\nJohn Doe,john@example.com,555-1234\nJane Smith,jane@example.com,555-5678'
    const buffer = createCSVBuffer(csv)

    const result = parseFileFromBuffer(buffer, 'test.csv')

    expect(result.headers).toEqual(['Name', 'Email', 'Phone'])
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]).toEqual(['John Doe', 'john@example.com', '555-1234'])
    expect(result.totalRows).toBe(2)
  })

  it('parses an XLSX file', () => {
    const data = [
      ['Name', 'Email', 'Budget'],
      ['Alice', 'alice@test.com', '1500'],
      ['Bob', 'bob@test.com', '2000'],
    ]
    const buffer = createXLSXBuffer(data)

    const result = parseFileFromBuffer(buffer, 'test.xlsx')

    expect(result.headers).toEqual(['Name', 'Email', 'Budget'])
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]).toEqual(['Alice', 'alice@test.com', '1500'])
  })

  it('trims whitespace from headers and cells', () => {
    const csv = '  Name  ,  Email  \n  John  ,  john@test.com  '
    const buffer = createCSVBuffer(csv)

    const result = parseFileFromBuffer(buffer, 'test.csv')

    expect(result.headers).toEqual(['Name', 'Email'])
    expect(result.rows[0]).toEqual(['John', 'john@test.com'])
  })

  it('filters out empty rows', () => {
    const csv = 'Name,Email\nJohn,john@test.com\n,,\nJane,jane@test.com\n,,'
    const buffer = createCSVBuffer(csv)

    const result = parseFileFromBuffer(buffer, 'test.csv')

    expect(result.rows).toHaveLength(2)
  })

  it('throws ParseError for invalid file type', () => {
    const buffer = new ArrayBuffer(10)

    expect(() => parseFileFromBuffer(buffer, 'test.txt')).toThrow(ParseError)
    expect(() => parseFileFromBuffer(buffer, 'test.txt')).toThrow('Invalid file type')
  })

  it('throws ParseError for empty file', () => {
    const csv = ''
    const buffer = createCSVBuffer(csv)

    expect(() => parseFileFromBuffer(buffer, 'test.csv')).toThrow(ParseError)
  })

  it('throws ParseError for file with only headers', () => {
    const csv = 'Name,Email,Phone'
    const buffer = createCSVBuffer(csv)

    expect(() => parseFileFromBuffer(buffer, 'test.csv')).toThrow('File has headers but no data rows')
  })

  it('handles CSV with special characters', () => {
    const csv = 'Name,Notes\n"John, Jr.",\"Has a \\"dog\\"\"'
    const buffer = createCSVBuffer(csv)

    const result = parseFileFromBuffer(buffer, 'test.csv')

    expect(result.rows[0][0]).toBe('John, Jr.')
  })

  it('handles missing values', () => {
    const csv = 'Name,Email,Phone\nJohn,,555-1234\nJane,jane@test.com,'
    const buffer = createCSVBuffer(csv)

    const result = parseFileFromBuffer(buffer, 'test.csv')

    expect(result.rows[0]).toEqual(['John', '', '555-1234'])
    expect(result.rows[1]).toEqual(['Jane', 'jane@test.com', ''])
  })
})

describe('getPreviewRows', () => {
  it('returns first 5 rows by default', () => {
    const data = {
      headers: ['Name'],
      rows: [['A'], ['B'], ['C'], ['D'], ['E'], ['F'], ['G']],
      totalRows: 7,
    }

    const preview = getPreviewRows(data)

    expect(preview).toHaveLength(5)
    expect(preview[0]).toEqual(['A'])
    expect(preview[4]).toEqual(['E'])
  })

  it('returns all rows if less than count', () => {
    const data = {
      headers: ['Name'],
      rows: [['A'], ['B']],
      totalRows: 2,
    }

    const preview = getPreviewRows(data, 5)

    expect(preview).toHaveLength(2)
  })

  it('returns custom count', () => {
    const data = {
      headers: ['Name'],
      rows: [['A'], ['B'], ['C'], ['D'], ['E']],
      totalRows: 5,
    }

    const preview = getPreviewRows(data, 3)

    expect(preview).toHaveLength(3)
  })
})
