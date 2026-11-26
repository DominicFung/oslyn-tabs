import assert from 'node:assert/strict'
import { isStaleImport, nextImport, STALE_IMPORT_MS } from './stale'

const now = Date.parse('2026-11-21T23:50:00Z')

describe('stale import reclaim', () => {
  // Perfect sat in IMPORTING from about 7:50 PM ET. Three minutes later it is claimable again.
  it('reclaims an IMPORTING row older than 3 minutes', () => {
    const perfect = {
      requestId: 'perfect',
      status: 'IMPORTING',
      title: 'Perfect',
      updatedAt: now - STALE_IMPORT_MS,
    }
    assert.equal(isStaleImport(perfect, now), true)
    assert.equal(nextImport([perfect], now)?.requestId, 'perfect')
  })

  // I Speak Jesus hung at 5:53 PM. A claim still inside the window is not stolen.
  it('leaves a fresh IMPORTING row alone', () => {
    const speaking = {
      requestId: 'i-speak-jesus',
      status: 'IMPORTING',
      title: 'I Speak Jesus',
      updatedAt: now - (2 * 60 * 1000),
    }
    assert.equal(isStaleImport(speaking, now), false)
    assert.equal(nextImport([speaking], now), null)
  })

  it('prefers a stale claim over a newer pending song', () => {
    const rows = [
      { requestId: 'pending', status: 'PENDING', title: 'Friday', updatedAt: now },
      { requestId: 'perfect', status: 'IMPORTING', title: 'Perfect', updatedAt: now - (4 * 60 * 1000) },
    ]
    assert.equal(nextImport(rows, now)?.requestId, 'perfect')
  })

  it('returns the pending row when nothing is stale', () => {
    const rows = [
      { requestId: 'done', status: 'DONE', updatedAt: now - (10 * 60 * 1000) },
      { requestId: 'fresh', status: 'IMPORTING', updatedAt: now - 1000 },
      { requestId: 'pending', status: 'PENDING', updatedAt: now },
    ]
    assert.equal(nextImport(rows, now)?.requestId, 'pending')
  })

  it('does not treat a missing timestamp as stale', () => {
    assert.equal(isStaleImport({ requestId: 'x', status: 'IMPORTING', updatedAt: null }, now), false)
  })
})
