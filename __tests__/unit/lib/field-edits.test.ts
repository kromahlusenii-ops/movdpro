import { formatDistanceToNow } from '@/lib/utils'

// Note: Most field-edits functions require database access, so they would need
// integration tests with a test database. Here we test the utility functions.

describe('formatDistanceToNow', () => {
  it('returns "just now" for recent timestamps', () => {
    const now = new Date()
    expect(formatDistanceToNow(now)).toBe('just now')
  })

  it('returns minutes ago for timestamps within the hour', () => {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000)
    expect(formatDistanceToNow(thirtyMinsAgo)).toBe('30 minutes ago')
  })

  it('returns "1 minute ago" for singular', () => {
    const oneMinAgo = new Date(Date.now() - 60 * 1000)
    expect(formatDistanceToNow(oneMinAgo)).toBe('1 minute ago')
  })

  it('returns hours ago for timestamps within the day', () => {
    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000)
    expect(formatDistanceToNow(fiveHoursAgo)).toBe('5 hours ago')
  })

  it('returns "1 hour ago" for singular', () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    expect(formatDistanceToNow(oneHourAgo)).toBe('1 hour ago')
  })

  it('returns days ago for timestamps within the week', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    expect(formatDistanceToNow(threeDaysAgo)).toBe('3 days ago')
  })

  it('returns "1 day ago" for singular', () => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    expect(formatDistanceToNow(oneDayAgo)).toBe('1 day ago')
  })

  it('returns weeks ago for timestamps within the month', () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    expect(formatDistanceToNow(twoWeeksAgo)).toBe('2 weeks ago')
  })

  it('returns "1 week ago" for singular', () => {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    expect(formatDistanceToNow(oneWeekAgo)).toBe('1 week ago')
  })

  it('returns months ago for timestamps within the year', () => {
    const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    expect(formatDistanceToNow(threeMonthsAgo)).toBe('3 months ago')
  })

  it('returns formatted date for timestamps over a year ago', () => {
    const twoYearsAgo = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000)
    const result = formatDistanceToNow(twoYearsAgo)
    // Should return a formatted date like "Feb 13, 2024"
    expect(result).toMatch(/^\w{3} \d{1,2}, \d{4}$/)
  })

  it('accepts string dates', () => {
    const isoString = new Date(Date.now() - 60 * 1000).toISOString()
    expect(formatDistanceToNow(isoString)).toBe('1 minute ago')
  })
})

describe('EditableFieldName type', () => {
  it('includes all expected field names', async () => {
    const { EDITABLE_FIELD_CONFIGS } = await import('@/types/field-edits')

    expect(EDITABLE_FIELD_CONFIGS).toHaveProperty('rentMin')
    expect(EDITABLE_FIELD_CONFIGS).toHaveProperty('rentMax')
    expect(EDITABLE_FIELD_CONFIGS).toHaveProperty('deposit')
    expect(EDITABLE_FIELD_CONFIGS).toHaveProperty('adminFee')
    expect(EDITABLE_FIELD_CONFIGS).toHaveProperty('specials')
    expect(EDITABLE_FIELD_CONFIGS).toHaveProperty('petPolicy')
    expect(EDITABLE_FIELD_CONFIGS).toHaveProperty('parkingType')
  })

  it('has correct target types for each field', async () => {
    const { EDITABLE_FIELD_CONFIGS } = await import('@/types/field-edits')

    // Unit fields
    expect(EDITABLE_FIELD_CONFIGS.rentMin.targetType).toBe('unit')
    expect(EDITABLE_FIELD_CONFIGS.rentMax.targetType).toBe('unit')

    // Building fields
    expect(EDITABLE_FIELD_CONFIGS.deposit.targetType).toBe('building')
    expect(EDITABLE_FIELD_CONFIGS.adminFee.targetType).toBe('building')
    expect(EDITABLE_FIELD_CONFIGS.specials.targetType).toBe('building')
    expect(EDITABLE_FIELD_CONFIGS.petPolicy.targetType).toBe('building')
    expect(EDITABLE_FIELD_CONFIGS.parkingType.targetType).toBe('building')
  })

  it('has correct data types for each field', async () => {
    const { EDITABLE_FIELD_CONFIGS } = await import('@/types/field-edits')

    // Number fields
    expect(EDITABLE_FIELD_CONFIGS.rentMin.type).toBe('number')
    expect(EDITABLE_FIELD_CONFIGS.rentMax.type).toBe('number')
    expect(EDITABLE_FIELD_CONFIGS.deposit.type).toBe('number')
    expect(EDITABLE_FIELD_CONFIGS.adminFee.type).toBe('number')

    // Text fields
    expect(EDITABLE_FIELD_CONFIGS.specials.type).toBe('text')
    expect(EDITABLE_FIELD_CONFIGS.petPolicy.type).toBe('text')
    expect(EDITABLE_FIELD_CONFIGS.parkingType.type).toBe('text')
  })

  it('has labels for all fields', async () => {
    const { EDITABLE_FIELD_CONFIGS } = await import('@/types/field-edits')

    Object.values(EDITABLE_FIELD_CONFIGS).forEach((config) => {
      expect(config.label).toBeTruthy()
      expect(typeof config.label).toBe('string')
    })
  })
})
