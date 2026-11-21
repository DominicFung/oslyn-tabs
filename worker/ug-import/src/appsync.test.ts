import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { completionFailure, settleImport } from './appsync'

describe('completeImport results', () => {
  it('treats a null result as a failure', () => {
    assert.equal(completionFailure(null), 'completeImport returned no result')
    assert.equal(completionFailure(undefined), 'completeImport returned no result')
  })

  it('treats a result that is not DONE as a failure', () => {
    assert.equal(
      completionFailure({ requestId: 'req', status: 'IMPORTING' }),
      'completeImport returned no result',
    )
  })

  it('accepts a DONE result', () => {
    assert.equal(completionFailure({ requestId: 'req', status: 'DONE' }), null)
  })
})

describe('settleImport', () => {
  it('calls failImport with a GraphQL or null-result error and does not report success', async () => {
    const failed: string[] = []
    let finished = false
    await settleImport('622d0e85-9835-4e3b-bc63-852753956bf9', async () => {
      const failure = completionFailure(null)
      if (failure) throw new Error(failure)
      finished = true
    }, async (_id, error) => { failed.push(error) })
    assert.equal(finished, false)
    assert.deepEqual(failed, ['completeImport returned no result'])
  })

  it('calls failImport with the GraphQL error message', async () => {
    const failed: string[] = []
    await settleImport('req', async () => {
      throw new Error('song 0614cc4e-1aae-4b84-a319-b66945b38a6f is not in the jam')
    }, async (_id, error) => { failed.push(error) })
    assert.deepEqual(failed, ['song 0614cc4e-1aae-4b84-a319-b66945b38a6f is not in the jam'])
  })

  it('does not call failImport when completeImport succeeds', async () => {
    let failed = false
    await settleImport('req', async () => {
      const failure = completionFailure({ requestId: 'req', status: 'DONE' })
      if (failure) throw new Error(failure)
    }, async () => { failed = true })
    assert.equal(failed, false)
  })
})
