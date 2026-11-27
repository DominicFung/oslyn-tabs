"use client"

import { ZenObservable } from "zen-observable-ts"

import amplifyconfig from '@/../src/amplifyconfiguration.json'
import { Amplify } from 'aws-amplify'
import { GraphQLResult, generateClient } from 'aws-amplify/api'

import * as s from '@/../src/graphql/subscriptions'
import * as m from '@/../src/graphql/mutations'
import { 
  JamSession, JamSong, Participant, User, 
  JamSessionActiveUsers, NextPageMutation, 
  SetSongKeyMutation, SetJamSlideConfigMutation, 
  RemoveSongFromJamQueueMutation
} from "@/../src/API"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDoubleRightIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/solid'
import Controls from './controls'
import { useSideBarContext } from '../context'

import { default as PSlides } from "./slides"
import { default as SSlides } from '../(slides)/slides'
import { useTheme } from 'next-themes'
import { useSession } from 'next-auth/react'
import SignInAsGuest from './signInAsGuest'
import MissingChords from './missingChords'
import FollowMe from './follow/FollowMe'
import { capoForSong, parseCapoPrefs, withSongCapo, type CapoPrefs } from './capoPrefs'
import { JamSongChange, onJamDeleted, onJamQueueUpdate, onJamSongsChanged, onSetJamsDeleted, onSongRemovedFromJam, setJamQueue } from '@/core/graphql/jam'
import ImportToasts, { ImportEvent } from '../importToasts'
import { deletedToast, songDeletedEventName, SongDeletedEvent } from '../songDeleted'

import toast from 'react-hot-toast'

export interface PlayerProps {
  jam: JamSession, 
  isSlideShow?: boolean
  user: User|null
  canEditSongs?: boolean
  joinToken?: string
}

Amplify.configure(amplifyconfig, { ssr: true })

const nextSongEventId = "next-song"

function orderSongs(prev: JamSong[], songIds: Array<string | null> | null | undefined): JamSong[] {
  const pools = new Map<string, JamSong[]>()
  for (const row of prev) {
    const id = row?.song?.songId
    if (!id) continue
    const list = pools.get(id) || []
    list.push(row)
    pools.set(id, list)
  }
  const next: JamSong[] = []
  for (const id of songIds || []) {
    if (!id) continue
    const row = pools.get(id)?.shift()
    if (row) next.push(row)
  }
  return next
}

function removedToast(title: string, jamId: string, songId: string) {
  toast.success(
    (t: { id: string }) => (
      <span>
        Removed {title} from this jam
        <button type="button" className="ml-3 font-semibold" aria-label="Dismiss" onClick={() => toast.dismiss(t.id)}>×</button>
      </span>
    ),
    { id: `removed-${jamId}-${songId}`, duration: 5000 },
  )
}

