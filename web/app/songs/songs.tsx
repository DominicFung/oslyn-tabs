"use client"

import { useMemo, useState } from "react"
import { Song, User } from "@/../src/API"
import SongTable from "@/app/(components)/(song)/songTable"

interface SongsProps {
  user: User | null
  ownSongs: Song[]
  sharedSongs: Song[]
}

export default function Songs(p: SongsProps) {
  const [query, setQuery] = useState("")
  const needle = query.trim().toLowerCase()
  const total = p.ownSongs.length
  const filtered = useMemo(() => {
    if (!needle) return p.ownSongs
    return p.ownSongs.filter((song) => {
      const title = song.title?.toLowerCase() || ""
      const artist = song.artist?.toLowerCase() || ""
      return title.includes(needle) || artist.includes(needle)
    })
  }, [p.ownSongs, needle])

  return <>
    <div className="mx-5 mt-4 z-10 relative">
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search your songs"
        aria-label="Search your songs"
        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-oslyn-500 focus:border-oslyn-500 block w-full max-w-md p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
      />
      {needle && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{filtered.length} of {total}</p>}
    </div>
    {needle && filtered.length === 0
      ? <p className="mx-5 mt-6 text-gray-500 dark:text-gray-300">No songs match &ldquo;{query.trim()}&rdquo;</p>
      : p.user && <SongTable user={p.user} songs={filtered} type="own" />}
    <div className="mx-5 z-10 relative">
      <p className="mt-8 mb-1 mx-5 text-xs text-gray-500 font-semibold dark:text-gray-400 uppercase">
        Shared with me:
      </p>
    </div>
    { p.user && <SongTable user={p.user} songs={p.sharedSongs} type="share" /> }
  </>
}
