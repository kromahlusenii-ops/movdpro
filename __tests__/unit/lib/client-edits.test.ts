import {
  CLIENT_EDITABLE_FIELD_CONFIGS,
  PREFERENCE_FIELDS,
} from '@/types/client-edits'

// Note: Functions like createClientFieldEdit require database access,
// so they need integration tests. Here we test the type definitions.

describe('ClientEditableFieldName type', () => {
  it('includes all expected field names', () => {
    expect(CLIENT_EDITABLE_FIELD_CONFIGS).toHaveProperty('name')
    expect(CLIENT_EDITABLE_FIELD_CONFIGS).toHaveProperty('email')
    expect(CLIENT_EDITABLE_FIELD_CONFIGS).toHaveProperty('phone')
    expect(CLIENT_EDITABLE_FIELD_CONFIGS).toHaveProperty('budgetMin')
    expect(CLIENT_EDITABLE_FIELD_CONFIGS).toHaveProperty('budgetMax')
    expect(CLIENT_EDITABLE_FIELD_CONFIGS).toHaveProperty('bedrooms')
    expect(CLIENT_EDITABLE_FIELD_CONFIGS).toHaveProperty('neighborhoods')
    expect(CLIENT_EDITABLE_FIELD_CONFIGS).toHaveProperty('vibes')
    expect(CLIENT_EDITABLE_FIELD_CONFIGS).toHaveProperty('priorities')
    expect(CLIENT_EDITABLE_FIELD_CONFIGS).toHaveProperty('hasDog')
    expect(CLIENT_EDITABLE_FIELD_CONFIGS).toHaveProperty('hasCat')
    expect(CLIENT_EDITABLE_FIELD_CONFIGS).toHaveProperty('hasKids')
    expect(CLIENT_EDITABLE_FIELD_CONFIGS).toHaveProperty('worksFromHome')
    expect(CLIENT_EDITABLE_FIELD_CONFIGS).toHaveProperty('needsParking')
    expect(CLIENT_EDITABLE_FIELD_CONFIGS).toHaveProperty('commuteAddress')
    expect(CLIENT_EDITABLE_FIELD_CONFIGS).toHaveProperty('commutePreference')
    expect(CLIENT_EDITABLE_FIELD_CONFIGS).toHaveProperty('moveInDate')
    expect(CLIENT_EDITABLE_FIELD_CONFIGS).toHaveProperty('amenities')
    expect(CLIENT_EDITABLE_FIELD_CONFIGS).toHaveProperty('notes')
    expect(CLIENT_EDITABLE_FIELD_CONFIGS).toHaveProperty('contactPreference')
    expect(CLIENT_EDITABLE_FIELD_CONFIGS).toHaveProperty('status')
  })

  it('has correct data types for each field', () => {
    // Text fields
    expect(CLIENT_EDITABLE_FIELD_CONFIGS.name.type).toBe('text')
    expect(CLIENT_EDITABLE_FIELD_CONFIGS.email.type).toBe('text')
    expect(CLIENT_EDITABLE_FIELD_CONFIGS.phone.type).toBe('text')
    expect(CLIENT_EDITABLE_FIELD_CONFIGS.notes.type).toBe('text')
    expect(CLIENT_EDITABLE_FIELD_CONFIGS.commuteAddress.type).toBe('text')
    expect(CLIENT_EDITABLE_FIELD_CONFIGS.commutePreference.type).toBe('text')
    expect(CLIENT_EDITABLE_FIELD_CONFIGS.contactPreference.type).toBe('text')

    // Number fields
    expect(CLIENT_EDITABLE_FIELD_CONFIGS.budgetMin.type).toBe('number')
    expect(CLIENT_EDITABLE_FIELD_CONFIGS.budgetMax.type).toBe('number')

    // Array fields
    expect(CLIENT_EDITABLE_FIELD_CONFIGS.bedrooms.type).toBe('array')
    expect(CLIENT_EDITABLE_FIELD_CONFIGS.neighborhoods.type).toBe('array')
    expect(CLIENT_EDITABLE_FIELD_CONFIGS.vibes.type).toBe('array')
    expect(CLIENT_EDITABLE_FIELD_CONFIGS.priorities.type).toBe('array')
    expect(CLIENT_EDITABLE_FIELD_CONFIGS.amenities.type).toBe('array')

    // Boolean fields
    expect(CLIENT_EDITABLE_FIELD_CONFIGS.hasDog.type).toBe('boolean')
    expect(CLIENT_EDITABLE_FIELD_CONFIGS.hasCat.type).toBe('boolean')
    expect(CLIENT_EDITABLE_FIELD_CONFIGS.hasKids.type).toBe('boolean')
    expect(CLIENT_EDITABLE_FIELD_CONFIGS.worksFromHome.type).toBe('boolean')
    expect(CLIENT_EDITABLE_FIELD_CONFIGS.needsParking.type).toBe('boolean')

    // Date fields
    expect(CLIENT_EDITABLE_FIELD_CONFIGS.moveInDate.type).toBe('date')
  })

  it('has labels for all fields', () => {
    Object.values(CLIENT_EDITABLE_FIELD_CONFIGS).forEach((config) => {
      expect(config.label).toBeTruthy()
      expect(typeof config.label).toBe('string')
    })
  })

  it('marks preference fields correctly', () => {
    // Preference fields should trigger re-match
    expect(CLIENT_EDITABLE_FIELD_CONFIGS.budgetMin.isPreferenceField).toBe(true)
    expect(CLIENT_EDITABLE_FIELD_CONFIGS.budgetMax.isPreferenceField).toBe(true)
    expect(CLIENT_EDITABLE_FIELD_CONFIGS.bedrooms.isPreferenceField).toBe(true)
    expect(CLIENT_EDITABLE_FIELD_CONFIGS.neighborhoods.isPreferenceField).toBe(true)
    expect(CLIENT_EDITABLE_FIELD_CONFIGS.vibes.isPreferenceField).toBe(true)
    expect(CLIENT_EDITABLE_FIELD_CONFIGS.priorities.isPreferenceField).toBe(true)
    expect(CLIENT_EDITABLE_FIELD_CONFIGS.hasDog.isPreferenceField).toBe(true)
    expect(CLIENT_EDITABLE_FIELD_CONFIGS.hasCat.isPreferenceField).toBe(true)
    expect(CLIENT_EDITABLE_FIELD_CONFIGS.hasKids.isPreferenceField).toBe(true)
    expect(CLIENT_EDITABLE_FIELD_CONFIGS.worksFromHome.isPreferenceField).toBe(true)
    expect(CLIENT_EDITABLE_FIELD_CONFIGS.needsParking.isPreferenceField).toBe(true)
    expect(CLIENT_EDITABLE_FIELD_CONFIGS.commuteAddress.isPreferenceField).toBe(true)
    expect(CLIENT_EDITABLE_FIELD_CONFIGS.commutePreference.isPreferenceField).toBe(true)

    // Non-preference fields should not trigger re-match
    expect(CLIENT_EDITABLE_FIELD_CONFIGS.name.isPreferenceField).toBe(false)
    expect(CLIENT_EDITABLE_FIELD_CONFIGS.email.isPreferenceField).toBe(false)
    expect(CLIENT_EDITABLE_FIELD_CONFIGS.phone.isPreferenceField).toBe(false)
    expect(CLIENT_EDITABLE_FIELD_CONFIGS.notes.isPreferenceField).toBe(false)
    expect(CLIENT_EDITABLE_FIELD_CONFIGS.status.isPreferenceField).toBe(false)
    expect(CLIENT_EDITABLE_FIELD_CONFIGS.moveInDate.isPreferenceField).toBe(false)
    expect(CLIENT_EDITABLE_FIELD_CONFIGS.contactPreference.isPreferenceField).toBe(false)
  })
})

