"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface DeleteSetButtonProps {
  setListId: string
  description: string
}

export default function DeleteSetButton(p: DeleteSetButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState<number | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setCount(null)
    setError("")

    const load = async () => {
      try {
        const res = await fetch(`/api/set/${p.setListId}/jams`)
        const body = await res.json() as { count?: number, error?: string }
        if (!res.ok || typeof body.count !== "number") {
          throw new Error(body.error || "Could not check jam rooms")
        }
        if (!cancelled) setCount(body.count)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not check jam rooms")
      }
    }

    load()
    return () => { cancelled = true }
  }, [open, p.setListId])

  const remove = async () => {
    setBusy(true)
    setError("")
    try {
      const res = await fetch(`/api/set/${p.setListId}`, { method: "DELETE" })
      const body = await res.json() as { error?: string, jamsRemoved?: number }
      if (!res.ok) throw new Error(body.error || "Could not delete this set")
      setOpen(false)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete this set")
      setBusy(false)
    }
  }

  const rooms = count === 1 ? "jam room" : "jam rooms"

  return <>
    <button type="button" onClick={() => setOpen(true)}
      className="flex flex-row text-white bg-gray-600 hover:bg-gray-700 focus:ring-4 focus:outline-none focus:ring-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2"
    >
      Delete
    </button>
    {open && <div role="dialog" aria-modal="true" aria-labelledby="delete-set-title"
      className="fixed top-0 left-0 right-0 z-50 w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-full max-h-full bg-gray-900/75">
      <div className="relative w-full h-full max-w-md max-h-full mx-auto flex flex-col">
        <div className="flex-1" />
        <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
          <div className="px-6 py-6">
            <h3 id="delete-set-title" className="mb-2 text-xl font-medium text-gray-900 dark:text-white">Delete this set?</h3>
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">{p.description}</p>
            {count === null && !error && <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Checking jam rooms…</p>}
            {count !== null && <p className="mb-4 text-sm text-gray-700 dark:text-gray-200">
              This will end and remove <span className="font-semibold">{count}</span> {rooms} that use this set.
              Songs in the set stay in your library. This cannot be undone.
            </p>}
            {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
            <div className="flex flex-row justify-end">
              <button type="button" onClick={() => setOpen(false)} disabled={busy}
                className="text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium rounded-lg text-sm px-4 py-2 mr-2 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500">
                Cancel
              </button>
              <button type="button" onClick={remove} disabled={busy || count === null}
                className="text-white bg-red-700 hover:bg-red-800 disabled:opacity-50 font-medium rounded-lg text-sm px-4 py-2">
                {busy ? "Deleting…" : "Delete set"}
              </button>
            </div>
          </div>
        </div>
        <div className="flex-1" />
      </div>
    </div>}
  </>
}