export default function Player(p: PlayerProps) {
  const { theme } = useTheme()
  const [ localTheme, setLocalTheme ] = useState("light")
  useEffect(() => {
    if (theme) setLocalTheme(theme)
    else {
      const a = localStorage.getItem('oslynTheme') || "light"
      if (a && a != "false") { setLocalTheme(a) }
    }
  } , [theme])

  const { setOpenSidebar, guestIdentity, addGuestIdentity } = useSideBarContext()
  const { data: session, status } = useSession()
  const router = useRouter()
  const client = generateClient()
  const [jamDeleted, setJamDeleted] = useState(false)
  
  const [ isLogin, setIsLogin ] = useState(false)

  const [ isFullScreenEnabled, setFullScreenEnabled ] = useState(false)
  useEffect(() => { setFullScreenEnabled(document?.fullscreenEnabled || (document as any)?.webkitFullscreenEnabled) }, [])

  // after onload, we need to sync jam manually
  useEffect( () => { 
    if (p.jam.jamSessionId) { 
      setActive(p.jam.active as Participant[])
      const nextSongs = ((p.jam.setList?.songs || []) as JamSong[]).map((row) => {
        const pending = row?.song?.songId ? importedSheets.current[row.song.songId] : ""
        if (!pending || row.song?.chordSheet?.trim()) return row
        return { ...row, song: { ...row.song, chordSheet: pending, chordSheetKey: row.song?.chordSheetKey || "C" } }
      })
      setSongs(nextSongs)
      songsRef.current = nextSongs

      if (nextSongs.length === 0) {
        setSong(0)
        setSKey("C")
        setPage(p.jam.currentPage || 0)
        return
      }

      if (p.jam.currentSong == null || p.jam.currentSong < 0 || p.jam.currentSong >= nextSongs.length) { 
        console.warn(`currentSong not within range of setList: ${p.jam.currentSong}`); return 
      }
      const cp = p.jam.currentSong!
      if (!p.jam || p.jam.currentPage! <= -1) { 
        console.warn(`currentPage not > 1. ${p.jam.currentPage}`); return 
      }
  
      if (!p.jam.setList.songs[cp]) { console.error(`song in setlist at ${cp} not found`); return }
      setSong(cp)
      setSKey(p.jam.setList.songs[cp]!.key)
      setPage(p.jam.currentPage || 0)
      console.log("all set")
    }
  }, [p.jam])

  // these are being SUBSCRIBED to, so needs to be moved out of the main JAM object.
  const [ song, setSong ] = useState(p.jam.currentSong || 0)
  const [ sKey, setSKey ] = useState(p.jam.setList?.songs?.[p.jam.currentSong || 0]?.key || "C")
  const [ page, setPage ] = useState(p.jam.currentPage || 0)
  const [ queue, setQueue ] = useState((p.jam.queue || []))
  const [ queueRevision, setQueueRevision ] = useState((p.jam as { revision?: number | null }).revision ?? 0)
  const queueRef = useRef<Array<number | null>>(p.jam.queue || [])
  const revisionRef = useRef(queueRevision)
  useEffect(() => { queueRef.current = queue }, [queue])
  useEffect(() => { revisionRef.current = queueRevision }, [queueRevision])
  const [ active, setActive ] = useState<Participant[]>([])
  const [ songs, setSongs ] = useState<JamSong[]>((p.jam.setList?.songs || []) as JamSong[])
  const importedSheets = useRef<Record<string, string>>({})
  const songsRef = useRef<JamSong[]>((p.jam.setList?.songs || []) as JamSong[])
  const songRef = useRef(song)
  useEffect(() => { songsRef.current = songs }, [songs])
  useEffect(() => { songRef.current = song }, [song])

  const [ openController, _setOpenController ] = useState(false)
  const [ guestOpen, setGuestOpen ] = useState(false)
  const [ isLastPage, setLastPage ] = useState(false)

  const [transpose, setTranspose] = useState(0)
  const capoPrefsRef = useRef<CapoPrefs>({ default: '0', bySong: {} })
  const currentSongId = songs[song]?.song?.songId
  useEffect(() => {
    const prefs = parseCapoPrefs(localStorage.getItem('jam/capo'))
    capoPrefsRef.current = prefs
    setTranspose(0 - Number(capoForSong(prefs, currentSongId)))
  }, [currentSongId])
  const setCapo = (c: string) => {
    const next = withSongCapo(capoPrefsRef.current, currentSongId, c)
    if (next === capoPrefsRef.current) return
    capoPrefsRef.current = next
    localStorage.setItem('jam/capo', JSON.stringify(next))
    setTranspose(0 - Number(c))
  }

  const [ textSize, setTextSize ] = useState("text-lg")
  useEffect(() => { const a = localStorage.getItem('jam/textSize') || "text-lg"; if (a && a != "false") { setTextSize(a) } }, [])
  useEffect(() => { localStorage.setItem('jam/textSize', textSize) }, [textSize])
  
  const [ complex, setComplex ] = useState(true)
  useEffect(() => { const a = localStorage.getItem('jam/complex') || "true"; if (a) { setComplex(a === "true") } }, [])
  useEffect(() => { localStorage.setItem('jam/complex', JSON.stringify(complex)) }, [complex])

  const [ fullScreen, setFullScreen ] = useState(false)

  const [ headsUp, setHeadsUp ] = useState(false)
  useEffect(() => { const a = localStorage.getItem('jam/headsUp') || "false"; if (a) { setHeadsUp(a === "true") } }, [])
  useEffect(() => { localStorage.setItem('jam/headsUp', JSON.stringify(headsUp)) }, [headsUp])

  const [ slideTextSize, setSlideTextSize ] = useState(p.jam.slideTextSize || "text-3xl")
  useEffect(() => {
    console.log("subscribe text size")
    if (p.jam.jamSessionId && p.isSlideShow) { subscribeTextSize(p.jam.jamSessionId) }
  }, [p.isSlideShow, p.jam.jamSessionId])

  const subscribeTextSize = async (jamSessionId: string): Promise<ZenObservable.Subscription> => {
    const sub = client.graphql({
      query: s.onJamSlideConfigChange,  variables: { jamSessionId }
    }).subscribe({
      next: ({ data }) => {
        const ts = data?.onJamSlideConfigChange?.textSize
        console.log(ts)
        setSlideTextSize(ts || "text-3xl")
      },
      error: (error) => console.error(error)
    })
    console.log(sub)
    return sub
  }

  const [ subs, setSubs ] = useState<{ [key: string]: Promise<ZenObservable.Subscription>|null}>({ nextPage: null, nextSong: null, keyChange: null, userJoin: null })
  useEffect(() => {
    console.log("== sub? ==")
    console.log(subs.userJoin)
    if (p.jam.jamSessionId && !subs.nextPage && !subs.nextSong && !subs.keyChange && !subs.userJoin) { 
      setSubs({
        nextPage: subscribeNextPage(p.jam.jamSessionId),
        nextSong: subscribeNextSong(p.jam.jamSessionId),
        keyChange: subscribeKeyChange(p.jam.jamSessionId),
        userJoin: subscribeUserJoin(p.jam.jamSessionId),
        queueAdd: subscribeToQueueAdd(p.jam.jamSessionId),
        queueRemove: subscribeToQueueRemove(p.jam.jamSessionId),
        songsChanged: subscribeJamSongs(p.jam.jamSessionId),
        queueUpdate: subscribeQueueUpdate(p.jam.jamSessionId),
      })
      console.log("All Subscribed!")
    }
  }, [page, p.jam.jamSessionId, subs])

  const subscribeNextPage = async (jamSessionId: string): Promise<ZenObservable.Subscription> => {
    const sub = client.graphql({
      query: s.onNextPage, variables: { jamSessionId } 
    }).subscribe({
      next: ({ data }) => {
        console.log("=== On NextPage Change ===")
        const page = data?.onNextPage?.page
        setPage(page||0)
      },
      error: (error) => console.error(error)
    })
    console.log(sub)
    return sub
  }

  //useEffect(() => { if (songs[song]) setSKey(songs[song].key) }, [songs, song])
  const subscribeNextSong = async (jamSessionId: string): Promise<ZenObservable.Subscription> => {
    const sub = client.graphql({
      query: s.onNextSong, variables: { jamSessionId } 
    }).subscribe({
      next: ({ data }) => {
        console.log("=== On NextSong Change ===")
        const song = data?.onNextSong?.song
        const page = data?.onNextSong?.page
        const key = data?.onNextSong?.key
        const queue = data?.onNextSong?.queue || []

        if (!song) { console.log(`No song index value found, this can be OK. ${song}`) }
        if (!page) { console.log(`No page value found, this can be OK. ${page}`) }

        // needs to be fixed to add key!
        setSong(song||0); setPage(page||0); setKey(key||"C")
        console.log(`song: ${song} queue: ${queue}`)
        setQueue(queue)
      },
      error: (error) => console.error(error)
    })
    console.log(sub)
    return sub
  }

  const subscribeKeyChange = async (jamSessionId: string): Promise<ZenObservable.Subscription> => {
    const sub = client.graphql({
      query: s.onSongKey, variables: { jamSessionId }
    }).subscribe({
      next: ({ data }) => {
        console.log("=== On Key Change ===")
        console.log(JSON.stringify(data))

        const song = data?.onSongKey?.song
        const key = data?.onSongKey?.key

        if (!song) { console.log(`No song index value found, this can be OK. ${song}`) }
        if (!key) { console.log(`No page value found, this can be OK. ${page}`) }

        // its possible for song to not equal the current song ..
        // however, we cannot access the STATE of song here .. so theres no way to know ..
        setSKey(key || "C") 
      },
      error: (error) => console.error(error)
    })
    console.log(sub)
    return sub
  }

  const subscribeToQueueAdd = async (jamSessionId: string): Promise<ZenObservable.Subscription> => {
    const sub = client.graphql({
      query: s.onAddSongToJamQueue, variables: { jamSessionId }
    }).subscribe({
      next: ({ data }) => {
        console.log("=== On Key Change ===")
        console.log(JSON.stringify(data))
        setQueue(data.onAddSongToJamQueue?.queue || [])
      },
      error: (error) => console.error(error)
    })
    console.log(sub)
    return sub
  }

  const sheetFor = (songId: string | undefined, incoming?: string | null, current?: string | null) => {
    const pending = songId ? importedSheets.current[songId] : ""
    return incoming?.trim() || pending || current || ""
  }

  const applySongChange = (change?: JamSongChange | null) => {
    if (!change?.song?.songId || change.index == null) return
    const chordSheet = sheetFor(change.song.songId, change.song.chordSheet)
    const entry = {
      __typename: "JamSong",
      key: change.key || "C",
      song: { ...change.song, chordSheet: chordSheet || change.song.chordSheet } as JamSong["song"],
      order: change.index,
    } as JamSong
    setSongs((prev) => {
      const existing = prev.findIndex((row) => row?.song?.songId === change.song.songId)
      if (existing >= 0) {
        const copy = [...prev]
        const current = copy[existing]
        copy[existing] = {
          ...current,
          song: {
            ...current.song,
            ...change.song,
            chordSheet: sheetFor(change.song.songId, change.song.chordSheet, current.song.chordSheet),
            chordSheetKey: change.song.chordSheetKey || current.song.chordSheetKey,
          },
        }
        return copy
      }
      if (change.index === prev.length) return [...prev, entry]
      if (change.index < prev.length) {
        const copy = [...prev]
        copy[change.index] = entry
        return copy
      }
      return [...prev, entry]
    })
    if (change.jumpTo) {
      setSong(change.index)
      setSKey(change.key || "C")
      setPage(0)
    }
  }

  const applyQueueUpdate = (payload?: { queue?: Array<number | null> | null, revision?: number | null, currentSongIndex?: number | null } | null) => {
    if (!payload) return
    if (payload.queue) {
      setQueue(payload.queue)
      queueRef.current = payload.queue
    }
    if (typeof payload.revision === 'number') {
      setQueueRevision(payload.revision)
      revisionRef.current = payload.revision
    }
    if (typeof payload.currentSongIndex === 'number') setSong(payload.currentSongIndex)
  }

  const applyPlaylist = (update: { songId?: string, title?: string, currentSong?: number | null, queue?: Array<number | null> | null, songIds?: Array<string | null> | null }, toastTitle?: string) => {
    const currentSong = typeof update.currentSong === 'number' ? update.currentSong : 0
    const queue = (update.queue || []).map((n) => Number(n)).filter((n) => Number.isFinite(n))
    const playingId = songsRef.current[songRef.current]?.song?.songId
    const next = orderSongs(songsRef.current, update.songIds)
    songsRef.current = next
    setSongs(next)
    setSong(currentSong)
    songRef.current = currentSong
    setQueue(queue)
    queueRef.current = queue
    const nowPlaying = next[currentSong]?.song?.songId
    if (playingId && nowPlaying !== playingId) setPage(0)
    if (next[currentSong]?.key) setSKey(next[currentSong].key)
    if (toastTitle && update.songId) removedToast(toastTitle, p.jam.jamSessionId, update.songId)
  }

  const applyPlaylistRef = useRef(applyPlaylist)
  applyPlaylistRef.current = applyPlaylist

  useEffect(() => {
    const jamId = p.jam.jamSessionId
    if (!jamId) return
    const observable = client.graphql({
      query: onSongRemovedFromJam,
      variables: { jamSessionId: jamId },
    }) as {
      subscribe: (observer: {
        next: (value: { data?: { onSongRemovedFromJam?: { songId: string, title: string, currentSong: number, queue: Array<number | null>, songIds: Array<string | null> } | null } }) => void
        error: (error: unknown) => void
      }) => { unsubscribe: () => void }
    }
    const sub = observable.subscribe({
      next: ({ data }) => {
        const event = data?.onSongRemovedFromJam
        if (!event?.songId) return
        applyPlaylistRef.current(event, event.title || "Song")
      },
      error: (error) => console.error(error),
    })
    const onDeleted = (event: Event) => {
      const detail = (event as CustomEvent<SongDeletedEvent>).detail
      const mine = detail?.jams?.find((jam) => jam.jamSessionId === jamId)
      if (!detail?.songId || !mine) return
      applyPlaylistRef.current(mine)
      if (detail.userId !== p.user?.userId) deletedToast(detail.title || "Song", detail.songId)
    }
    window.addEventListener(songDeletedEventName, onDeleted)
    return () => {
      sub.unsubscribe()
      window.removeEventListener(songDeletedEventName, onDeleted)
    }
  }, [p.jam.jamSessionId, p.user?.userId])

  useEffect(() => {
    const jamId = p.jam.jamSessionId
    if (!jamId) return
    const direct = client.graphql({
      query: onJamDeleted,
      variables: { jamSessionId: jamId },
    }) as {
      subscribe: (observer: {
        next: (value: { data?: { onJamDeleted?: { jamSessionId?: string | null } | null } }) => void
        error: (error: unknown) => void
      }) => { unsubscribe: () => void }
    }
    const cascaded = client.graphql({ query: onSetJamsDeleted }) as {
      subscribe: (observer: {
        next: (value: { data?: { onSetJamsDeleted?: { jamSessionIds?: Array<string | null> | null } | null } }) => void
        error: (error: unknown) => void
      }) => { unsubscribe: () => void }
    }
    const directSub = direct.subscribe({
      next: ({ data }) => { if (data?.onJamDeleted?.jamSessionId === jamId) setJamDeleted(true) },
      error: (error) => console.error(error),
    })
    const cascadeSub = cascaded.subscribe({
      next: ({ data }) => {
        const ids = data?.onSetJamsDeleted?.jamSessionIds || []
        if (ids.includes(jamId)) setJamDeleted(true)
      },
      error: (error) => console.error(error),
    })
    return () => {
      directSub.unsubscribe()
      cascadeSub.unsubscribe()
    }
  }, [p.jam.jamSessionId])

  const applyImportedChords = (event: ImportEvent) => {
    if (event.status !== "DONE" || !event.songId || !event.chordSheet?.trim()) return
    const songId = event.songId
    const chordSheet = event.chordSheet
    importedSheets.current[songId] = chordSheet
    setSongs((prev) => prev.map((row) => row?.song?.songId === songId
      ? { ...row, song: { ...row.song, chordSheet, chordSheetKey: row.song.chordSheetKey || "C" } }
      : row))
  }

  const subscribeQueueUpdate = async (jamSessionId: string): Promise<ZenObservable.Subscription> => {
    const observable = client.graphql({
      query: onJamQueueUpdate, variables: { jamSessionId }
    }) as {
      subscribe: (observer: {
        next: (value: { data?: { onJamQueueUpdate?: { queue?: Array<number | null> | null, revision?: number | null, currentSongIndex?: number | null } } }) => void
        error: (error: unknown) => void
      }) => ZenObservable.Subscription
    }
    return observable.subscribe({
      next: ({ data }) => applyQueueUpdate(data?.onJamQueueUpdate),
      error: (error) => console.error(error)
    })
  }

  const subscribeJamSongs = async (jamSessionId: string): Promise<ZenObservable.Subscription> => {
    const observable = client.graphql({
      query: onJamSongsChanged, variables: { jamSessionId }
    }) as {
      subscribe: (observer: {
        next: (value: { data?: { onJamSongsChanged?: JamSongChange } }) => void
        error: (error: unknown) => void
      }) => ZenObservable.Subscription
    }
    return observable.subscribe({
      next: ({ data }) => {
        applySongChange(data?.onJamSongsChanged)
      },
      error: (error) => console.error(error)
    })
  }

  const subscribeToQueueRemove = async (jamSessionId: string): Promise<ZenObservable.Subscription> => {
    const sub = client.graphql({
      query: s.onRemoveSongFromJamQueue, variables: { jamSessionId }
    }).subscribe({
      next: ({ data }) => {
        console.log("=== On Key Change ===")
        console.log(JSON.stringify(data))
        setQueue(data.onRemoveSongFromJamQueue?.queue || [])
      },
      error: (error) => console.error(error)
    })
    console.log(sub)
    return sub
  }

  const subscribeUserJoin = async (jamSessionId: string): Promise<ZenObservable.Subscription> => {
    console.log(`= ${jamSessionId}`)

    const sub = client.graphql({
      query: s.onEnterJam, variables: { jamSessionId: jamSessionId }
    }).subscribe({
      next: ({ data }) => {
        console.log("=== On User Join ===")
        console.log(JSON.stringify(data))

        const active = data?.onEnterJam?.active as Participant[]
        const latest = data?.onEnterJam?.latest

        if (!active) { console.log(`subscribeUserJoin: No active value found, this can be OK. ${active}`) }
        if (!latest) { console.log(`subscribeUserJoin: No latest value found, this can be OK. ${latest}`) }

        setActive([...active])

        let username = latest?.username || latest?.user?.username
        toast(`Welcome ${username}!`)
      },
      error: (error) => console.error(`=== ${JSON.stringify(error)}`)
    })
    console.log(sub)
    return sub
  }

  useEffect(() => { // when key or song index changes, we need to update songs
    let sgs = [...songs] as JamSong[]
    console.log(sgs)

    if (sgs[song || 0]) { 
      sgs[song || 0].key = sKey || "C"
      setSongs(sgs)
    }
  }, [sKey, song])
  
  const setNextPage = async (page: number) => {
    const d = await client.graphql({
      query: m.nextPage, variables: {
      jamSessionId: p.jam.jamSessionId, page
    }}) as GraphQLResult<NextPageMutation>
    console.log(d)
  }

  const setNextSong = async (song: number|null) => {
    if (song === null) {
      const d = await client.graphql({
        query: m.nextSong, variables: {
        jamSessionId: p.jam.jamSessionId
      }}) as GraphQLResult<NextPageMutation>
      console.log(d)
    } else if (songs.length > song) {
      const d = await client.graphql({
        query: m.nextSong, variables: {
        jamSessionId: p.jam.jamSessionId, song
      }}) as GraphQLResult<NextPageMutation>
      console.log(d)
    } else { console.error(`Error: next song index "${song}" is greater than setlist.length "${songs.length}"`) }
  }


  const setKey = async (key: string) => {
    console.error(`setKey Fired ${key}`)
    const d = await client.graphql({ query: m.setSongKey, variables: {
      jamSessionId: p.jam.jamSessionId, song, key
    }}) as GraphQLResult<SetSongKeyMutation>
    console.log(d)
  }

  const appendToQueue = async (index: number) => {
    const base = (queueRef.current || []).filter((n): n is number => typeof n === 'number' && n >= 0)
    const next = [...base, index]
    const d = await client.graphql({
      query: setJamQueue, variables: {
        jamSessionId: p.jam.jamSessionId,
        queue: next,
        expectedRevision: revisionRef.current,
      }
    }) as GraphQLResult<{ setJamQueue?: { queue?: Array<number | null> | null, revision?: number | null, currentSongIndex?: number | null } | null }>
    applyQueueUpdate(d.data?.setJamQueue)
    console.log(d)
  }

  const addSongToJamQueue = async (songId: string) => {
    let index = 0
    let found = false
    for (index = 0; index < songs.length; index++) {
      if (songs[index].song.songId === songId) { found = true; break }
    }
    if (!found) { console.error(`song ${songId} not found.`); return }
    console.log(`song found: ${songId}, index: ${index}, title: ${songs[index].song.title}`)
    await appendToQueue(index)
  }

  const queueAt = async (index: number) => {
    await appendToQueue(index)
  }

  const removeSongFromJamQueue = async (index: number) => {
    let queue = p.jam.queue || []
    if (index < 0 || index >= queue.length) return

    const d = await client.graphql({
      query: m.removeSongFromJamQueue, variables: {
      jamSessionId: p.jam.jamSessionId, queueIndex: index
    }}) as GraphQLResult<RemoveSongFromJamQueueMutation>
    console.log(d)
  }

  const setJamConfig = async (textSize: string) => {
    const d = await client.graphql({ query: m.setJamSlideConfig, variables: {
      jamSessionId: p.jam.jamSessionId, textSize
    }}) as GraphQLResult<SetJamSlideConfigMutation>
    console.log(d)
  }

  const openFullScreen = () => {
    let el = document.getElementById("player") as any

    if (el.requestFullscreen) {
      el.requestFullscreen();
    } else if (el.webkitRequestFullscreen) { /* Safari */
      el.webkitRequestFullscreen();
    } else if (el.mozRequestFullScreen) {
      el.mozRequestFullScreen();
    } else if (el.msRequestFullscreen) { /* IE11 */
      el.msRequestFullscreen();
    } else {
      console.log("could not open full screen ...")
    }
    setOpenSidebar(false)
  }

  const closeFullScreen = () => {
    try {
      if (document.fullscreenElement != null) // document not active issue
        if (document.exitFullscreen) {
          document.exitFullscreen()
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen()
        } else if ((document as any).mozCancelFullScreen) {
          (document as any).mozCancelFullScreen()
        } else if ((document as any).msExitFullscreen) {
          (document as any).msExitFullscreen()
        }
    } catch (e) { console.warn("unalbe to exit full screen.") }
  }

  useEffect(() => {
    if (fullScreen) openFullScreen()
    else closeFullScreen()
  }, [fullScreen])

  const signInAsUser = async (u: User) => {
    console.log("sign in as user ..")
    try {
      const data = await (await fetch(`/api/jam/${p.jam.jamSessionId}/add/user`, {
        method: "POST", body: JSON.stringify({ userId: u.userId, joinToken: p.joinToken })
      })).json() as JamSessionActiveUsers

      if (typeof data === "string") { return data }
      console.log(data)
      setIsLogin(true)
    } catch (e) { return JSON.stringify(e) }
    return ""
  }

  const signInAsGuest = async (name: string, colour: string): Promise<string> => {
    try {
      const data = await (await fetch(`/api/jam/${p.jam.jamSessionId}/add/guest`, {
        method: "POST", body: JSON.stringify({ name, colour, joinToken: p.joinToken })
      })).json() as JamSessionActiveUsers  
      
      if (typeof data === "string") { return data }
      console.log(data)

      if (data.jamSessionId && data.latest?.userId) {
        addGuestIdentity(data.jamSessionId, data.latest.userId)
      }

      setGuestOpen(false)
      setIsLogin(true)
    } catch (e) { return JSON.stringify(e) }
    return ""
  }

  useEffect(() => {
    console.log(guestIdentity)
    const guestIds = active.map((j) => j?.userId)
    if (!isLogin) {
      if (session && status === "authenticated" && p.user) {
        console.log(`User is authenticated .. ${p.user.userId}`)
        console.log(guestIds)
        if (!guestIds.includes(p.user.userId)) { signInAsUser(p.user) }
        else setIsLogin(true)
      } else if (status === "unauthenticated") {
        if (guestIdentity[p.jam.jamSessionId]) {
          const guestId = guestIdentity[p.jam.jamSessionId]
          if (guestIds.includes(guestId)) { setGuestOpen(false) }
          else setGuestOpen(true)
        } else setGuestOpen(true)
      }
    }
  }, [session, status, guestIdentity, p.jam, active, isLogin])

  const onFullScreenChange = (event: any) => { 
    if (document.fullscreenElement) setFullScreen(true)
    else setFullScreen(false)
  }
  useEffect(() => {
    addEventListener("fullscreenchange", onFullScreenChange)
    return () => { removeEventListener("fullscreenchange", onFullScreenChange) }
  }, [])

  const keydown = (event: KeyboardEvent) => {
    console.log(`event.code ${event.code}`)
    if (event.code === "ArrowRight") {
      if (!p.isSlideShow && isLastPage && songs.length > song+1) {
        setNextSong(song+1)
        return
      } else console.log(`cannot turn to go to next song using ${event.code}`)
    }
  }

  useEffect(() => {
    if (songs && !openController) window.addEventListener('keydown', keydown)
    return () => window.removeEventListener('keydown', keydown)
  }, [p.isSlideShow, isLastPage, songs, song, openController])

  const setOpenController = (b: boolean) => {
    if (b) { window.removeEventListener('keydown', keydown) }
    else { window.addEventListener('keydown', keydown) }
    _setOpenController(b)
  }

  useEffect(() => {
    const current = songs[song]
    if (current?.song?.songId) {
      const sid = current.song.songId
      console.log(`setSong: ${current.song.title} ${sid}`)
      document.body.dispatchEvent(
        new CustomEvent(nextSongEventId, { 
          detail: { songId: sid } 
        })
      )
    }
  } , [songs, song])

  return <div className={`text-white w-full h-screen flex flex-col overflow-hidden ${localTheme || "light"}`} id="player">
    {songs.length === 0 && <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <p className="text-2xl font-semibold text-gray-900 dark:text-white">Search for a song to start</p>
      {!p.isSlideShow && p.canEditSongs && <button type="button" onClick={() => setOpenController(true)}
        className="mt-6 text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5">
        Search for a song
      </button>}
    </div>}
    {songs[song]?.song && !songs[song].song.chordSheet?.trim() && <MissingChords
      songId={songs[song].song.songId}
      jamSessionId={p.jam.jamSessionId}
      title={songs[song].song.title}
      artist={songs[song].song.artist}
      userId={p.user?.userId}
      canImport={!!p.canEditSongs && !p.isSlideShow}
    />}
    { songs[song]?.song?.chordSheet?.trim() && 
      (p.isSlideShow ? 
        <SSlides
          song={songs[song].song} page={page} 
          setPage={setNextPage} setLastPage={setLastPage}
          textSize={slideTextSize || "text-3xl"}
        />:
        <PSlides jamId={p.jam.jamSessionId} isControllerOpen={openController}
          userId={p.user?.userId || guestIdentity[p.jam.jamSessionId] || ""}
          song={songs[song]!.song} skey={sKey} page={page} 
          setPage={setNextPage} setLastPage={setLastPage} transpose={transpose} 
          textSize={textSize} complex={complex} headsUp={headsUp}
        />)
    }
    { !p.isSlideShow && isLastPage && (songs.length > song+1 || queue.length>0 ) && <button onClick={() => setNextSong(null)}
        className='fixed bottom-4 right-10 bg-oslyn-600 dark:bg-gray-700 rounded-full p-4 drop-shadow-lg flex justify-center items-center text-4xl hover:bg-coral-300'
      >
        <ChevronDoubleRightIcon className="w-6 h-6 text-white" />
    </button> }
    { !p.isSlideShow && songs[song]?.song?.chordSheet?.trim() && <FollowMe
      chordSheet={songs[song]!.song!.chordSheet || ''}
      chartKey={songs[song]!.song!.chordSheetKey || sKey || 'C'}
      songKey={sKey || songs[song]!.song!.chordSheetKey || 'C'}
      songId={songs[song]!.song!.songId || 'unknown'}
      title={songs[song]!.song!.title || ''}
      capo={-transpose}
      page={page}
      onPage={setNextPage}
    />}
    { songs && !p.isSlideShow &&
      <Controls 
        open={openController}
        setOpen={setOpenController}
        jamSessionId={p.jam.jamSessionId}
        capo={{ capo:`${0-transpose}`, setCapo }} 
        song={{ song, setSong: setNextSong, addToQueue: addSongToJamQueue, songs: songs as JamSong[], canAddSongs: p.canEditSongs, onSongAdded: applySongChange, onSongRemoved: (update) => applyPlaylist(update, update.title), queueAt }} 
        sKey={{ skey: sKey, setKey }}
        display={{ textSize, setTextSize, 
          auto: false, setAuto: () => {}, 
          complex, setComplex,
          fullScreen, setFullScreen,
          headsUp, setHeadsUp
        }}
        slides={{
          textSize: slideTextSize,
          setTextSize: setJamConfig
        }}
        users={{
          active: active as Participant[],
          removeActive: () => {}
        }}
        qrCode={true}
        joinToken={p.joinToken}
        canShareJam={!!p.canEditSongs}
        canDeleteJam={!!p.user?.userId && p.user.userId === (p.jam as { hostId?: string | null }).hostId}
        onJamDeleted={() => setJamDeleted(true)}
        queue={{
          songs: songs as JamSong[],
          queueOrder: queue,
          removeFromQueue: removeSongFromJamQueue
        }}
      /> 
    }
    { isFullScreenEnabled && p.isSlideShow && !fullScreen && <button onClick={() => setFullScreen(true)}
      className={`fixed z-90 right-10 top-4 bg-coral-400 w-12 h-12 rounded-lg p-2 drop-shadow-lg flex justify-center items-center text-4xl hover:bg-coral-300 hover:drop-shadow-2xl`}
    >
      <ArrowsPointingOutIcon className="w-8 h-8 text-oslyn-800 hover:text-oslyn-900" />
    </button>}

    <SignInAsGuest open={guestOpen} setOpen={setGuestOpen} jamId={p.jam.jamSessionId} signInAsGuest={signInAsGuest} />
    {jamDeleted && <div role="dialog" aria-modal="true" aria-labelledby="jam-deleted-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/80 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 text-center shadow dark:bg-gray-800">
        <h2 id="jam-deleted-title" className="text-xl font-semibold text-gray-900 dark:text-white">This jam was deleted</h2>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">The host removed this room. It is no longer available.</p>
        <button type="button" onClick={() => router.push("/")}
          className="mt-6 rounded-lg bg-oslyn-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-oslyn-800">
          OK
        </button>
      </div>
    </div>}
    <ImportToasts
      jamId={p.jam.jamSessionId}
      userId={p.user?.userId}
      onImported={applyImportedChords}
      onPaste={() => setOpenController(true)}
    />
  </div>
}