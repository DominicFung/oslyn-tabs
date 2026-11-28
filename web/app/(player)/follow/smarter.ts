import { LyricTracker, wordsFromHop, type HeardWord, type LyricPage } from '@/core/lyricMatch'
import { TakeBank, type TakeReference } from '@/core/pageDtw'
import { TurnVote, type VoteSignal } from '@/core/followVote'
import { manualDirection, readVoiceCommand, type VoiceCommand } from '@/core/voiceCommand'
import { startAsr, type AsrStatus } from './asrClient'

const cache = new Map<string, Promise<TakeReference[]>>()

export function loadTakes(songId: string): Promise<TakeReference[]> {
  if (!songId || songId === 'unknown') return Promise.resolve([])
  const hit = cache.get(songId)
  if (hit) return hit
  const pending = fetch(`/api/follow/references?songId=${encodeURIComponent(songId)}`)
    .then((response) => response.ok ? response.json() : { takes: [] })
    .then((body: { takes?: TakeReference[] }) => Array.isArray(body.takes) ? body.takes : [])
    .catch(() => [] as TakeReference[])
  cache.set(songId, pending)
  return pending
}

export function attachSmarter(options: {
  songId: string
  pages: LyricPage[]
  model: 'tiny' | 'base'
  onVoice: (direction: 'prev' | 'next') => void
  onAsr: (status: AsrStatus) => void
}) {
  const lyrics = new LyricTracker(options.pages)
  const vote = new TurnVote()
  let bank = new TakeBank([])
  let page = -1
  let entered = 0
  const hops: { t: number, text: string }[] = []
  let lastVoice: number | null = null
  let stopped = false

  const asr = startAsr(options.model, (text, end) => {
    if (stopped || !text.trim()) return
    const words: HeardWord[] = wordsFromHop(text, end, 6000)
    lyrics.hear(page < 0 ? 0 : page, entered, words)
    const command: VoiceCommand | null = readVoiceCommand({
      text,
      t: end,
      recent: hops,
      lyricLines: lyrics.nearbyLines(page < 0 ? 0 : page),
      lastFiredAt: lastVoice,
    })
    hops.push({ t: end, text })
    if (hops.length > 8) hops.shift()
    if (!command) return
    lastVoice = end
    options.onVoice(manualDirection(command))
  }, options.onAsr)

  loadTakes(options.songId).then((takes) => {
    if (!stopped) bank = new TakeBank(takes)
  })

  return {
    /** Page to show, or null to leave the chord follower's page alone. */
    frame(input: { chroma: number[], energy: number, t: number, page: number, chordTurn: number | null }): number | null {
      if (input.page !== page) {
        page = input.page
        entered = input.t
        vote.reset()
        lyrics.hear(page, entered, [])
      }
      const chord: VoteSignal = input.chordTurn != null ? 'turn' : 'wait'
      const lyric = lyrics.signal(page, input.t, entered)
      const takes = bank.push({ t: input.t, chroma: input.chroma, energy: input.energy }, page)
      if (!vote.push(input.t, { chords: chord, lyrics: lyric, takes })) return null
      return input.chordTurn != null ? input.chordTurn : input.page + 1
    },
    audio(samples: Float32Array, sampleRate: number, nowMs: number) {
      asr.push(samples, sampleRate, nowMs)
    },
    stop() {
      stopped = true
      asr.stop()
    },
  }
}
