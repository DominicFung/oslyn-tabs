"use client"

import { useEffect, useRef, useState } from 'react'
import type { FollowChartChord, FollowEstimated, FollowFrame, FollowManifest, FollowManifestChunk, FollowMark, FollowPageLayout, FollowSnapshot } from '@/core/follow'
import { compactPart, partFileNames } from '@/core/follow'
import type { FollowPhase } from './listen'
import { chunkUploadFiles, downloadZip, failedChunkZip, uploadFiles, type SavedRecording } from './sink'

const STORAGE_KEY = 'jam/followMe'
const APP_VERSION = '0.1.0'
const CHUNK_MS = 120_000

type ManualDetail = {
  direction: 'prev' | 'next'
  source: 'key' | 'button' | 'voice'
  pageBefore: number
  pageAfter: number
}

const SMARTER_KEY = 'jam/followSmarter'
const ASR_MODEL_KEY = 'jam/followAsr'

export default function FollowMe(p: {
  chordSheet: string
  chartKey: string
  songKey: string
  songId: string
  title: string
  capo: number
  page: number
  onPage: (page: number) => void
}) {
  const [enabled, setEnabled] = useState(false)
  const [smarter, setSmarter] = useState(false)
  const [asrModel, setAsrModel] = useState<'tiny' | 'base'>('tiny')
  const [asr, setAsr] = useState<'off' | 'loading' | 'ready' | 'error'>('off')
  const [phase, setPhase] = useState<FollowPhase | 'off'>('off')
  const [debug, setDebug] = useState(false)
  const [debugOpen, setDebugOpen] = useState(true)
  const [snap, setSnap] = useState<FollowSnapshot | null>(null)
  const [recording, setRecording] = useState(false)
  const [saveNote, setSaveNote] = useState<SavedRecording | null>(null)
  const [downloadReady, setDownloadReady] = useState(false)
  const pageRef = useRef(p.page)
  const onPageRef = useRef(p.onPage)
  const debugRef = useRef(false)
  const recordingRef = useRef(false)
  const startedAt = useRef(0)
  const frames = useRef<FollowFrame[]>([])
  const events = useRef<FollowMark[]>([])
  const chart = useRef<{ chords: FollowChartChord[], pages: FollowPageLayout[] }>({ chords: [], pages: [] })
  const songMeta = useRef({ songId: p.songId, title: p.title, chartKey: p.chartKey, key: p.songKey, capo: p.capo })
  const pendingAuto = useRef<number | null>(null)
  const pendingManual = useRef<number | null>(null)
  const seenPage = useRef(p.page)
  const streamRef = useRef<MediaStream | null>(null)
  const media = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])
  const lastSnap = useRef<FollowSnapshot | null>(null)
  const takeRef = useRef<{
    sessionId: string
    recordedAt: string
    part: number
    chunkStart: number
    chunks: FollowManifestChunk[]
  } | null>(null)
  const chunkTimer = useRef<number | null>(null)
  const failedZip = useRef<{ name: string, bytes: Uint8Array } | null>(null)
  const flushChain = useRef(Promise.resolve())
  pageRef.current = p.page
  onPageRef.current = p.onPage
  debugRef.current = debug

  useEffect(() => {
    const read = () => {
      setSmarter(localStorage.getItem(SMARTER_KEY) === 'true')
      setAsrModel(localStorage.getItem(ASR_MODEL_KEY) === 'base' ? 'base' : 'tiny')
    }
    setEnabled(localStorage.getItem(STORAGE_KEY) === 'true')
    setDebug(new URLSearchParams(window.location.search).get('followDebug') === '1')
    read()
    window.addEventListener('follow-smarter', read)
    window.addEventListener('storage', read)
    return () => {
      window.removeEventListener('follow-smarter', read)
      window.removeEventListener('storage', read)
    }
  }, [])

  const stamp = () => Math.round(performance.now() - startedAt.current)

  const estimatedNow = (): FollowEstimated | undefined => {
    const snapNow = lastSnap.current
    if (!snapNow) return undefined
    return {
      index: snapNow.index,
      line: snapNow.line,
      page: snapNow.page,
      matched: snapNow.matched,
      confidence: snapNow.confidence,
    }
  }

  const clearChunkTimer = () => {
    if (chunkTimer.current != null) {
      window.clearTimeout(chunkTimer.current)
      chunkTimer.current = null
    }
  }

  const startRecorder = () => {
    if (!streamRef.current) return
    const mime = typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus' : ''
    try {
      const recorder = mime ? new MediaRecorder(streamRef.current, { mimeType: mime }) : new MediaRecorder(streamRef.current)
      recorder.ondataavailable = (event) => { if (event.data.size) audioChunks.current.push(event.data) }
      media.current = recorder
      recorder.start(1000)
    } catch { media.current = null }
  }

  const blobsToBytes = async (blobs: Blob[]) => {
    if (!blobs.length) return null
    return new Uint8Array(await new Blob(blobs, { type: 'audio/webm' }).arrayBuffer())
  }

  const headerFor = (chunks: FollowManifestChunk[], finished: boolean): FollowManifest => {
    const meta = songMeta.current
    const take = takeRef.current
    return {
      version: 1,
      songId: meta.songId || 'unknown',
      sessionId: take?.sessionId || 'unknown',
      title: meta.title,
      chartKey: meta.chartKey,
      key: meta.key,
      capo: Number.isFinite(meta.capo) ? meta.capo : null,
      userAgent: navigator.userAgent,
      appVersion: APP_VERSION,
      commit: process.env.NEXT_PUBLIC_GIT_SHA || 'unknown',
      recordedAt: take?.recordedAt || new Date().toISOString(),
      chords: chart.current.chords,
      pages: chart.current.pages,
      chunks,
      finished,
    }
  }

  type ChunkCut = {
    recorder: MediaRecorder | null
    blobs: Blob[]
    part: ReturnType<typeof compactPart>
    manifest: FollowManifest
    sessionId: string
  }

  // Cuts the open MediaRecorder session into one part. Timeslice blobs from that
  // session concatenate to a playable webm. The next part starts a new recorder.
  const cutChunk = (ending: boolean): ChunkCut | null => {
    const take = takeRef.current
    if (!take || !recordingRef.current) return null
    const recorder = media.current
    const blobs = audioChunks.current
    audioChunks.current = []
    if (recorder) recorder.ondataavailable = (event) => { if (event.data.size) blobs.push(event.data) }
    media.current = null
    const framesNow = frames.current
    const eventsNow = events.current
    frames.current = []
    events.current = []
    const end = stamp()
    const names = partFileNames(take.part)
    const part = compactPart({ chunk: take.part, start: take.chunkStart, end, frames: framesNow, events: eventsNow })
    const listed: FollowManifestChunk = { part: take.part, start: take.chunkStart, end, session: names.json }
    take.chunks = [...take.chunks, listed]
    const manifest = headerFor(take.chunks, ending)
    take.part += 1
    take.chunkStart = end
    if (ending) {
      recordingRef.current = false
      setRecording(false)
      clearChunkTimer()
    } else {
      startRecorder()
      clearChunkTimer()
      chunkTimer.current = window.setTimeout(() => { void flushChunk('timer') }, CHUNK_MS)
    }
    return { recorder, blobs, part, manifest, sessionId: take.sessionId }
  }

  const stopRecorder = (recorder: MediaRecorder | null, blobs: Blob[]) => new Promise<Uint8Array | null>((resolve) => {
    const done = () => { resolve(blobsToBytes(blobs)) }
    if (!recorder || recorder.state === 'inactive') { done(); return }
    recorder.onstop = () => { done() }
    try { recorder.stop() } catch { done() }
  })

  const dropEmpty = (cut: ChunkCut) => {
    if (takeRef.current?.sessionId === cut.sessionId) {
      takeRef.current.chunks = takeRef.current.chunks.filter((chunk) => chunk.part !== cut.part.chunk)
    }
  }

  const publishChunk = async (cut: ChunkCut, keepalive: boolean) => {
    const audioBlob = cut.blobs.length ? new Blob(cut.blobs, { type: 'audio/webm' }) : null
    if (!keepalive && cut.recorder && cut.recorder.state === 'recording') {
      const stopped = await stopRecorder(cut.recorder, cut.blobs)
      return publishBytes(cut, stopped, false)
    }
    if (!cut.part.frames.length && !cut.part.events.length && !(audioBlob && audioBlob.size)) {
      dropEmpty(cut)
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
      if (!keepalive) setSaveNote(uploaded)
      return
    }
    if (keepalive) return
    const bytes = audioBlob ? new Uint8Array(await audioBlob.arrayBuffer()) : null
    const label = String(cut.part.chunk).padStart(4, '0')
    failedZip.current = { name: `follow-part-${label}.zip`, bytes: failedChunkZip(cut.manifest, cut.part, bytes) }
    setDownloadReady(true)
    setSaveNote({ ok: false, message: `Chunk ${cut.part.chunk} did not upload. Download that chunk.` })
  }

  const publishBytes = async (cut: ChunkCut, audio: Uint8Array | null, keepalive: boolean) => {
    if (!cut.part.frames.length && !cut.part.events.length && !(audio && audio.length)) {
      dropEmpty(cut)
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
      setSaveNote(uploaded)
      return
    }
    const label = String(cut.part.chunk).padStart(4, '0')
    failedZip.current = { name: `follow-part-${label}.zip`, bytes: failedChunkZip(cut.manifest, cut.part, audio) }
    setDownloadReady(true)
    setSaveNote({ ok: false, message: `Chunk ${cut.part.chunk} did not upload. Download that chunk.` })
  }

  const flushChunk = (kind: 'timer' | 'hidden' | 'stop' | 'pagehide') => {
    if (kind === 'pagehide') {
      const cut = cutChunk(true)
      if (cut) void publishChunk(cut, true)
      return Promise.resolve()
    }
    const run = async () => {
      const cut = cutChunk(kind === 'stop')
      if (cut) await publishChunk(cut, false)
    }
    const next = flushChain.current.then(run, run)
    flushChain.current = next.then(() => {}, () => {})
    return next
  }

  const beginRecording = () => {
    if (!debugRef.current || !streamRef.current || recordingRef.current) return
    frames.current = []
    events.current = []
    audioChunks.current = []
    songMeta.current = { songId: p.songId, title: p.title, chartKey: p.chartKey, key: p.songKey, capo: p.capo }
    startedAt.current = performance.now()
    seenPage.current = pageRef.current
    takeRef.current = {
      sessionId: crypto.randomUUID(),
      recordedAt: new Date().toISOString(),
      part: 1,
      chunkStart: 0,
      chunks: [],
    }
    recordingRef.current = true
    setRecording(true)
    setDownloadReady(false)
    failedZip.current = null
    startRecorder()
    clearChunkTimer()
    chunkTimer.current = window.setTimeout(() => { void flushChunk('timer') }, CHUNK_MS)
  }

  const finishRef = useRef(flushChunk)
  finishRef.current = flushChunk
  const beginRef = useRef(beginRecording)
  beginRef.current = beginRecording

  useEffect(() => {
    if (!enabled) {
      setPhase('off')
      setSnap(null)
      void finishRef.current('stop')
      streamRef.current = null
      return
    }
    let cancel = false
    let stop = () => {}
    setPhase('off')
    if (!smarter) setAsr('off')
    import('./listen').then((mod) => mod.startFollow({
      chordSheet: p.chordSheet,
      chartKey: p.chartKey,
      songKey: p.songKey,
      getPage: () => pageRef.current,
      onPage: (page) => {
        pendingAuto.current = page
        onPageRef.current(page)
      },
      smarter,
      songId: p.songId,
      asrModel,
      onAsr: (status) => { if (!cancel) setAsr(status) },
      onVoice: (direction) => {
        const before = pageRef.current
        const after = direction === 'next' ? before + 1 : Math.max(0, before - 1)
        if (after === before) return
        if (recordingRef.current) {
          pendingManual.current = after
          events.current.push({
            t: Math.round(performance.now() - startedAt.current),
            type: 'manual-correction',
            direction,
            source: 'voice',
            pageBefore: before,
            pageAfter: after,
            page: after,
            estimated: estimatedNow(),
          })
        }
        onPageRef.current(after)
      },
      onPhase: (next) => { if (!cancel) setPhase(next) },
      onChart: (next) => { chart.current = next },
      onFrame: (snapshot, chroma, energy) => {
        lastSnap.current = snapshot
        if (!cancel && debugRef.current) setSnap(snapshot)
        if (!recordingRef.current) return
        frames.current.push({
          t: Math.round(performance.now() - startedAt.current),
          chroma,
          energy,
          detected: snapshot.detected,
          index: snapshot.index,
          line: snapshot.line,
          page: snapshot.page,
          matched: snapshot.matched,
          confidence: snapshot.confidence,
          transposition: snapshot.transposition,
          transpositionLocked: snapshot.transpositionLocked,
          state: snapshot.state,
        })
      },
      onDebug: () => {},
    })).then((handle) => {
      if (cancel) {
        handle.stop()
        return
      }
      stop = handle.stop
      streamRef.current = handle.stream
      if (debugRef.current) beginRef.current()
    }).catch(() => { if (!cancel) setPhase('error') })
    return () => {
      cancel = true
      const done = finishRef.current('stop')
      done.finally(() => {
        stop()
        streamRef.current = null
      })
    }
  }, [enabled, smarter, asrModel, p.chordSheet, p.chartKey, p.songKey, p.songId])

  useEffect(() => {
    if (!recordingRef.current) { seenPage.current = p.page; return }
    if (p.page === seenPage.current) return
    const t = Math.round(performance.now() - startedAt.current)
    if (pendingManual.current === p.page) {
      pendingManual.current = null
      pendingAuto.current = null
    } else if (pendingAuto.current === p.page) {
      events.current.push({ t, type: 'auto-turn', page: p.page, pageBefore: seenPage.current, pageAfter: p.page })
      pendingAuto.current = null
    } else {
      events.current.push({ t, type: 'page-change', page: p.page, pageBefore: seenPage.current, pageAfter: p.page })
    }
    seenPage.current = p.page
  }, [p.page])

  useEffect(() => {
    const onManual = (event: Event) => {
      if (!debugRef.current || !recordingRef.current) return
      const detail = (event as CustomEvent<ManualDetail>).detail
      if (!detail) return
      pendingManual.current = detail.pageAfter
      events.current.push({
        t: Math.round(performance.now() - startedAt.current),
        type: 'manual-correction',
        direction: detail.direction,
        source: detail.source,
        pageBefore: detail.pageBefore,
        pageAfter: detail.pageAfter,
        page: detail.pageAfter,
        estimated: estimatedNow(),
      })
    }
    document.body.addEventListener('follow-manual-page', onManual)
    return () => document.body.removeEventListener('follow-manual-page', onManual)
  }, [])

  useEffect(() => {
    if (!debug) return
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || !recordingRef.current) return
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
      event.preventDefault()
      event.stopImmediatePropagation()
      events.current.push({
        t: Math.round(performance.now() - startedAt.current),
        type: 'should-turn',
        page: pageRef.current,
        estimated: estimatedNow(),
      })
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [debug])

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') void finishRef.current('hidden')
    }
    const onHide = () => { void finishRef.current('pagehide') }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onHide)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onHide)
    }
  }, [])

  const toggle = () => {
    const next = !enabled
    setEnabled(next)
    localStorage.setItem(STORAGE_KEY, next ? 'true' : 'false')
  }

  const download = () => {
    if (failedZip.current) downloadZip(failedZip.current.name, failedZip.current.bytes)
  }

  const listening = phase === 'listening'
  const asrNote = smarter && asr === 'loading' ? 'Loading lyrics…' : smarter && asr === 'error' ? 'Lyrics unavailable' : ''
  const note = asrNote || (phase === 'denied' ? 'Mic blocked' : phase === 'no-chords' ? 'No chords to follow' : phase === 'error' ? 'Mic unavailable' : listening ? 'Listening' : enabled ? 'Starting mic…' : '')

  return <>
    <button
      type="button"
      aria-pressed={enabled}
      onClick={toggle}
      className={`fixed right-2 top-24 z-40 flex max-w-[calc(100vw-1rem)] items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold shadow sm:right-28 sm:top-4 sm:max-w-[calc(100vw-13rem)] sm:text-sm ${enabled ? 'bg-oslyn-700 text-white' : 'bg-white/90 text-gray-800 dark:bg-gray-800 dark:text-gray-100'}`}
    >
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${listening ? 'bg-emerald-400' : 'bg-gray-400'}`} />
      <span className="truncate">Follow me (beta)</span>
      {note ? <span className="hidden font-medium opacity-80 sm:inline">{note}</span> : null}
    </button>
    {debug && <div className="fixed z-40 bottom-20 right-4 w-72 max-w-[calc(100vw-2rem)] rounded-lg bg-gray-900/90 p-3 text-xs text-white shadow">
      <button type="button" className="font-semibold" onClick={() => setDebugOpen((open) => !open)}>
        {debugOpen ? 'Hide follow debug' : 'Follow debug'}
      </button>
      {debugOpen && <>
        <dl className="mt-2 space-y-1">
          <div className="flex justify-between gap-3"><dt>Detected</dt><dd>{snap?.detected || '—'}</dd></div>
          <div className="flex justify-between gap-3"><dt>Chart</dt><dd>{snap?.matched || '—'}</dd></div>
          <div className="flex justify-between gap-3"><dt>Confidence</dt><dd>{snap ? snap.confidence.toFixed(2) : '—'}</dd></div>
          <div className="flex justify-between gap-3"><dt>Transposition</dt><dd>{snap ? `${snap.transpositionLocked ? '' : '~'}+${snap.transposition}` : '—'}</dd></div>
          <div className="flex justify-between gap-3"><dt>Chart key</dt><dd>{p.chartKey}</dd></div>
          <div className="flex justify-between gap-3"><dt>Jam key</dt><dd>{p.songKey}</dd></div>
          <div className="flex justify-between gap-3"><dt>Capo</dt><dd>{Number.isFinite(p.capo) ? p.capo : '—'}</dd></div>
          <div className="flex justify-between gap-3"><dt>State</dt><dd>{recording ? 'Recording…' : snap?.state || '—'}</dd></div>
        </dl>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" disabled={!recording} onClick={() => {
            if (!recordingRef.current) return
            events.current.push({
              t: Math.round(performance.now() - startedAt.current),
              type: 'should-turn',
              page: pageRef.current,
              estimated: estimatedNow(),
            })
          }} className="rounded bg-oslyn-700 px-2 py-1 font-semibold disabled:opacity-40">Should turn now</button>
          {downloadReady && <button type="button" onClick={download} className="rounded bg-gray-700 px-2 py-1 font-semibold">Download</button>}
        </div>
        {saveNote && <p className="mt-2 text-gray-200">{saveNote.message}</p>}
        {recording && <p className="mt-2 text-gray-400">Space marks a turn without changing the page. Arrow keys and the side taps still turn the page, and are saved as corrections. About every two minutes the take uploads a part that plays on its own.</p>}
      </>}
    </div>}
  </>
}
