"use client"

import { useEffect, useState } from "react"
import { MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/solid"
import { JamSong } from "@/../src/API"
import { JamSongChange } from "@/core/graphql/jam"
import PasteChordSheet, { ChordSiteLinks } from "./pasteChordSheet"

interface LibrarySong {
  songId: string
  title: string
  artist?: string | null
  album?: string | null
  albumCover?: string | null
  chordSheetKey?: string | null
}

interface SpotifyTrack {
  spotifyId: string
  title: string
  artist?: string | null
  album?: string | null
  albumCover?: string | null
}

const FEW_LIBRARY_MATCHES = 3

interface SongProps {
  jamSessionId: string
  song: number
  setSong: (n: number) => void
  addToQueue?: (songId: string) => void
  songs: JamSong[]
  canAddSongs?: boolean
  onSongAdded?: (change: JamSongChange) => void
  onSongRemoved?: (update: { title: string, songId: string, currentSong: number, queue: Array<number | null>, songIds: Array<string | null> }) => void
  queueAt?: (index: number) => void
}

type SetRow = { song: JamSong, setIndex: number }

export default function SongControl(p: SongProps) {
  const [search, setSearch] = useState("")
  const [filteredList, setFilteredList] = useState<SetRow[]>([])
  const [library, setLibrary] = useState<LibrarySong[]>([])
  const [libraryState, setLibraryState] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [spotify, setSpotify] = useState<SpotifyTrack[]>([])
  const [spotifyState, setSpotifyState] = useState<"idle" | "loading" | "done" | "hidden">("idle")
  const [busy, setBusy] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    const words = search.toLowerCase().trim().split(/[\s,]+/).filter((word) => word.length > 0)
    const rows = p.songs.map((song, setIndex) => ({ song, setIndex }))
    if (words.length === 0) {
      setFilteredList(rows)
      return
    }
    setFilteredList(rows.filter(({ song }) => {
      const title = song.song?.title?.toLowerCase().trim() || ""
      const artist = song.song?.artist?.toLowerCase().trim() || ""
      return words.some((word) => title.includes(word) || artist.includes(word))
    }))
  }, [search, p.songs])

  useEffect(() => {
    if (!p.canAddSongs) {
      setLibrary([])
      setLibraryState("idle")
      return
    }
    const query = search.trim()
    if (query.length < 2) {
      setLibrary([])
      setLibraryState("idle")
      return
    }
    setLibraryState("loading")
    const handle = setTimeout(async () => {
      try {
        const res = await fetch("/api/song/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || "search failed")
        setLibrary(Array.isArray(data?.songs) ? data.songs : [])
        setLibraryState("done")
      } catch {
        setLibrary([])
        setLibraryState("error")
      }
    }, 300)
    return () => clearTimeout(handle)
  }, [search, p.canAddSongs])

  useEffect(() => {
    if (!p.canAddSongs) {
      setSpotify([])
      setSpotifyState("idle")
      return
    }
    const term = search.trim()
    if (term.length < 2) {
      setSpotify([])
      setSpotifyState("idle")
      return
    }
    if (libraryState === "loading" || libraryState === "idle") return
    if (libraryState === "done" && library.length >= FEW_LIBRARY_MATCHES) {
      setSpotify([])
      setSpotifyState("idle")
      return
    }
    setSpotifyState("loading")
    const handle = setTimeout(async () => {
      try {
        const res = await fetch("/api/spotify/tracks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ term, limit: 5 }),
        })
        const data = await res.json()
        if (!res.ok || data?.error) {
          setSpotify([])
          setSpotifyState("hidden")
          return
        }
        setSpotify(Array.isArray(data?.tracks) ? data.tracks : [])
        setSpotifyState("done")
      } catch {
        setSpotify([])
        setSpotifyState("hidden")
      }
    }, 300)
    return () => clearTimeout(handle)
  }, [search, p.canAddSongs, libraryState, library.length])

  const addSpotifyTrack = async (track: SpotifyTrack) => {
    setBusy(`spotify:${track.spotifyId}`)
    setError("")
    try {
      const res = await fetch(`/api/jam/${p.jamSessionId}/spotify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(track),
      })
      const data = await res.json()
      if (!res.ok || data?.index == null) {
        setError(data?.error || "Could not add that song")
        return
      }
      p.onSongAdded?.(data)
      setSearch("")
    } catch {
      setError("Could not add that song")
    } finally {
      setBusy("")
    }
  }

  const removeFromJam = async (row: SetRow) => {
    const songId = row.song.song?.songId
    if (!songId || busy) return
    setBusy(`remove:${songId}`)
    setError("")
    try {
      const res = await fetch(`/api/jam/${p.jamSessionId}/song/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId, index: row.setIndex }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Could not remove that song")
      p.onSongRemoved?.(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not remove that song")
    } finally {
      setBusy("")
    }
  }

  const addLibrarySong = async (hit: LibrarySong, jumpTo: boolean) => {
    const existing = p.songs.findIndex((row) => row.song?.songId === hit.songId)
    if (existing >= 0) {
      if (jumpTo) p.setSong(existing)
      else p.addToQueue?.(hit.songId)
      return
    }
    const key = hit.chordSheetKey || "C"
    setBusy(`${hit.songId}:${jumpTo ? "play" : "queue"}`)
    setError("")
    try {
      const res = await fetch(`/api/jam/${p.jamSessionId}/song`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId: hit.songId, key, jumpTo }),
      })
      const data = await res.json()
      if (!res.ok || data?.index == null) {
        setError(data?.error || "Could not add that song")
        return
      }
      p.onSongAdded?.(data)
      if (!jumpTo) await p.queueAt?.(data.index)
      setSearch("")
    } catch {
      setError("Could not add that song")
    } finally {
      setBusy("")
    }
  }

  const nothingInJam = search.trim().length >= 2 && filteredList.length === 0
  const nothingInLibrary = p.canAddSongs && libraryState === "done" && library.length === 0
  const showMiss = nothingInJam && (!p.canAddSongs || nothingInLibrary || libraryState === "error")

  return <div className="ml-3 text-sm font-normal w-full">
    <div className="pb-2 text-xl font-semibold text-gray-900 dark:text-white">Song</div>
    <div className="pb-3 text-sm font-normal">Choose a new Song! <br /><span className="text-xs italic">Note: this affects everyone in the session.</span></div>

    <div className="w-full flex mb-6 pl-6">
      <input type="text" name="search" id="search" value={search} onChange={(e) => { setSearch(e.currentTarget.value) }}
        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white" placeholder="Holy Forever ..."
        required />
      <button type="button" className="sm:flex flex-row text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-4 py-2.5 text-center mx-2 hidden">
        <MagnifyingGlassIcon className="w-4 h-4 mt-1" />
      </button>
    </div>

    <div className="max-h-[calc(100vh-14rem)] overflow-auto w-full">
      {filteredList.length === 0 && search.trim() === "" && <p className="px-4 text-gray-500 dark:text-gray-300">Search for a song to start</p>}
      <ul className="divide-y divide-gray-200 dark:divide-gray-700 w-full">
        {filteredList.map((row) =>
          <li className="py-3 px-4 my-0.5 sm:pb-4 hover:cursor-pointer hover:bg-oslyn-50 dark:hover:bg-oslyn-800" key={`${row.setIndex}-${row.song.song?.songId}`}>
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0" onClick={() => p.setSong(row.setIndex)}>
                {row.song.song?.albumCover && <img className="w-8 h-8 rounded-full" src={row.song.song.albumCover} alt="" />}
              </div>
              <div className="flex-1 min-w-0" onClick={() => p.setSong(row.setIndex)}>
                <p className="text-sm font-medium text-gray-900 truncate dark:text-white">{row.song.song?.title}</p>
                <p className="text-sm text-gray-500 truncate dark:text-gray-400">{row.song.song?.artist} | {row.song.song?.album}</p>
              </div>
              <div className="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white mr-2" onClick={() => p.setSong(row.setIndex)}>
                {row.song.key}
              </div>
              {p.canAddSongs && row.song.song?.songId ? <button type="button" disabled={!!busy}
                onClick={() => removeFromJam(row)}
                className="text-red-700 border border-red-700 rounded-lg text-xs px-3 py-2 disabled:opacity-60">
                {busy === `remove:${row.song.song.songId}` ? "Removing…" : "Remove from this jam"}
              </button> : null}
              {p.addToQueue && row.song.song?.songId ? <div className="flex-0 min-w-0">
                <button type="button" onClick={() => { const id = row.song.song?.songId; if (id) p.addToQueue!(id) }} className="sm:flex flex-row text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-4 py-2.5 text-center mx-2 hidden">
                  <PlusIcon className="w-4 h-4 mt-1" />
                </button>
              </div> : null}
            </div>
          </li>
        )}
      </ul>

      {p.canAddSongs && search.trim().length >= 2 && <div className="mt-4">
        <div className="px-4 pb-2 text-xs uppercase tracking-wide text-gray-500">Your songs</div>
        {libraryState === "loading" && <p className="px-4 text-gray-500">Searching…</p>}
        {libraryState === "error" && <p className="px-4 text-red-600">Search failed. You can still paste a chart below.</p>}
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {library.map((hit) => {
            const inJam = p.songs.some((row) => row.song?.songId === hit.songId)
            return <li key={hit.songId} className="py-3 px-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate dark:text-white">{hit.title}</p>
                  <p className="text-sm text-gray-500 truncate dark:text-gray-400">{hit.artist || "Unknown artist"}{inJam ? " · In this jam" : ""}</p>
                </div>
                <button type="button" disabled={!!busy} onClick={() => addLibrarySong(hit, true)}
                  className="text-white bg-oslyn-700 hover:bg-oslyn-800 rounded-lg text-xs px-3 py-2 disabled:opacity-60">
                  {busy === `${hit.songId}:play` ? "Adding…" : "Play"}
                </button>
                <button type="button" disabled={!!busy} onClick={() => addLibrarySong(hit, false)}
                  className="text-oslyn-700 border border-oslyn-700 rounded-lg text-xs px-3 py-2 disabled:opacity-60">
                  {busy === `${hit.songId}:queue` ? "Adding…" : "Queue"}
                </button>
              </div>
            </li>
          })}
        </ul>
      </div>}

      {p.canAddSongs && spotifyState !== "idle" && spotifyState !== "hidden" && <div className="mt-4">
        <div className="px-4 pb-2 text-xs uppercase tracking-wide text-gray-500">Spotify</div>
        {spotifyState === "loading" && <p className="px-4 text-gray-500">Searching Spotify…</p>}
        {spotifyState === "done" && spotify.length === 0 && <p className="px-4 text-gray-500">No Spotify matches.</p>}
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {spotify.map((track) => <li key={track.spotifyId} className="py-3 px-4">
            <button type="button" disabled={!!busy} onClick={() => addSpotifyTrack(track)}
              className="flex w-full items-center gap-3 text-left disabled:opacity-60">
              {track.albumCover && <img className="w-10 h-10 rounded" src={track.albumCover} alt="" />}
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-gray-900 truncate dark:text-white">{track.title}</span>
                <span className="block text-sm text-gray-500 truncate dark:text-gray-400">{track.artist || "Unknown artist"}{track.album ? ` · ${track.album}` : ""}</span>
              </span>
              <span className="text-xs text-oslyn-700">{busy === `spotify:${track.spotifyId}` ? "Adding…" : "Add"}</span>
            </button>
          </li>)}
        </ul>
      </div>}

      {error && <p className="px-4 mt-3 text-sm text-red-600">{error}</p>}

      {showMiss && <div className="px-4 mt-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">No songs matched &ldquo;{search.trim()}&rdquo;.</p>
        {p.canAddSongs && <>
          <ChordSiteLinks query={search} />
          <PasteChordSheet jamSessionId={p.jamSessionId} onAdded={(change) => { p.onSongAdded?.(change); setSearch("") }} />
        </>}
      </div>}
    </div>
  </div>
}
