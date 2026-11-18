"use client"

import { useState } from "react"
import { TrashIcon } from "@heroicons/react/24/solid"
import { deletedToast } from "@/app/songDeleted"

export default function DeleteSongButton(p: {
  songId: string
  title: string
  onDeleted?: () => void
  compact?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [usage, setUsage] = useState<{ setCount: number, jamCount: number } | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const ask = async () => {
    setOpen(true)
    setError("")
    setUsage(null)
    try {
      const res = await fetch(`/api/song/${p.songId}/usage`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Could not check where this song is used")
      setUsage({ setCount: data.setCount || 0, jamCount: data.jamCount || 0 })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not check where this song is used")
    }
  }

  const confirm = async () => {
    setBusy(true)
    setError("")
    try {
      const res = await fetch(`/api/song/${p.songId}/delete`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Could not delete that song")
      deletedToast(data.title || p.title, p.songId)
      setOpen(false)
      p.onDeleted?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete that song")
    } finally {
      setBusy(false)
    }
  }

  const sets = usage?.setCount || 0
  const jams = usage?.jamCount || 0

  return <>
    <button type="button" onClick={ask}
      className={p.compact
        ? "text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-4 py-2.5 text-center mr-2 mb-2"
        : "text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-4 py-2.5"}>
      {p.compact ? <TrashIcon className="w-4 h-4" /> : "Delete"}
    </button>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 text-left shadow dark:bg-gray-800" role="dialog" aria-modal="true">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Delete {p.title} everywhere?</h2>
        {usage && <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
          It is in {sets} {sets === 1 ? "set" : "sets"} and {jams} {jams === 1 ? "jam room" : "jam rooms"}. Open rooms drop it immediately. This cannot be undone.
        </p>}
        {!usage && !error && <p className="mt-3 text-sm text-gray-500">Checking sets and jam rooms…</p>}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-gray-600 dark:text-gray-200">Cancel</button>
          <button type="button" disabled={!usage || busy} onClick={confirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-60">
            {busy ? "Deleting…" : "Delete everywhere"}
          </button>
        </div>
      </div>
    </div>}
  </>
}
