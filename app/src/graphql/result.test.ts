import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { graphqlData, graphqlMessage } from './result.ts'

describe('graphqlData', () => {
  it('keeps partial data when the client throws', () => {
    const thrown = { data: { listPublicJamSessions: [{ jamSessionId: 'room' }] }, errors: [{ message: 'boom' }] }
    assert.deepEqual(graphqlData(thrown), thrown.data)
  })

  it('returns null when the payload has no data', () => {
    assert.equal(graphqlData(new Error('nope')), null)
    assert.equal(graphqlData({ errors: [{ message: 'nope' }] }), null)
    assert.equal(graphqlData(null), null)
  })
})

describe('graphqlMessage', () => {
  it('reads the GraphQL error text', () => {
    assert.equal(graphqlMessage({ errors: [{ message: 'Not authorized' }] }), 'Not authorized')
    assert.equal(graphqlMessage(new Error('offline')), 'offline')
  })
})
