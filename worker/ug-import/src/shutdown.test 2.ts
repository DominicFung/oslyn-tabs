import assert from 'node:assert/strict'
import { browserClosed, shutdownAction } from './shutdown'

const closed = new Error('page.goto: Target page, context or browser has been closed')

describe('shutdown release', () => {
  it('recognizes the browser-closed error from a restart', () => {
    assert.equal(browserClosed(closed), true)
    assert.equal(browserClosed(new Error('no Chords result matched')), false)
  })

  it('releases the claim on SIGTERM instead of failing All Too Well', () => {
    assert.equal(shutdownAction(true, closed), 'release')
  })

  it('releases when the browser was closed even if the flag was not set yet', () => {
    assert.equal(shutdownAction(false, closed), 'release')
  })

  it('still fails a real import error while the worker is running', () => {
    assert.equal(shutdownAction(false, new Error('no Chords result matched All Too Well')), 'fail')
  })

  it('releases any in-flight error once stop has been requested', () => {
    assert.equal(shutdownAction(true, new Error('AppSync call timed out after 20000ms')), 'release')
  })
})
