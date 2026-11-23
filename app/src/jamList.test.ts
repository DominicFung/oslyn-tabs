import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { jamLabel, jamRows, parseJamTarget, signInKind } from './jamList.ts'

describe('jamRows', () => {
  it('drops null rows and ended rooms', () => {
    const rows = jamRows([
      null,
      { jamSessionId: '', description: 'nope' },
      { jamSessionId: 'open', description: 'Tonight', endDate: null },
      { jamSessionId: 'done', endDate: 10 },
    ])
    assert.deepEqual(rows.map((row) => row.jamSessionId), ['open'])
  })
})

describe('jamLabel', () => {
  it('uses the room description, then the set, then a fallback', () => {
    assert.equal(jamLabel({ description: ' Nov 23, 2026 Jam ', setList: { description: 'Set' } }), 'Nov 23, 2026 Jam')
    assert.equal(jamLabel({ description: '  ', setList: { description: 'Sunday' } }), 'Sunday')
    assert.equal(jamLabel({ description: null, setList: null }), 'Untitled room')
  })
})

describe('parseJamTarget', () => {
  it('reads a room id from a join link or a bare id', () => {
    assert.deepEqual(
      parseJamTarget('https://tabs.oslyn.io/jam/11111111-1111-4111-8111-111111111111?join=abc'),
      { jamSessionId: '11111111-1111-4111-8111-111111111111', joinToken: 'abc' }
    )
    assert.deepEqual(parseJamTarget('11111111-1111-4111-8111-111111111111'), {
      jamSessionId: '11111111-1111-4111-8111-111111111111',
    })
    assert.equal(parseJamTarget('not a room'), null)
  })
})

describe('signInKind', () => {
  it('tells an email from a user id', () => {
    assert.equal(signInKind('a@b.com'), 'email')
    assert.equal(signInKind('11111111-1111-4111-8111-111111111111_usr'), 'userId')
    assert.equal(signInKind('hello'), 'invalid')
  })
})
