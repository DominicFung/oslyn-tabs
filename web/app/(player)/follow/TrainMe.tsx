"use client"

import { useEffect, useRef, useState } from 'react'
import { captureChart, chartSymbols } from '@/core/captureChart'
import { ChunkTake } from './chunkTake'
import { estimateClockOffset, formatElapsed } from '@/core/takeManifest'

type ManualDetail = {
  direction: 'prev' | 'next'
  source: 'key' | 'button' | 'voice'
  pageBefore: number
  pageAfter: number
}

/**
 * Mic and page taps only. Does not start the score follower, smarter listening, or voice commands.
 */
export default function TrainMe(p: {
  chordSheet: string
  chartKey: string
  songKey: string
  songId: string
  title: string
  capo: number
  page: number
  jamId: string
  userId: string
}) {
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState('')
  const pageRef = useRef(p.page)
  const takeRef = useRef<ChunkTake | null>(null)
  if (takeRef.current == null) {
    takeRef.current = new ChunkTake(() => {
      const current = takeRef.current
      if (!current) return
      setRecording(current.recording)
    })
  }
  const take = takeRef.current
  pageRef.current = p.page

  const applyChart = () => {
    const captured = captureChart(p.chordSheet, p.chartKey, p.songKey)
    take.chart = { chords: chartSymbols(captured.chords), pages: captured.pages }
    take.meta = {
      songId: p.songId,
      title: p.title,
      chartKey: p.chartKey,
      key: p.songKey,
      capo: p.capo,
      mode: 'train',
      jamId: p.jamId,
      userId: p.userId,
      clockOffsetMs: take.meta.clockOffsetMs,
    }
  }

  const sampleClock = async () => {
    const before = Date.now()
    try {
      const response = await fetch('/api/follow/clock')
      const after = Date.now()
      if (!response.ok) return
      const body = await response.json() as { now?: number }
      if (typeof body.now !== 'number') return
      take.meta.clockOffsetMs = estimateClockOffset(body.now, before, after)
    } catch { /* the take still records; alignment falls back to each device clock */ }
  }

  useEffect(() => { take.onPage(p.page) }, [p.page, take])

  useEffect(() => {
    const onJamPage = (event: Event) => {
      const detail = (event as CustomEvent<{ page?: number, receivedAt?: number }>).detail
      if (!detail || typeof detail.page !== 'number') return
      take.noteRemote(detail.page, detail.receivedAt || Date.now())
    }
    document.body.addEventListener('jam-page', onJamPage)
    return () => document.body.removeEventListener('jam-page', onJamPage)
  }, [take])

  useEffect(() => {
    const onManual = (event: Event) => {
      const detail = (event as CustomEvent<ManualDetail>).detail
      if (!detail || detail.source === 'voice') return
      take.noteManual(detail)
    }
    document.body.addEventListener('follow-manual-page', onManual)
    return () => document.body.removeEventListener('follow-manual-page', onManual)
  }, [take])

  useEffect(() => {
    const flush = () => { void take.flush('pagehide') }
    window.addEventListener('pagehide', flush)
    return () => {
      window.removeEventListener('pagehide', flush)
      void take.flush('stop')
    }
  }, [p.songId, take])

  useEffect(() => {
    if (!recording) return
    setElapsed(take.elapsedMs())
    const id = window.setInterval(() => setElapsed(take.elapsedMs()), 250)
    return () => window.clearInterval(id)
  }, [recording, take])

  const toggle = async () => {
    if (take.recording) {
      await take.flush('stop')
      setElapsed(0)
      return
    }
    setError('')
    applyChart()
    await sampleClock()
    applyChart()
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setError('Mic blocked')
      return
    }
    if (take.recording) {
      stream.getTracks().forEach((track) => track.stop())
      return
    }
    take.start(stream, pageRef.current, true)
  }

  return <button
    type="button"
    aria-pressed={recording}
    onClick={() => { void toggle() }}
    className={`fixed right-2 top-36 z-40 flex max-w-[calc(100vw-1rem)] items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-gray-800 shadow sm:right-28 sm:top-16 sm:max-w-[calc(100vw-13rem)] sm:text-sm dark:bg-gray-800 dark:text-gray-100 ${recording ? 'ring-2 ring-red-500' : ''}`}
  >
    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${recording ? 'bg-red-500' : 'bg-gray-400'}`} />
    <span className="truncate">Train me</span>
    {recording ? <span className="font-medium tabular-nums">{formatElapsed(elapsed)}</span> : null}
    {error ? <span className="font-medium opacity-80">{error}</span> : null}
  </button>
}
