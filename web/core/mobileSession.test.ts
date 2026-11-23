import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { issueMobileSession, readMobileSession } from './mobileSession.ts'

const person = { userId: 'user-1', email: 'a@b.com', username: 'A' }

describe('mobile session', () => {
  it('round-trips a signed session and rejects tampering', () => {
    const token = issueMobileSession('secret', person, 1_000)
    assert.equal(readMobileSession('secret', token, 1_000)?.userId, 'user-1')
    assert.equal(readMobileSession('other', token, 1_000), null)
    assert.equal(readMobileSession('secret', `${token}x`, 1_000), null)
    assert.equal(readMobileSession('secret', token, person && 10 ** 15), null)
  })

  it('refuses an empty secret', () => {
    assert.throws(() => issueMobileSession('', person))
    assert.equal(readMobileSession('', 'a.b'), null)
  })
})
