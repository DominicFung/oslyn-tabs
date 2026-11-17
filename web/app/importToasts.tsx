"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import toast, { Toaster } from "react-hot-toast"
import { Amplify } from "aws-amplify"
import { generateClient } from "aws-amplify/api"
import amplifyconfig from "@/../src/amplifyconfiguration.json"
import { onImportStatusChanged } from "@/core/graphql/jam"
import { _Session } from "@/core/utils/frontend"

Amplify.configure(amplifyconfig, { ssr: true })

type ImportEvent = {
  requestId: string
  jamId: string
  title: string
  artist?: string | null
  status: "PENDING" | "IMPORTING" | "DONE" | "FAILED"
  error?: string | null
}

export default function ImportToasts() {
  const { data: session } = useSession()
  const userId = (session?.user as _Session | undefined)?.userId

  useEffect(() => {
    if (!userId) return
    const client = generateClient()
    const observable = client.graphql({
      query: onImportStatusChanged,
      variables: { userId },
    }) as {
      subscribe: (observer: {
        next: (value: { data?: { onImportStatusChanged?: ImportEvent | null } }) => void
        error: (error: unknown) => void
      }) => { unsubscribe: () => void }
    }
    const sub = observable.subscribe({
      next: ({ data }) => {
        const event = data?.onImportStatusChanged
        if (!event?.requestId) return
        const title = event.title || "Song"
        if (event.status === "PENDING" || event.status === "IMPORTING") {
          toast.loading(`Importing ${title}…`, { id: event.requestId })
          return
        }
        if (event.status === "DONE") {
          const who = event.artist ? `${title} by ${event.artist}` : title
          toast.success(
            (t: { id: string }) => (
              <a href={`/jam/${event.jamId}`} onClick={() => toast.dismiss(t.id)}>
                {who} is ready and added to your jam
              </a>
            ),
            { id: event.requestId, duration: 8000 },
          )
          return
        }
        if (event.status === "FAILED") {
          toast.error(
            (t: { id: string }) => (
              <span>
                Couldn&apos;t import {title}.{" "}
                <a className="underline" href={`/jam/${event.jamId}`} onClick={() => toast.dismiss(t.id)}>Paste a chart in the jam</a>
              </span>
            ),
            { id: event.requestId, duration: 10000 },
          )
        }
      },
      error: (error) => console.error(error),
    })
    return () => sub.unsubscribe()
  }, [userId])

  return <Toaster position="bottom-left" />
}
