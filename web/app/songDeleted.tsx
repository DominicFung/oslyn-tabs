"use client"

import { useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import toast from "react-hot-toast"
import { Amplify } from "aws-amplify"
import { generateClient } from "aws-amplify/api"
import amplifyconfig from "@/../src/amplifyconfiguration.json"
import { onSongDeleted } from "@/core/graphql/jam"
import { _Session } from "@/core/utils/frontend"

Amplify.configure(amplifyconfig, { ssr: true })

export type JamPlaylistUpdate = {
  jamSessionId: string
  currentSong: number
  queue: Array<number | null>
  songIds: Array<string | null>
}

export type SongDeletedEvent = {
  songId: string
  title: string
  userId: string
  setsAffected: number
  jamsAffected: number
  jams: JamPlaylistUpdate[]
}

export const songDeletedEventName = "oslyn-song-deleted"

export function deletedToast(title: string, songId: string) {
  toast.success(
    (t: { id: string }) => (
      <span>
        {title} was deleted everywhere
        <button type="button" className="ml-3 font-semibold" aria-label="Dismiss" onClick={() => toast.dismiss(t.id)}>×</button>
      </span>
    ),
    { id: `deleted-${songId}`, duration: 5000 },
  )
}

export function useSongDeleted(onDeleted: (songId: string) => void) {
  const handler = useRef(onDeleted)
  handler.current = onDeleted
  useEffect(() => {
    const listen = (event: Event) => {
      const songId = (event as CustomEvent<SongDeletedEvent>).detail?.songId
      if (songId) handler.current(songId)
    }
    window.addEventListener(songDeletedEventName, listen)
    return () => window.removeEventListener(songDeletedEventName, listen)
  }, [])
}

export default function SongDeletedListener() {
  const { data: session } = useSession()
  const userId = (session?.user as _Session | undefined)?.userId

  useEffect(() => {
    const client = generateClient()
    const observable = client.graphql({ query: onSongDeleted }) as {
      subscribe: (observer: {
        next: (value: { data?: { onSongDeleted?: SongDeletedEvent | null } }) => void
        error: (error: unknown) => void
      }) => { unsubscribe: () => void }
    }
    const sub = observable.subscribe({
      next: ({ data }) => {
        const event = data?.onSongDeleted
        if (!event?.songId) return
        window.dispatchEvent(new CustomEvent(songDeletedEventName, { detail: event }))
        if (userId && event.userId === userId) deletedToast(event.title || "Song", event.songId)
      },
      error: (error) => console.error(error),
    })
    return () => sub.unsubscribe()
  }, [userId])

  return null
}
