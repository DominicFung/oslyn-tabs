import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'fs'
import { scoreSession, zipStore, type FollowSessionFile } from './follow.ts'

const root = new URL('./follow-fixtures/', import.meta.url)

describe('follow fixtures', () => {
  const baseline = JSON.parse(readFileSync(new URL('baseline.json', root), 'utf8')) as Record<string, number>

  it('scores every committed fixture at or above its baseline', () => {
    const names = Object.keys(baseline)
    assert.ok(names.length > 0)
    for (const name of names) {
      const session = JSON.parse(readFileSync(new URL(`${name}/session.json`, root), 'utf8')) as FollowSessionFile
      const report = scoreSession(session)
      assert.ok(report.score + 1e-9 >= baseline[name], `${name} scored ${report.score}, baseline is ${baseline[name]}`)
    }
  })

  it('treats a missing mark and an extra turn as a lower score', () => {
    const session = JSON.parse(readFileSync(new URL('synthetic-turn/session.json', root), 'utf8')) as FollowSessionFile
    const missed = scoreSession({ ...session, events: [] })
    assert.equal(missed.missed, 0)
    assert.ok(missed.falseTurns.length >= 1)
    assert.ok(missed.score < scoreSession(session).score)
  })

  it('packs session.json into a zip', () => {
    const zip = zipStore([{ name: 'session.json', data: new TextEncoder().encode('{}') }])
    assert.equal(zip[0], 0x50)
    assert.equal(zip[1], 0x4b)
    assert.ok(new TextDecoder().decode(zip).includes('session.json'))
  })
})
