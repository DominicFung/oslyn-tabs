import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { IMPORTER_ADMIN_EMAIL, importerBadge, importerIsOn, isImporterAdmin } from './importerAdmin.ts'

describe('importer admin gate', () => {
  it('matches only the admin email', () => {
    assert.equal(isImporterAdmin('Mission.Possibleforsure@gmail.com'), true)
    assert.equal(isImporterAdmin(`  ${IMPORTER_ADMIN_EMAIL}  `), true)
    assert.equal(isImporterAdmin('other@gmail.com'), false)
    assert.equal(isImporterAdmin(null), false)
    assert.equal(isImporterAdmin(''), false)
  })

  it('maps ECS counts to the badge and the button', () => {
    assert.equal(importerBadge({ running: 1, desired: 1, pending: 0 }), 'Running')
    assert.equal(importerBadge({ running: 1, desired: 0, pending: 0 }), 'Running')
    assert.equal(importerBadge({ running: 0, desired: 1, pending: 1 }), 'Starting')
    assert.equal(importerBadge({ running: 0, desired: 0, pending: 0 }), 'Stopped')
    assert.equal(importerIsOn({ running: 0, desired: 0, pending: 0 }), false)
    assert.equal(importerIsOn({ running: 0, desired: 1, pending: 0 }), true)
    assert.equal(importerIsOn({ running: 1, desired: 0, pending: 0 }), true)
  })
})
