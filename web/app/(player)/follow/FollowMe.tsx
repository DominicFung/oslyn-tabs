"use client"

import { useEffect, useRef, useState } from 'react'
import type { FollowEstimated, FollowSnapshot } from '@/core/follow'
import type { FollowPhase } from './listen'
import { downloadZip, type SavedRecording } from './sink'
import { ChunkTake } from './chunkTake'

const STORAGE_KEY = 'jam/followMe'
const SMARTER_KEY = 'jam/followSmarter'
const ASR_MODEL_KEY = 'jam/followAsr'

type ManualDetail = {
  direction: 'prev' | 'next'
  source: 'key' | 'button' | 'voice'
  pageBefore: number
  pageAfter: number
}

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
  const streamRef = useRef<MediaStream | null>(null)
  const lastSnap = useRef<FollowSnapshot | null>(null)
  const takeRef = useRef<ChunkTake | null>(null)
  if (takeRef.current == null) {
    takeRef.current = new ChunkTake(() => {
      const current = takeRef.current
      if (!current) return
      setRecording(current.recording)
      setSaveNote(current.lastNote)
      setDownloadReady(current.downloadReady)
    })
  }
  const take = takeRef.current
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

  const beginRecording = () => {
    if (!debugRef.current || !streamRef.current || take.recording) return
    take.meta = { songId: p.songId, title: p.title, chartKey: p.chartKey, key: p.songKey, capo: p.capo, mode: 'follow' }
    take.start(streamRef.current, pageRef.current, false)
  }

  const finishRef = useRef(take.flush.bind(take))
  finishRef.current = (kind) => take.flush(kind)
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
        take.armAuto(page)
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
        take.noteManual({
          direction,
          source: 'voice',
          pageBefore: before,
          pageAfter: after,
        }, estimatedNow())
        onPageRef.current(after)
      },
      onPhase: (next) => { if (!cancel) setPhase(next) },
      onChart: (next) => { take.chart = next },
      onFrame: (snapshot, chroma, energy) => {
        lastSnap.current = snapshot
        if (!cancel && debugRef.current) setSnap(snapshot)
        if (!take.recording) return
        take.pushFrame({
          t: take.stamp(),
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
  }, [enabled, smarter, asrModel, p.chordSheet, p.chartKey, p.songKey, p.songId, take])

  useEffect(() => { take.onPage(p.page) }, [p.page, take])

  useEffect(() => {
    const onManual = (event: Event) => {
      if (!debugRef.current) return
      const detail = (event as CustomEvent<ManualDetail>).detail
      if (!detail) return
      take.noteManual(detail, estimatedNow())
    }
    document.body.addEventListener('follow-manual-page', onManual)
    return () => document.body.removeEventListener('follow-manual-page', onManual)
  }, [take])

  useEffect(() => {
    if (!debug) return
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
      event.preventDefault()
      event.stopImmediatePropagation()
      take.mark({ type: 'should-turn', page: pageRef.current, estimated: estimatedNow() })
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [debug, take])

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
    if (take.failedZip) downloadZip(take.failedZip.name, take.failedZip.bytes)
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
            take.mark({ type: 'should-turn', page: pageRef.current, estimated: estimatedNow() })
          }} className="rounded bg-oslyn-700 px-2 py-1 font-semibold disabled:opacity-40">Should turn now</button>
          {downloadReady && <button type="button" onClick={download} className="rounded bg-gray-700 px-2 py-1 font-semibold">Download</button>}
        </div>
        {saveNote && <p className="mt-2 text-gray-200">{saveNote.message}</p>}
        {recording && <p className="mt-2 text-gray-400">Space marks a turn without changing the page. Arrow keys and the side taps still turn the page, and are saved as corrections. About every two minutes the take uploads a part that plays on its own.</p>}
      </>}
    </div>}
  </>
}
