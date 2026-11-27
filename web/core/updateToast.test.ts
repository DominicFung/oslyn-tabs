import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isUpdateDismissed, updateBuildId } from './updateToast.ts'

describe('service worker update toast', () => {
  it('stays hidden for the dismissed build and returns for a later one', () => {
    const current = updateBuildId('abc123', 'https://tabs.oslyn.io/sw.js')
    assert.equal(isUpdateDismissed(current, null), false)
    assert.equal(isUpdateDismissed(current, current), true)
    const later = updateBuildId('def456', 'https://tabs.oslyn.io/sw.js')
    assert.equal(isUpdateDismissed(later, current), false)
  })
})
