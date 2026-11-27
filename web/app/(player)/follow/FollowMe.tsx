"use client"

import { useEffect, useRef, useState } from 'react'
import type { FollowSnapshot } from '@/core/follow'
import type { FollowPhase } from './listen'

const STORAGE_KEY = 'jam/followMe'

export default function FollowMe(p: {
  chordSheet: string
  songKey: string
  page: number
  onPage: (page: number) => void
}) {
  const [enabled, setEnabled] = useState(false)
  const [phase, setPhase] = useState<FollowPhase | 'off'>('off')
  const [debug, setDebug] = useState(false)
  const [debugOpen, setDebugOpen] = useState(true)
  const [snap, setSnap] = useState<FollowSnapshot | null>(null)
  const pageRef = useRef(p.page)
  const onPageRef = useRef(p.onPage)
  const debugRef = useRef(false)
  pageRef.current = p.page
  onPageRef.current = p.onPage
  debugRef.current = debug

  useEffect(() => {
    setEnabled(localStorage.getItem(STORAGE_KEY) === 'true')
    setDebug(new URLSearchParams(window.location.search).get('followDebug') === '1')
  }, [])

  useEffect(() => {
    if (!enabled) {
      setPhase('off')
      setSnap(null)
      return
    }
    let cancel = false
    let stop = () => {}
    setPhase('off')
    import('./listen').then((mod) => mod.startFollow({
      chordSheet: p.chordSheet,
      songKey: p.songKey,
      getPage: () => pageRef.current,
      onPage: (page) => onPageRef.current(page),
      onPhase: (next) => { if (!cancel) setPhase(next) },
      onDebug: (snapshot) => { if (!cancel && debugRef.current) setSnap(snapshot) },
    })).then((halt) => {
      if (cancel) halt()
      else stop = halt
    }).catch(() => { if (!cancel) setPhase('error') })
    return () => {
      cancel = true
      stop()
    }
  }, [enabled, p.chordSheet, p.songKey])

  const toggle = () => {
    const next = !enabled
    setEnabled(next)
    localStorage.setItem(STORAGE_KEY, next ? 'true' : 'false')
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
    {debug && <div className="fixed z-40 bottom-20 right-4 w-64 max-w-[calc(100vw-2rem)] rounded-lg bg-gray-900/90 p-3 text-xs text-white shadow">
      <button type="button" className="font-semibold" onClick={() => setDebugOpen((open) => !open)}>
        {debugOpen ? 'Hide follow debug' : 'Follow debug'}
      </button>
      {debugOpen && <dl className="mt-2 space-y-1">
        <div className="flex justify-between gap-3"><dt>Detected</dt><dd>{snap?.detected || '—'}</dd></div>
        <div className="flex justify-between gap-3"><dt>Chart</dt><dd>{snap?.matched || '—'}</dd></div>
        <div className="flex justify-between gap-3"><dt>Confidence</dt><dd>{snap ? snap.confidence.toFixed(2) : '—'}</dd></div>
        <div className="flex justify-between gap-3"><dt>Transposition</dt><dd>{snap ? `${snap.transpositionLocked ? '' : '~'}+${snap.transposition}` : '—'}</dd></div>
      </dl>}
    </div>}
  </>
}
