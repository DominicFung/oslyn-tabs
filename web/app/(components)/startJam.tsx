"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PlayIcon } from "@heroicons/react/24/solid"

export default function StartJamButton() {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")

  const start = async () => {
    if (pending) return
    setPending(true)
    setError("")
    try {
      const res = await fetch("/api/jam/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
      })
      const data = await res.json()
      if (!res.ok || !data?.jamSessionId) {
        setError(data?.error || "Could not start the jam")
        setPending(false)
        return
      }
      router.push(`/jam/${data.jamSessionId}`)
    } catch {
      setError("Could not start the jam")
      setPending(false)
    }
  }

  return <div className="mb-8">
    <button type="button" onClick={start} disabled={pending}
      className="inline-flex flex-row text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-60">
      <PlayIcon className="w-4 h-4 mt-0.5 mr-2" />
      <span>{pending ? "Starting…" : "Start Jam"}</span>
    </button>
    <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">Private room named with today&apos;s date. Add a song once you&apos;re in.</p>
    {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
  </div>
}
