/** Words the speech model heard, with the time the word was spoken. */
export type HeardWord = { word: string, t: number }

export type LyricPage = { page: number, lines: string[] }

const THETA = 0.6
const MIN_OPEN_MS = 3000
const SLACK_MS = 400

export function norm(value: string): string {
  const lower = (value || '').toLowerCase().replace(/['’]/g, '').replace(/\([^)]*\)?/g, ' ').replace(/[^a-z ]/g, ' ')
  const parts = lower.split(/\s+/)
  const kept: string[] = []
  for (let i = 0; i < parts.length; i++) if (parts[i]) kept.push(parts[i])
  return kept.join(' ')
}

function lcsLen(a: string, b: string): number {
  const dp: number[][] = []
  for (let i = 0; i <= a.length; i++) dp.push(new Array(b.length + 1).fill(0))
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }
  return dp[a.length][b.length]
}

/** True when two words are the same, or close enough that a slurred recognition still counts. */
export function wordsMatch(a: string, b: string): boolean {
  if (a === b) return true
  if (a.length < 4 || b.length < 4) return false
  return (100 * 2 * lcsLen(a, b)) / (a.length + b.length) >= 75
}

export function lineWords(line: string): string[] {
  const text = norm(line)
  if (!text) return []
  return text.split(' ')
}

/** Longest common subsequence of heard words against one lyric line, and whether the line's last word was part of it. */
export function lineMatch(words: string[], line: string[]): { fraction: number, last: boolean } {
  const n = words.length
  const m = line.length
  if (m === 0) return { fraction: 0, last: false }
  const dp: number[][] = []
  for (let i = 0; i <= n; i++) dp.push(new Array(m + 1).fill(0))
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const take = wordsMatch(words[i - 1], line[j - 1]) ? dp[i - 1][j - 1] + 1 : 0
      dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1], take)
    }
  }
  let last = false
  for (let i = 1; i <= n; i++) {
    if (!wordsMatch(words[i - 1], line[m - 1])) continue
    if (dp[i][m] === dp[i - 1][m - 1] + 1 || dp[i - 1][m - 1] + 1 === dp[n][m]) { last = true; break }
  }
  return { fraction: dp[n][m] / m, last }
}

export function lyricLines(lines: string[]): string[][] {
  const out: string[][] = []
  for (let i = 0; i < lines.length; i++) {
    const words = lineWords(lines[i])
    if (words.length >= 2) out.push(words)
  }
  return out
}

/**
 * Last-line lyric signal. Words from before this page opened are ignored, so a
 * chorus line that also sits on the previous page does not fire the new page.
 * A page with no lyric lines abstains.
 */
export class LyricTracker {
  private page = -1
  private entered = 0
  private words: HeardWord[] = []
  private pages: LyricPage[]
  private minOpenMs: number

  constructor(pages: LyricPage[], minOpenMs = MIN_OPEN_MS) {
    this.pages = pages
    this.minOpenMs = minOpenMs
  }

  linesFor(page: number): string[] {
    for (let i = 0; i < this.pages.length; i++) {
      if (this.pages[i].page === page) return this.pages[i].lines
    }
    return []
  }

  /** Current page and its neighbours, for "is this command also a lyric?" */
  nearbyLines(page: number): string[] {
    return this.linesFor(page - 1).concat(this.linesFor(page), this.linesFor(page + 1))
  }

  hear(page: number, enteredAt: number, words: HeardWord[]) {
    if (page !== this.page || enteredAt !== this.entered) {
      this.page = page
      this.entered = enteredAt
      this.words = []
    }
    for (let i = 0; i < words.length; i++) {
      if (words[i].t >= enteredAt - SLACK_MS) this.words.push(words[i])
    }
  }

  /** turn, wait, or abstain. `now` and `enteredAt` are on the same clock. */
  signal(page: number, now: number, enteredAt: number): 'turn' | 'wait' | 'abstain' {
    const lines = lyricLines(this.linesFor(page))
    if (lines.length === 0) return 'abstain'
    if (now - enteredAt < this.minOpenMs) return 'wait'
    const heard: string[] = []
    for (let i = 0; i < this.words.length; i++) {
      if (this.words[i].t >= enteredAt - SLACK_MS) heard.push(this.words[i].word)
    }
    const last = lines[lines.length - 1]
    const hit = lineMatch(heard, last)
    if (hit.fraction >= THETA && hit.last) return 'turn'
    return 'wait'
  }
}

/** Spread a hop's words across the window that ended at `end`, when the model gave no word times. */
export function wordsFromHop(text: string, end: number, windowMs: number): HeardWord[] {
  const parts = norm(text).split(' ').filter(Boolean)
  const out: HeardWord[] = []
  const n = parts.length
  for (let i = 0; i < n; i++) {
    out.push({ word: parts[i], t: end - windowMs + ((i + 0.5) * windowMs) / Math.max(n, 1) })
  }
  return out
}
