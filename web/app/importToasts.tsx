"use client"

import { useEffect, useRef } from "react"
import toast from "react-hot-toast"
import { Amplify } from "aws-amplify"
import { generateClient } from "aws-amplify/api"
import amplifyconfig from "@/../src/amplifyconfiguration.json"
import { onImportStatusChanged, onImportStatusChangedWithKey } from "@/core/graphql/jam"

Amplify.configure(amplifyconfig, { ssr: true })

export type ImportEvent = {
  requestId: string
  userId?: string | null
  songId?: string | null
  jamId: string
  title: string
  artist?: string | null
  status: "PENDING" | "IMPORTING" | "DONE" | "FAILED"
  error?: string | null
  chordSheet?: string | null
  /** Present after the AppSync schema that publishes it is deployed. */
  detectedKey?: string | null
}

const TOAST_MS = 5000

function dismissButton(id: string) {
  return <button type="button" className="ml-3 font-semibold" aria-label="Dismiss" onClick={() => toast.dismiss(id)}>×</button>
}

/**
 * Subscribes only while this jam is open. Toasts are for the person who queued
 * the import. Every participant still hears the event so the chart can update.
 */
export default function ImportToasts(p: {
  jamId: string
  userId?: string
  onImported: (event: ImportEvent) => void
  onPaste: () => void
}) {
  const onImported = useRef(p.onImported)
  const onPaste = useRef(p.onPaste)
  onImported.current = p.onImported
  onPaste.current = p.onPaste

  useEffect(() => {
    if (!p.jamId) return
    const shown = new Set<string>()
    const client = generateClient()
    let stopped = false
    let sub: { unsubscribe: () => void } | null = null
    const listen = (query: string, allowFallback: boolean) => {
      const observable = client.graphql({
        query,
        variables: { jamId: p.jamId },
      }) as {
        subscribe: (observer: {
          next: (value: { data?: { onImportStatusChanged?: ImportEvent | null } }) => void
          error: (error: unknown) => void
        }) => { unsubscribe: () => void }
      }
      sub = observable.subscribe({
        next: ({ data }) => {
          const event = data?.onImportStatusChanged
          if (!event?.requestId || event.jamId !== p.jamId) return
          onImported.current(event)
          if (!p.userId || event.userId !== p.userId) return
          const title = event.title || "Song"
          shown.add(event.requestId)
          if (event.status === "PENDING" || event.status === "IMPORTING") {
            toast.loading(
              (t: { id: string }) => <span>Importing {title}…{dismissButton(t.id)}</span>,
              { id: event.requestId, duration: TOAST_MS },
            )
            return
          }
          if (event.status === "DONE") {
            toast.success(
              (t: { id: string }) => <span>{title} is ready and added to your jam{dismissButton(t.id)}</span>,
              { id: event.requestId, duration: TOAST_MS },
            )
            return
          }
          if (event.status === "FAILED") {
            toast.error(
              (t: { id: string }) => (
                <span>
                  Couldn&apos;t import {title}.{" "}
                  <button type="button" className="underline" onClick={() => { onPaste.current(); toast.dismiss(t.id) }}>
                    Paste a chart
                  </button>
                  {dismissButton(t.id)}
                </span>
              ),
              { id: event.requestId, duration: TOAST_MS },
            )
          }
        },
        error: (error) => {
          console.error(error)
          if (!allowFallback || stopped) return
          sub?.unsubscribe()
          listen(onImportStatusChanged, false)
        },
      })
    }
    listen(onImportStatusChangedWithKey, true)
    return () => {
      stopped = true
      sub?.unsubscribe()
      shown.forEach((id) => toast.dismiss(id))
    }
  }, [p.jamId, p.userId])

  return null
}
