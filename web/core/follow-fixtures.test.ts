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

  it('counts a manual next as an expected turn and a quick prev as a rejected auto turn', () => {
    const session = JSON.parse(readFileSync(new URL('synthetic-turn/session.json', root), 'utf8')) as FollowSessionFile
    const base = scoreSession(session)
    const withoutMark = scoreSession({ ...session, events: session.events.filter((event) => event.type !== 'should-turn') })
    const manualNext = scoreSession({
      ...session,
      events: [
        ...session.events.filter((event) => event.type !== 'should-turn'),
        { t: 1900, type: 'manual-correction', direction: 'next', source: 'key', pageBefore: 0, pageAfter: 1 },
      ],
    })
    assert.equal(manualNext.missed, 0)
    assert.ok(manualNext.score > withoutMark.score)
    const undone = scoreSession({
      ...session,
      events: [
        ...session.events,
        { t: 2400, type: 'manual-correction', direction: 'prev', source: 'button', pageBefore: 1, pageAfter: 0 },
      ],
    })
    assert.ok(undone.falseTurns.length > base.falseTurns.length)
    assert.ok(undone.score < base.score)
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

  it('zips a 5MB buffer by copying into one array', () => {
    const data = new Uint8Array(5 * 1024 * 1024)
    data[0] = 0x11
    data[data.length - 1] = 0x22
    const zip = zipStore([{ name: 'audio.webm', data }])
    const nameLength = zip[26] | (zip[27] << 8)
    const dataStart = 30 + nameLength
    assert.equal(zip[0], 0x50)
    assert.equal(zip[1], 0x4b)
    assert.equal(nameLength, 'audio.webm'.length)
    assert.equal(zip[dataStart], 0x11)
    assert.equal(zip[dataStart + data.length - 1], 0x22)
    assert.equal(zip.length, 30 + nameLength + data.length + 46 + nameLength + 22)
  })
})
