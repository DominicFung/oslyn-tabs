"use client"

import { useEffect, useState } from "react"
import { importerBadge, importerIsOn, type ImporterStatus } from "@/core/importerAdmin"

function badgeClass(badge: ReturnType<typeof importerBadge>) {
  if (badge === "Running") return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
  if (badge === "Starting") return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
  return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
}

function formatStarted(seconds: number | null) {
  if (!seconds) return "Not started yet"
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(seconds * 1000))
}

export default function ImporterCard() {
  const [status, setStatus] = useState<ImporterStatus | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setInterval> | undefined

    const load = async () => {
      try {
        const res = await fetch("/api/profile/importer", { cache: "no-store" })
        const body = await res.json().catch(() => ({}))
        if (cancelled) return
        if (!res.ok) {
          setError(body.error || "Could not read importer status")
          if ((res.status === 401 || res.status === 403) && timer) clearInterval(timer)
          return
        }
        setError("")
        setStatus(body)
      } catch {
        if (!cancelled) setError("Could not read importer status")
      }
    }

    load()
    timer = setInterval(load, 10_000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  const badge = status ? importerBadge(status) : "Stopped"
  const on = status ? importerIsOn(status) : false

  async function toggle() {
    if (!status || busy) return
    setBusy(true)
    setError("")
    try {
      const res = await fetch("/api/profile/importer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ on: !on }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(body.error || "Could not update the importer")
        return
      }
      setStatus(body)
    } catch {
      setError("Could not update the importer")
    } finally {
      setBusy(false)
    }
  }

  return <section className="mx-auto mt-8 max-w-sm px-4 relative z-10">
    <div className="rounded-lg border border-gray-200 bg-white p-4 text-left shadow dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold uppercase text-oslyn-700 dark:text-gray-200">Importer</h2>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass(badge)}`}>{badge}</span>
      </div>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Ultimate Guitar chord imports. About $0.01–$0.02 an hour while a task is running, and $0 while it is off.
      </p>
      { status && <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        desired {status.desired} · running {status.running} · pending {status.pending}
        <span className="block">{formatStarted(status.lastStarted)}</span>
      </p> }
      <button type="button" onClick={toggle} disabled={busy || !status}
        className="mt-3 text-white bg-oslyn-700 hover:bg-oslyn-800 focus:ring-4 focus:outline-none focus:ring-oslyn-300 font-medium rounded-lg text-sm px-4 py-2 disabled:opacity-50 dark:bg-oslyn-600 dark:hover:bg-oslyn-700 dark:focus:ring-oslyn-800">
        {busy ? "Working…" : on ? "Turn off" : "Turn on"}
      </button>
      { error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p> }
    </div>
  </section>
}
