import { chordSheetToSlides, getChordByNumber } from '@/core/oslyn'
import { ScoreFollower, sequenceFromSlides, type FollowChartChord, type FollowPageLayout, type FollowSnapshot } from '@/core/follow'

export type FollowPhase = 'listening' | 'denied' | 'no-chords' | 'error'

/**
 * Mic + chroma loop. ~4096 samples is about 85–100ms. The caller must invoke
 * the returned stop function on toggle-off and unmount so every track ends.
 */
export async function startFollow(options: {
  chordSheet: string
  songKey: string
  getPage: () => number
  onPage: (page: number) => void
  onPhase: (phase: FollowPhase) => void
  onDebug: (snapshot: FollowSnapshot) => void
  onChart?: (chart: { chords: FollowChartChord[], pages: FollowPageLayout[] }) => void
  onFrame?: (snapshot: FollowSnapshot, chroma: number[], energy: number) => void
}): Promise<{ stop: () => void, stream: MediaStream | null }> {
  const slides = chordSheetToSlides(options.chordSheet, options.songKey)
  const chords = sequenceFromSlides(slides, options.songKey, getChordByNumber)
  options.onChart?.({
    chords: chords.map(({ symbol, page, line }) => ({ symbol, page, line })),
    pages: slides.pages.map((page, index) => ({ page: index, lines: page.lines.map((line) => line.lyric || line.section || '') })),
  })
  if (chords.length === 0) {
    options.onPhase('no-chords')
    return { stop: () => {}, stream: null }
  }
  const follower = new ScoreFollower(chords)

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
  processor.onaudioprocess = (event) => {
    const signal = event.inputBuffer.getChannelData(0)
    const features = meyda.extract(['chroma', 'rms'], signal)
    const chroma = features?.chroma
    if (!chroma || chroma.length < 12) return
    const energy = features.rms ?? 0
    const snapshot = follower.push(chroma, energy, context.currentTime * 1000, options.getPage())
    if (snapshot.turnTo != null) options.onPage(snapshot.turnTo)
    options.onFrame?.(snapshot, chroma, energy)
    options.onDebug(snapshot)
  }
  options.onPhase('listening')

  return {
    stream,
    stop: () => {
      processor.onaudioprocess = null
      processor.disconnect()
      source.disconnect()
      mute.disconnect()
      stream.getTracks().forEach((track) => track.stop())
      context.close().catch(() => {})
    },
  }
}
