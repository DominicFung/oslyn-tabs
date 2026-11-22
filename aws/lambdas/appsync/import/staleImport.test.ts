import { isStaleImporting, STALE_IMPORT_MS } from './store'

describe('stale IMPORTING claims', () => {
  const now = Date.parse('2026-11-21T23:50:00Z')

  it('is stale at 3 minutes', () => {
    expect(isStaleImporting('IMPORTING', now - STALE_IMPORT_MS, now)).toBe(true)
  })

  it('is not stale at 2 minutes', () => {
    expect(isStaleImporting('IMPORTING', now - 2 * 60 * 1000, now)).toBe(false)
  })

  it('does not reclaim pending, done, or failed rows by age', () => {
    expect(isStaleImporting('PENDING', now - 10 * 60 * 1000, now)).toBe(false)
    expect(isStaleImporting('DONE', now - 10 * 60 * 1000, now)).toBe(false)
    expect(isStaleImporting('FAILED', now - 10 * 60 * 1000, now)).toBe(false)
  })
})
