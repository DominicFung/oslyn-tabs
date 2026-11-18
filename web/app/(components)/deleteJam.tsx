"use client"

import { useState } from "react"

export default function DeleteJamButton(p: {
  jamSessionId: string
  description?: string | null
  onDeleted?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const label = p.description?.trim() || "this jam room"

  const remove = async () => {
    setBusy(true)
    setError("")
    try {
      const res = await fetch(`/api/jam/${p.jamSessionId}`, { method: "DELETE" })
      const body = await res.json() as { error?: string }
      if (!res.ok) throw new Error(body.error || "Could not delete this jam")
      setOpen(false)
      p.onDeleted?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete this jam")
      setBusy(false)
    }
  }

  return <>
    <button type="button" onClick={() => { setError(""); setOpen(true) }}
      className="text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-4 py-2">
      Delete jam
    </button>
    {open && <div role="dialog" aria-modal="true" aria-labelledby="delete-jam-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/75 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow dark:bg-gray-700">
        <h3 id="delete-jam-title" className="mb-2 text-xl font-medium text-gray-900 dark:text-white">Delete this jam?</h3>
        <p className="mb-4 text-sm text-gray-700 dark:text-gray-200">
          {label} will be removed. Everyone currently in the room, including guests and the slides view, will be asked to leave. This cannot be undone.
        </p>
        {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex justify-end">
          <button type="button" onClick={() => setOpen(false)} disabled={busy}
            className="mr-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500">
            Cancel
          </button>
          <button type="button" onClick={remove} disabled={busy}
            className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50">
            {busy ? "Deleting…" : "Delete jam"}
          </button>
        </div>
      </div>
    </div>}
  </>
}
