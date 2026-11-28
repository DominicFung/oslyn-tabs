/** One voter in the opt-in page turn. Abstain means that voter is not in this decision. */
export type VoteSignal = 'turn' | 'wait' | 'abstain'

export type VoteName = 'chords' | 'lyrics' | 'takes'

export const VOTE_WINDOW_MS = 1500

/**
 * A page turns when at least two available signals have said "turn" inside the window.
 * Two available signals must both agree. If lyrics and past takes abstain, the chord
 * decision is used on its own.
 */
export class TurnVote {
  private marks: { name: VoteName, t: number }[] = []
  private windowMs: number

  constructor(windowMs = VOTE_WINDOW_MS) {
    this.windowMs = windowMs
  }

  reset() {
    this.marks = []
  }

  push(t: number, signals: Record<VoteName, VoteSignal>): boolean {
    const names: VoteName[] = ['chords', 'lyrics', 'takes']
    for (let i = 0; i < names.length; i++) {
      if (signals[names[i]] === 'turn') this.marks.push({ name: names[i], t })
    }
    const available: VoteName[] = []
    for (let i = 0; i < names.length; i++) {
      if (signals[names[i]] !== 'abstain') available.push(names[i])
    }
    if (available.length <= 1) {
      const only = available[0]
      return only === 'chords' && signals.chords === 'turn'
    }
    const recent = new Set<VoteName>()
    for (let i = 0; i < this.marks.length; i++) {
      const mark = this.marks[i]
      if (t - mark.t > this.windowMs) continue
      if (signals[mark.name] === 'abstain') continue
      recent.add(mark.name)
    }
    const need = available.length >= 3 ? 2 : available.length
    let count = 0
    for (let i = 0; i < available.length; i++) {
      if (recent.has(available[i])) count += 1
    }
    if (count < need) return false
    this.marks = []
    return true
  }
}
