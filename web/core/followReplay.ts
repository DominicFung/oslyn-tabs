// Node's type stripper needs the .ts specifier. The app tsconfig does not allow it.
// @ts-expect-error TS5097
import { ScoreFollower, chordTemplate, scorePredicted, scoreSession, type FollowChord, type FollowSessionFile, type ReplayReport } from './follow.ts'
// @ts-expect-error TS5097
import { TakeBank, referenceFromSession, type TakeReference } from './pageDtw.ts'
// @ts-expect-error TS5097
import { TurnVote, type VoteSignal } from './followVote.ts'

function startPage(session: FollowSessionFile): number {
  const first = session.events.find((event) => event.type !== 'should-turn')
  return first?.pageBefore ?? (first?.type === 'auto-turn' && first.page != null ? Math.max(0, first.page - 1) : 0)
}

/**
 * Chord follower plus past-take alignment. Lyrics abstain, so a turn needs the
 * chord decision and the DTW signal inside the vote window. With fewer than
 * two references the DTW signal abstains and this matches chords alone.
 */
export function replayChordsAndDtw(session: FollowSessionFile, refs: TakeReference[]): ReplayReport {
  const chords: FollowChord[] = []
  for (let i = 0; i < session.chords.length; i++) {
    const template = chordTemplate(session.chords[i].symbol)
    if (!template) continue
    chords.push({ ...session.chords[i], template })
  }
  const follower = new ScoreFollower(chords, session.options || {})
  const bank = new TakeBank(refs)
  const vote = new TurnVote()
  const anchors = session.events.filter((event) =>
    (event.type === 'manual-correction' || event.type === 'page-change')
    && (event.pageAfter != null || event.page != null)
  )
  let page = startPage(session)
  let anchorAt = 0
  const predicted: number[] = []
  const predictedFrom: number[] = []
  for (let i = 0; i < session.frames.length; i++) {
    const frame = session.frames[i]
    let moved = false
    while (anchorAt < anchors.length && anchors[anchorAt].t < frame.t) {
      const anchor = anchors[anchorAt]
      const next = anchor.pageAfter ?? anchor.page ?? page
      if (next !== page) moved = true
      page = next
      anchorAt += 1
    }
    if (moved) vote.reset()
    const snap = follower.push(frame.chroma, frame.energy, frame.t, page)
    const takes: VoteSignal = bank.push({ t: frame.t, chroma: frame.chroma, energy: frame.energy }, page)
    const chord: VoteSignal = snap.turnTo != null ? 'turn' : 'wait'
    const fire = vote.push(frame.t, { chords: chord, lyrics: 'abstain', takes })
    if (snap.turnTo != null && !fire) follower.anchorToPage(page)
    if (fire) {
      predicted.push(frame.t)
      predictedFrom.push(page)
      page = snap.turnTo != null ? snap.turnTo : page + 1
      vote.reset()
    }
  }
  return scorePredicted(session, predicted, predictedFrom)
}

export function counts(report: ReplayReport): { matched: number, expected: number, falseTurns: number } {
  let matched = 0
  for (let i = 0; i < report.turns.length; i++) if (!report.turns[i].missed) matched += 1
  return { matched, expected: report.turns.length, falseTurns: report.falseTurns.length }
}

export function leaveOneOut(sessions: { name: string, session: FollowSessionFile }[]): { name: string, chords: ReturnType<typeof counts>, voted: ReturnType<typeof counts> }[] {
  const refs = sessions.map((item) => ({ name: item.name, ref: referenceFromSession(item.session, item.name) }))
  const rows: { name: string, chords: ReturnType<typeof counts>, voted: ReturnType<typeof counts> }[] = []
  for (let i = 0; i < sessions.length; i++) {
    const others: TakeReference[] = []
    for (let j = 0; j < refs.length; j++) {
      if (j !== i && refs[j].ref) others.push(refs[j].ref as TakeReference)
    }
    // scoreSession equivalent: replay with no references, DTW abstains, vote falls back to chords.
    const chords = counts(scoreSession(sessions[i].session))
    const voted = counts(replayChordsAndDtw(sessions[i].session, others))
    rows.push({ name: sessions[i].name, chords, voted })
  }
  return rows
}
