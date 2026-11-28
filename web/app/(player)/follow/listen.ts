import { captureChart, chartSymbols } from '@/core/captureChart'
import { ScoreFollower, type FollowChartChord, type FollowPageLayout, type FollowSnapshot } from '@/core/follow'

export type FollowPhase = 'listening' | 'denied' | 'no-chords' | 'error'

/**
 * Mic + chroma loop. ~4096 samples is about 85–100ms. The caller must invoke
 * the returned stop function on toggle-off and unmount so every track ends.
 */
export async function startFollow(options: {
  chordSheet: string
  /** Written chart key. */
  chartKey: string
  /** Sounding jam key. Capo is not applied. */
  songKey: string
  getPage: () => number
  onPage: (page: number) => void
  onPhase: (phase: FollowPhase) => void
  onDebug: (snapshot: FollowSnapshot) => void
  onChart?: (chart: { chords: FollowChartChord[], pages: FollowPageLayout[] }) => void
  onFrame?: (snapshot: FollowSnapshot, chroma: number[], energy: number) => void
  /** Opt-in. Off leaves the chord follower as the only page-turn signal. */
  smarter?: boolean
  songId?: string
  asrModel?: 'tiny' | 'base'
  onVoice?: (direction: 'prev' | 'next') => void
  onAsr?: (status: 'loading' | 'ready' | 'error') => void
}): Promise<{ stop: () => void, stream: MediaStream | null }> {
  const captured = captureChart(options.chordSheet, options.chartKey || options.songKey, options.songKey)
  const chords = captured.chords
  options.onChart?.({ chords: chartSymbols(chords), pages: captured.pages })
  if (chords.length === 0) {
    options.onPhase('no-chords')
    return { stop: () => {}, stream: null }
  }
  const follower = new ScoreFollower(chords)
  const lyricPages = captured.pages

  let stream: MediaStream
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    })
  } catch {
    options.onPhase('denied')
    return { stop: () => {}, stream: null }
  }

  const context = new AudioContext()
  if (context.state === 'suspended') await context.resume().catch(() => {})
  const source = context.createMediaStreamSource(stream)
  const mod = await import('meyda')
  const meyda = mod.default ?? mod
  // 4096 samples is ~85ms at 48kHz and ~93ms at 44.1kHz.
  // A zero-gain sink keeps the processor running without playing the mic back.
  meyda.bufferSize = 4096
  meyda.sampleRate = context.sampleRate
  const processor = context.createScriptProcessor(4096, 1, 1)
  const mute = context.createGain()
  mute.gain.value = 0
  source.connect(processor)
  processor.connect(mute)
  mute.connect(context.destination)
  let stopSmarter = () => {}
  let smarter: {
    frame: (input: { chroma: number[], energy: number, t: number, page: number, chordTurn: number | null }) => number | null
    audio: (samples: Float32Array, sampleRate: number, nowMs: number) => void
  } | null = null
  if (options.smarter) {
    const mod = await import('./smarter')
    const handle = mod.attachSmarter({
      songId: options.songId || '',
      pages: lyricPages,
      model: options.asrModel === 'base' ? 'base' : 'tiny',
      onVoice: (direction) => options.onVoice?.(direction),
      onAsr: (status) => options.onAsr?.(status),
    })
    smarter = handle
    stopSmarter = handle.stop
  }
  processor.onaudioprocess = (event) => {
    const signal = event.inputBuffer.getChannelData(0)
    const features = meyda.extract(['chroma', 'rms'], signal)
    const chroma = features?.chroma
    if (!chroma || chroma.length < 12) return
    const energy = features.rms ?? 0
    const now = context.currentTime * 1000
    const page = options.getPage()
    const snapshot = follower.push(chroma, energy, now, page)
    if (smarter) {
      smarter.audio(signal, context.sampleRate, now)
      const turn = smarter.frame({ chroma, energy, t: now, page, chordTurn: snapshot.turnTo })
      if (snapshot.turnTo != null && turn == null) follower.anchorToPage(page)
      if (turn != null) options.onPage(turn)
    } else if (snapshot.turnTo != null) {
      options.onPage(snapshot.turnTo)
    }
    options.onFrame?.(snapshot, chroma, energy)
    options.onDebug(snapshot)
  }
  options.onPhase('listening')

  return {
    stream,
    stop: () => {
      stopSmarter()
      processor.onaudioprocess = null
      processor.disconnect()
      source.disconnect()
      mute.disconnect()
      stream.getTracks().forEach((track) => track.stop())
      context.close().catch(() => {})
    },
  }
}