describe('PREFERENCE_FIELDS', () => {
  it('includes all fields that should trigger re-match', () => {
    expect(PREFERENCE_FIELDS).toContain('budgetMin')
    expect(PREFERENCE_FIELDS).toContain('budgetMax')
    expect(PREFERENCE_FIELDS).toContain('bedrooms')
    expect(PREFERENCE_FIELDS).toContain('neighborhoods')
    expect(PREFERENCE_FIELDS).toContain('vibes')
    expect(PREFERENCE_FIELDS).toContain('priorities')
    expect(PREFERENCE_FIELDS).toContain('hasDog')
    expect(PREFERENCE_FIELDS).toContain('hasCat')
    expect(PREFERENCE_FIELDS).toContain('hasKids')
    expect(PREFERENCE_FIELDS).toContain('worksFromHome')
    expect(PREFERENCE_FIELDS).toContain('needsParking')
    expect(PREFERENCE_FIELDS).toContain('commuteAddress')
    expect(PREFERENCE_FIELDS).toContain('commutePreference')
  })

  it('does not include non-preference fields', () => {
    expect(PREFERENCE_FIELDS).not.toContain('name')
    expect(PREFERENCE_FIELDS).not.toContain('email')
    expect(PREFERENCE_FIELDS).not.toContain('phone')
    expect(PREFERENCE_FIELDS).not.toContain('notes')
    expect(PREFERENCE_FIELDS).not.toContain('status')
  })

  it('matches the isPreferenceField flags in configs', () => {
    // Every field in PREFERENCE_FIELDS should have isPreferenceField=true
    PREFERENCE_FIELDS.forEach((fieldName) => {
      const config = CLIENT_EDITABLE_FIELD_CONFIGS[fieldName]
      expect(config.isPreferenceField).toBe(true)
    })

    // Every field NOT in PREFERENCE_FIELDS should have isPreferenceField=false
    Object.entries(CLIENT_EDITABLE_FIELD_CONFIGS).forEach(([fieldName, config]) => {
      if (!PREFERENCE_FIELDS.includes(fieldName as never)) {
        expect(config.isPreferenceField).toBe(false)
      }
    })
  })
})
