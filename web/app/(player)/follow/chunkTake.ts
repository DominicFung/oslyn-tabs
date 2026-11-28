import {
  compactPart, partFileNames,
  type FollowChartChord, type FollowEstimated, type FollowFrame, type FollowManifest, type FollowManifestChunk, type FollowMark, type FollowPageLayout,
} from '@/core/follow'
import { pageChangeMark, recordingManifest, type TakeMeta } from '@/core/takeManifest'
import { chunkUploadFiles, failedChunkZip, uploadFiles, type SavedRecording } from './sink'

const CHUNK_MS = 120_000

export type { TakeMeta, TakeMode } from '@/core/takeManifest'
export { formatElapsed } from '@/core/takeManifest'

type TakeState = {
  sessionId: string
  recordedAt: string
  part: number
  chunkStart: number
  chunks: FollowManifestChunk[]
}

type ChunkCut = {
  recorder: MediaRecorder | null
  blobs: Blob[]
  part: ReturnType<typeof compactPart>
  manifest: FollowManifest
  sessionId: string
}

/**
 * One chunked take: mic webm plus JSON parts under follow-recordings/.
 * The caller decides whether a score follower is running. This only captures.
 */
export class ChunkTake {
  recording = false
  downloadReady = false
  failedZip: { name: string, bytes: Uint8Array } | null = null
  lastNote: SavedRecording | null = null
  chart: { chords: FollowChartChord[], pages: FollowPageLayout[] } = { chords: [], pages: [] }
  meta: TakeMeta = { songId: '', title: '', chartKey: '', key: '', capo: 0, mode: 'follow' }

  private startedAt = 0
  private frames: FollowFrame[] = []
  private events: FollowMark[] = []
  private audioChunks: Blob[] = []
  private media: MediaRecorder | null = null
  private stream: MediaStream | null = null
  private ownStream = false
  private take: TakeState | null = null
  private timer: number | null = null
  private chain = Promise.resolve()
  private seenPage = 0
  private pendingManual: number | null = null
  private pendingAuto: number | null = null

  constructor(private onUpdate: () => void, private chunkMs = CHUNK_MS) {}

  elapsedMs(): number {
    if (!this.recording) return 0
    return Math.round(performance.now() - this.startedAt)
  }

  stamp(): number {
    return Math.round(performance.now() - this.startedAt)
  }

  start(stream: MediaStream, page: number, ownStream = false) {
    if (this.recording) return
    this.stream = stream
    this.ownStream = ownStream
    this.frames = []
    this.events = []
    this.audioChunks = []
    this.seenPage = page
    this.pendingManual = null
    this.pendingAuto = null
    this.startedAt = performance.now()
    this.take = {
      sessionId: crypto.randomUUID(),
      recordedAt: new Date().toISOString(),
      part: 1,
      chunkStart: 0,
      chunks: [],
    }
    this.downloadReady = false
    this.failedZip = null
    this.recording = true
    this.startRecorder()
    this.armTimer()
    this.onUpdate()
  }

  flush(kind: 'timer' | 'hidden' | 'stop' | 'pagehide'): Promise<void> {
    if (kind === 'pagehide') {
      const cut = this.cutChunk(true)
      if (cut) void this.publishChunk(cut, true)
      this.releaseStream()
      return Promise.resolve()
    }
    const run = async () => {
      const cut = this.cutChunk(kind === 'stop')
      if (cut) await this.publishChunk(cut, false)
      if (kind === 'stop') this.releaseStream()
    }
    const next = this.chain.then(run, run)
    this.chain = next.then(() => {}, () => {})
    return next
  }

  pushFrame(frame: FollowFrame) {
    if (!this.recording) return
    this.frames.push(frame)
  }

  mark(event: Omit<FollowMark, 't'>) {
    if (!this.recording) return
    this.events.push({ ...event, t: this.stamp() })
  }

  armAuto(page: number) {
    this.pendingAuto = page
  }

  noteManual(detail: {
    direction: 'prev' | 'next'
    source: 'key' | 'button' | 'voice'
    pageBefore: number
    pageAfter: number
  }, estimated?: FollowEstimated) {
    if (!this.recording) return
    this.pendingManual = detail.pageAfter
    this.mark({
      type: 'manual-correction',
      direction: detail.direction,
      source: detail.source,
      pageBefore: detail.pageBefore,
      pageAfter: detail.pageAfter,
      page: detail.pageAfter,
      estimated,
    })
  }

  onPage(page: number) {
    if (!this.recording) {
      this.seenPage = page
      return
    }
    const next = pageChangeMark({
      page,
      seen: this.seenPage,
      pendingManual: this.pendingManual,
      pendingAuto: this.pendingAuto,
      t: this.stamp(),
    })
    this.pendingManual = next.pendingManual
    this.pendingAuto = next.pendingAuto
    this.seenPage = next.seen
    if (next.mark) this.events.push(next.mark)
  }

  private releaseStream() {
    if (!this.ownStream || !this.stream) return
    this.stream.getTracks().forEach((track) => track.stop())
    this.stream = null
  }

  private armTimer() {
    this.clearTimer()
    this.timer = window.setTimeout(() => { void this.flush('timer') }, this.chunkMs)
  }

  private clearTimer() {
    if (this.timer != null) {
      window.clearTimeout(this.timer)
      this.timer = null
    }
  }

