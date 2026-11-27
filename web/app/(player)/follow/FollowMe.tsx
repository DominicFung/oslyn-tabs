"use client"

import { useEffect, useRef, useState } from 'react'
import type { FollowChartChord, FollowEstimated, FollowFrame, FollowMark, FollowPageLayout, FollowSessionFile, FollowSnapshot } from '@/core/follow'
import type { FollowPhase } from './listen'
import { DownloadSink, ProjectBucketSink, uploadOnUnload, type SavedRecording } from './sink'

const STORAGE_KEY = 'jam/followMe'
const APP_VERSION = '0.1.0'

type ManualDetail = {
  direction: 'prev' | 'next'
  source: 'key' | 'button'
  pageBefore: number
  pageAfter: number
}

export default function FollowMe(p: {
  chordSheet: string
  songKey: string
  songId: string
  title: string
  capo: number
  page: number
  onPage: (page: number) => void
}) {
  const [enabled, setEnabled] = useState(false)
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
  const songMeta = useRef({ songId: p.songId, title: p.title, key: p.songKey, capo: p.capo })
  const pendingAuto = useRef<number | null>(null)
  const pendingManual = useRef<number | null>(null)
  const seenPage = useRef(p.page)
  const streamRef = useRef<MediaStream | null>(null)
  const media = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])
  const lastSnap = useRef<FollowSnapshot | null>(null)
  const lastSession = useRef<FollowSessionFile | null>(null)
  const lastAudio = useRef<Uint8Array | null>(null)
  pageRef.current = p.page
  onPageRef.current = p.onPage
  debugRef.current = debug

  useEffect(() => {
    setEnabled(localStorage.getItem(STORAGE_KEY) === 'true')
    setDebug(new URLSearchParams(window.location.search).get('followDebug') === '1')
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

  const buildSession = (): FollowSessionFile => {
    const meta = songMeta.current
    return {
      version: 1,
      songId: meta.songId || 'unknown',
      title: meta.title,
      key: meta.key,
      capo: Number.isFinite(meta.capo) ? meta.capo : null,
      userAgent: navigator.userAgent,
      appVersion: APP_VERSION,
      commit: process.env.NEXT_PUBLIC_GIT_SHA || 'unknown',
      recordedAt: new Date().toISOString(),
      chords: chart.current.chords,
      pages: chart.current.pages,
      frames: frames.current,
      events: events.current,
    }
  }

  const takeAudio = (recorder: MediaRecorder | null) => new Promise<Uint8Array | null>((resolve) => {
    if (!recorder || recorder.state === 'inactive') {
      resolve(chunksToBytes())
      return
    }
    recorder.onstop = () => { resolve(chunksToBytes()) }
    recorder.stop()
  })

  const chunksToBytes = async () => {
    if (!audioChunks.current.length) return null
    const blob = new Blob(audioChunks.current, { type: 'audio/webm' })
    return new Uint8Array(await blob.arrayBuffer())
  }

  const beginRecording = () => {
    if (!debugRef.current || !streamRef.current || recordingRef.current) return
    frames.current = []
    events.current = []
    audioChunks.current = []
    songMeta.current = { songId: p.songId, title: p.title, key: p.songKey, capo: p.capo }
    startedAt.current = performance.now()
    seenPage.current = pageRef.current
    recordingRef.current = true
    setRecording(true)
    setDownloadReady(false)
    const mime = typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus' : ''
    try {
      const recorder = mime ? new MediaRecorder(streamRef.current, { mimeType: mime }) : new MediaRecorder(streamRef.current)
      recorder.ondataavailable = (event) => { if (event.data.size) audioChunks.current.push(event.data) }
      media.current = recorder
      recorder.start(1000)
    } catch { media.current = null }
  }

  const finishRecording = async (unload: boolean) => {
    if (!recordingRef.current) return
    recordingRef.current = false
    setRecording(false)
    const recorder = media.current
    media.current = null
    const session = buildSession()
    frames.current = []
    events.current = []
    if (unload) {
      const audio = await chunksToBytes()
      lastSession.current = session
      lastAudio.current = audio
      uploadOnUnload(session, audio)
      audioChunks.current = []
      return
    }
    const audio = await takeAudio(recorder)
    audioChunks.current = []
    lastSession.current = session
    lastAudio.current = audio
    const uploaded = await new ProjectBucketSink().save(session, audio)
    setSaveNote(uploaded)
    setDownloadReady(!uploaded.ok)
  }

  const finishRef = useRef(finishRecording)
  finishRef.current = finishRecording
  const beginRef = useRef(beginRecording)
  beginRef.current = beginRecording

  useEffect(() => {
    if (!enabled) {
      setPhase('off')
      setSnap(null)
      void finishRef.current(false)
      streamRef.current = null
      return
    }
    let cancel = false
    let stop = () => {}
    setPhase('off')
    import('./listen').then((mod) => mod.startFollow({
      chordSheet: p.chordSheet,
      songKey: p.songKey,
      getPage: () => pageRef.current,
      onPage: (page) => {
        pendingAuto.current = page
        onPageRef.current(page)
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
      const done = finishRef.current(false)
      done.finally(() => {
        stop()
        streamRef.current = null
      })
    }
  }, [enabled, p.chordSheet, p.songKey, p.songId])

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
    const onHide = () => { void finishRef.current(true) }
    window.addEventListener('pagehide', onHide)
    return () => window.removeEventListener('pagehide', onHide)
  }, [])

  const toggle = () => {
    const next = !enabled
    setEnabled(next)
    localStorage.setItem(STORAGE_KEY, next ? 'true' : 'false')
  }

  const download = () => {
    if (lastSession.current) new DownloadSink().save(lastSession.current, lastAudio.current)
  }

  const listening = phase === 'listening'
  const note = phase === 'denied' ? 'Mic blocked' : phase === 'no-chords' ? 'No chords to follow' : phase === 'error' ? 'Mic unavailable' : listening ? 'Listening' : enabled ? 'Starting mic…' : ''

  return <>
    <button
      type="button"
      aria-pressed={enabled}
      onClick={toggle}
      className={`fixed z-40 top-4 right-16 flex max-w-[calc(100vw-9.5rem)] items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold shadow sm:right-28 sm:max-w-[calc(100vw-13rem)] sm:text-sm ${enabled ? 'bg-oslyn-700 text-white' : 'bg-white/90 text-gray-800 dark:bg-gray-800 dark:text-gray-100'}`}
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
        {recording && <p className="mt-2 text-gray-400">Space marks a turn without changing the page. Arrow keys and the side taps still turn the page, and are saved as corrections.</p>}
      </>}
    </div>}
  </>
}
