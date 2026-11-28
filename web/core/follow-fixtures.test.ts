import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'fs'
import { scoreSession, zipStore, type FollowSessionFile } from './follow.ts'

const root = new URL('./follow-fixtures/', import.meta.url)

describe('follow fixtures', () => {
  const baseline = JSON.parse(readFileSync(new URL('baseline.json', root), 'utf8')) as Record<string, number>

  it('turns on the saved Build My Life takes', () => {
    const short = JSON.parse(readFileSync(new URL('build-my-life-1/session.json', root), 'utf8')) as FollowSessionFile
    const full = JSON.parse(readFileSync(new URL('build-my-life-full/session.json', root), 'utf8')) as FollowSessionFile
    const shortReport = scoreSession(short)
    const fullReport = scoreSession(full)
    const matched = (report: { turns: { missed: boolean }[] }) => report.turns.filter((turn) => !turn.missed).length
    assert.ok(matched(shortReport) >= 3, `short take matched ${matched(shortReport)}`)
    assert.ok(shortReport.falseTurns.length <= 4)
    assert.ok(matched(fullReport) >= 10, `full take matched ${matched(fullReport)}`)
    assert.ok(fullReport.falseTurns.length <= 20)
  })

  it('holds the page on the takes where Follow me turned early on repeated chords', () => {
    // Nov 27 takes in D, capo 0. Live, nearly every automatic turn was taken back within a second or two.
    const live3 = JSON.parse(readFileSync(new URL('build-my-life-3/session.json', root), 'utf8')) as FollowSessionFile
    const live4 = JSON.parse(readFileSync(new URL('build-my-life-4/session.json', root), 'utf8')) as FollowSessionFile
    const report3 = scoreSession(live3)
    const report4 = scoreSession(live4)
    assert.ok(report3.falseTurns.length <= 2, `take 3 false turns ${report3.falseTurns.length}`)
    assert.ok(report4.falseTurns.length <= 5, `take 4 false turns ${report4.falseTurns.length}`)
    assert.ok(report4.turns.filter((turn) => !turn.missed).length >= 5)
  })

  it('turns on Christ Be Magnified with at most one early turn', () => {
    // Take recorded on the page-length-gate build (8fd95c6). Pages there run 2 to 4 s per chord.
    const cbm = JSON.parse(readFileSync(new URL('christ-be-magnified-1/session.json', root), 'utf8')) as FollowSessionFile
    const report = scoreSession(cbm)
    assert.ok(report.falseTurns.length <= 2, `false turns ${report.falseTurns.length}`)
    assert.ok(report.turns.filter((turn) => !turn.missed).length >= 6)
  })

  it('treats a recorded auto turn nobody took back as expected, and a next undone at once as a slip', () => {
    const session = JSON.parse(readFileSync(new URL('synthetic-turn/session.json', root), 'utf8')) as FollowSessionFile
    const plain = session.events.filter((event) => event.type !== 'should-turn')
    assert.equal(scoreSession({ ...session, events: plain }).turns.length, 1)
    const slip = scoreSession({
      ...session,
      events: [
        { t: 900, type: 'manual-correction', direction: 'next', source: 'key', pageBefore: 0, pageAfter: 1 },
        { t: 1200, type: 'manual-correction', direction: 'prev', source: 'key', pageBefore: 1, pageAfter: 0 },
        ...plain,
      ],
    })
    assert.equal(slip.turns.length, 1)
  })

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
    // An automatic turn nobody took back also counts as expected, so drop it to isolate the manual next.
    const plain = session.events.filter((event) => event.type !== 'should-turn' && event.type !== 'auto-turn')
    const withoutMark = scoreSession({ ...session, events: plain })
    const manualNext = scoreSession({
      ...session,
      events: [
        ...plain,
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

  it('counts one expected turn when Space is followed by the same manual next', () => {
    const session = JSON.parse(readFileSync(new URL('synthetic-turn/session.json', root), 'utf8')) as FollowSessionFile
    const doubled = scoreSession({
      ...session,
      events: [
        ...session.events,
        { t: 2800, type: 'manual-correction', direction: 'next', source: 'key', pageBefore: 0, pageAfter: 1 },
      ],
    })
    assert.equal(doubled.turns.length, 1)
    assert.equal(doubled.missed, 0)
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