  private startRecorder() {
    if (!this.stream) return
    const mime = typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus' : ''
    try {
      const recorder = mime ? new MediaRecorder(this.stream, { mimeType: mime }) : new MediaRecorder(this.stream)
      recorder.ondataavailable = (event) => { if (event.data.size) this.audioChunks.push(event.data) }
      this.media = recorder
      recorder.start(1000)
    } catch { this.media = null }
  }

  private header(chunks: FollowManifestChunk[], finished: boolean): FollowManifest {
    const take = this.take
    return recordingManifest({
      meta: this.meta,
      sessionId: take?.sessionId || 'unknown',
      recordedAt: take?.recordedAt || new Date().toISOString(),
      chords: this.chart.chords,
      pages: this.chart.pages,
      chunks,
      finished,
      userAgent: typeof navigator === 'undefined' ? '' : navigator.userAgent,
      commit: process.env.NEXT_PUBLIC_GIT_SHA || 'unknown',
    })
  }

  private cutChunk(ending: boolean): ChunkCut | null {
    const take = this.take
    if (!take || !this.recording) return null
    const recorder = this.media
    const blobs = this.audioChunks
    this.audioChunks = []
    if (recorder) recorder.ondataavailable = (event) => { if (event.data.size) blobs.push(event.data) }
    this.media = null
    const framesNow = this.frames
    const eventsNow = this.events
    this.frames = []
    this.events = []
    const end = this.stamp()
    const names = partFileNames(take.part)
    const part = compactPart({ chunk: take.part, start: take.chunkStart, end, frames: framesNow, events: eventsNow })
    const listed: FollowManifestChunk = { part: take.part, start: take.chunkStart, end, session: names.json }
    take.chunks = take.chunks.concat([listed])
    const manifest = this.header(take.chunks, ending)
    take.part += 1
    take.chunkStart = end
    if (ending) {
      this.recording = false
      this.clearTimer()
      this.onUpdate()
    } else {
      this.startRecorder()
      this.armTimer()
    }
    return { recorder, blobs, part, manifest, sessionId: take.sessionId }
  }

  private dropEmpty(cut: ChunkCut) {
    if (this.take?.sessionId === cut.sessionId) {
      this.take.chunks = this.take.chunks.filter((chunk) => chunk.part !== cut.part.chunk)
    }
  }

  private async publishChunk(cut: ChunkCut, keepalive: boolean) {
    const audioBlob = cut.blobs.length ? new Blob(cut.blobs, { type: 'audio/webm' }) : null
    if (!keepalive && cut.recorder && cut.recorder.state === 'recording') {
      const stopped = await this.stopRecorder(cut.recorder, cut.blobs)
      return this.publishBytes(cut, stopped, false)
    }
    if (!cut.part.frames.length && !cut.part.events.length && !(audioBlob && audioBlob.size)) {
      this.dropEmpty(cut)
      return
    }
    if (audioBlob && audioBlob.size) {
      const entry = cut.manifest.chunks.find((chunk) => chunk.part === cut.part.chunk)
      if (entry) entry.audio = partFileNames(cut.part.chunk).audio
    }
    const uploaded = await uploadFiles(
      cut.manifest.songId,
      cut.sessionId,
      cut.manifest.recordedAt,
      chunkUploadFiles(cut.manifest, cut.part, audioBlob),
      { keepalive },
    )
    if (uploaded.ok) {
      if (!keepalive) {
        this.lastNote = uploaded
        this.onUpdate()
      }
      return
    }
    if (keepalive) return
    const bytes = audioBlob ? new Uint8Array(await audioBlob.arrayBuffer()) : null
    this.failZip(cut, bytes)
  }

  private async publishBytes(cut: ChunkCut, audio: Uint8Array | null, keepalive: boolean) {
    if (!cut.part.frames.length && !cut.part.events.length && !(audio && audio.length)) {
      this.dropEmpty(cut)
      return
    }
    const audioBlob = audio && audio.length ? new Blob([audio], { type: 'audio/webm' }) : null
    if (audioBlob) {
      const entry = cut.manifest.chunks.find((chunk) => chunk.part === cut.part.chunk)
      if (entry) entry.audio = partFileNames(cut.part.chunk).audio
    }
    const uploaded = await uploadFiles(
      cut.manifest.songId,
      cut.sessionId,
      cut.manifest.recordedAt,
      chunkUploadFiles(cut.manifest, cut.part, audioBlob),
      { keepalive },
    )
    if (uploaded.ok) {
      this.lastNote = uploaded
      this.onUpdate()
      return
    }
    this.failZip(cut, audio)
  }

  private failZip(cut: ChunkCut, audio: Uint8Array | null) {
    const label = String(cut.part.chunk).padStart(4, '0')
    this.failedZip = { name: `follow-part-${label}.zip`, bytes: failedChunkZip(cut.manifest, cut.part, audio) }
    this.downloadReady = true
    this.lastNote = { ok: false, message: `Chunk ${cut.part.chunk} did not upload. Download that chunk.` }
    this.onUpdate()
  }

  private stopRecorder(recorder: MediaRecorder | null, blobs: Blob[]) {
    return new Promise<Uint8Array | null>((resolve) => {
      const done = () => {
        if (!blobs.length) { resolve(null); return }
        resolve(new Blob(blobs, { type: 'audio/webm' }).arrayBuffer().then((buf) => new Uint8Array(buf)))
      }
      if (!recorder || recorder.state === 'inactive') { done(); return }
      recorder.onstop = () => { done() }
      try { recorder.stop() } catch { done() }
    })
  }
}
