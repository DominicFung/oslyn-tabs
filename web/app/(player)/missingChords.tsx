"use client"

import { requestChordImport } from "./chordImport"

export default function MissingChords(p: {
  songId: string
  jamSessionId: string
  title: string
  artist?: string | null
  userId?: string
  canImport: boolean
}) {
  return <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{p.title}</p>
    {p.artist && <p className="mt-2 text-gray-500 dark:text-gray-300">{p.artist}</p>}
    <p className="mt-4 max-w-md text-gray-600 dark:text-gray-300">This song does not have a chord sheet yet.</p>
    {p.canImport && p.userId && <button type="button"
      onClick={() => requestChordImport({
        songId: p.songId,
        jamSessionId: p.jamSessionId,
        title: p.title,
        artist: p.artist,
        userId: p.userId || "",
      })}
      className="mt-6 text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5">
      Import chords from Ultimate Guitar
    </button>}
    {p.canImport && <p className="mt-3 max-w-md text-xs text-gray-500 dark:text-gray-400">Opens a search in a new tab. On the chart, use the Oslyn extension and choose Import into {p.title}. You can also paste a chart from the song menu.</p>}
  </div>
}
