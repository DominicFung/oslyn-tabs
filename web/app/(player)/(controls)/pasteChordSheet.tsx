"use client"

import { FormEvent, useState } from "react"
import { JamSongChange } from "@/core/graphql/jam"

const KEYS = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]

export function chordSiteLinks(query: string) {
  const q = encodeURIComponent(query.trim())
  return {
    ultimateGuitar: `https://www.ultimate-guitar.com/search.php?search_type=title&value=${q}`,
    worshipTogether: `https://www.worshiptogether.com/search-results/#?cludoquery=${q}`,
  }
}

export function ChordSiteLinks({ query }: { query: string }) {
  const links = chordSiteLinks(query)
  return <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
    <div className="flex flex-wrap gap-3">
      <a className="underline" href={links.ultimateGuitar} target="_blank" rel="noopener noreferrer">Find on Ultimate Guitar</a>
      <a className="underline" href={links.worshipTogether} target="_blank" rel="noopener noreferrer">Find on Worship Together</a>
    </div>
    <p className="mt-2 text-xs italic">Opens a new tab. On the chart, use the Oslyn extension and choose Add to current jam.</p>
  </div>
}

export default function PasteChordSheet({ jamSessionId, onAdded }: {
  jamSessionId: string
  onAdded: (change: JamSongChange) => void
}) {
  const [title, setTitle] = useState("")
  const [artist, setArtist] = useState("")
  const [key, setKey] = useState("C")
  const [chordSheet, setChordSheet] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (pending) return
    setPending(true)
    setError("")
    try {
      const res = await fetch(`/api/jam/${jamSessionId}/paste`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, artist, key, chordSheet, jumpTo: true }),
      })
      const data = await res.json()
      if (!res.ok || !data?.song?.songId) {
        setError(data?.error || "Could not add the chord sheet")
        setPending(false)
        return
      }
      onAdded(data)
      setTitle("")
      setArtist("")
      setChordSheet("")
      setPending(false)
    } catch {
      setError("Could not add the chord sheet")
      setPending(false)
    }
  }

  return <form onSubmit={submit} className="mt-4 space-y-3">
    <div className="text-sm font-semibold text-gray-900 dark:text-white">Paste a chord sheet</div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title"
        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
      <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Artist"
        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
      <select value={key} onChange={(e) => setKey(e.target.value)}
        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:text-white">
        {KEYS.map((chord) => <option key={chord} value={chord}>{chord}</option>)}
      </select>
    </div>
    <textarea required value={chordSheet} onChange={(e) => setChordSheet(e.target.value)} rows={8} placeholder={"[Verse 1]\nC            G\nAmazing grace"}
      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 font-mono dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
    <button type="submit" disabled={pending || !title.trim() || !chordSheet.trim()}
      className="text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2.5 disabled:opacity-60">
      {pending ? "Cleaning and adding…" : "Add to jam"}
    </button>
    {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    <p className="text-xs text-gray-500 dark:text-gray-400">The chart is cleaned, saved in your library, and added to this jam. It is not made public.</p>
  </form>
}
