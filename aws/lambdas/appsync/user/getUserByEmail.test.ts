import { emailLookupKeys } from './getUserByEmail'

describe('emailLookupKeys', () => {
  it('returns nothing for a blank or non-email value', () => {
    expect(emailLookupKeys('')).toEqual([])
    expect(emailLookupKeys('   ')).toEqual([])
    expect(emailLookupKeys('not-an-email')).toEqual([])
  })

  it('keeps the typed address and adds a lowercase copy when the case differs', () => {
    expect(emailLookupKeys('  Person@Example.com ')).toEqual(['Person@Example.com', 'person@example.com'])
    expect(emailLookupKeys('person@example.com')).toEqual(['person@example.com'])
  })
})
