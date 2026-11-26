import ZenObservable from "zen-observable-ts"

import React, { useEffect, useRef, useState } from 'react'
import { Text, View } from 'react-native'

import { default as PlayerSlides } from "./slides"

import AsyncStorage from '@react-native-async-storage/async-storage'

import { Amplify } from 'aws-amplify'
import { GraphQLResult, generateClient } from 'aws-amplify/api'

import * as s from '../../src/graphql/subscriptions'
import * as m from '../../src/graphql/mutations'
import { 
  JamSession, JamSong, Participant, User, NextPageMutation, 
  SetSongKeyMutation, SetJamSlideConfigMutation, 
  RemoveSongFromJamQueueMutation
} from "@/src/API"

import amplifyconfig from '../../src/amplifyconfiguration.json'
import Controls from "./controls"
import { useSession } from '../../src/session'
import * as docs from '../../src/graphql/documents'
import { appendQueue, JamSongChange, mergeSongChange, orderSongs, PlaylistUpdate, withImportedSheet } from '../../src/jamPlaylist'
Amplify.configure(amplifyconfig)

export interface PlayerProps {
  jam: JamSession, 
  isSlideShow?: boolean
  user: User|null
  resetJam: () => void

  openController: boolean
  setOpenController: (b: boolean) => void
}

export default function Player(p: PlayerProps){
  const client = generateClient()
  const { account } = useSession()
  const live = p.jam as JamSession & { hostId?: string | null, canEditSongs?: boolean | null, revision?: number | null }
  const canEdit = !!live.canEditSongs && !!account?.userId

  // after onload, we need to sync jam manually
  useEffect( () => { 
    if (p.jam.jamSessionId) { 
      setActive(p.jam.active as Participant[])
      setSongs(p.jam.setList.songs as JamSong[])

      if (!p.jam || p.jam.currentSong! <= -1 || p.jam.currentSong! >= p.jam.setList.songs.length) { 
        console.warn(`currentSong not within range of setList: ${p.jam.currentPage}`); return 
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
  const [ sKey, setSKey ] = useState(p.jam.setList.songs[p.jam.currentSong || 0]?.key || "C")
  const [ page, setPage ] = useState(p.jam.currentPage || 0)
  const [ queue, setQueue ] = useState((p.jam.queue || []))
  const [ active, setActive ] = useState<Participant[]>([])
  const [ songs, setSongs ] = useState<JamSong[]>([])
  const songsRef = useRef(songs)
  songsRef.current = songs
  const songRef = useRef(song)
  songRef.current = song
  const queueRef = useRef(queue)
  queueRef.current = queue
  const revisionRef = useRef<number | null>(typeof live.revision === 'number' ? live.revision : null)

  const applySongChange = (change?: JamSongChange | null) => {
    if (!change?.song?.songId || change.index == null) return
    setSongs((prev) => mergeSongChange(prev, change) as JamSong[])
    if (change.jumpTo) {
      setSong(change.index)
      setSKey(change.key || 'C')
      setPage(0)
    }
  }
  const applyPlaylist = (update: PlaylistUpdate) => {
    const currentSong = typeof update.currentSong === 'number' ? update.currentSong : 0
    const nextQueue = (update.queue || []).map((n) => Number(n)).filter((n) => Number.isFinite(n))
    const playingId = songsRef.current[songRef.current]?.song?.songId
    const next = orderSongs(songsRef.current, update.songIds) as JamSong[]
    setSongs(next)
    setSong(currentSong)
    setQueue(nextQueue)
    queueRef.current = nextQueue
    const nowPlaying = next[currentSong]?.song?.songId
    if (playingId && nowPlaying !== playingId) setPage(0)
    if (next[currentSong]?.key) setSKey(next[currentSong].key)
  }
  const applyQueueUpdate = (payload?: { queue?: Array<number | null> | null, revision?: number | null, currentSongIndex?: number | null } | null) => {
    if (!payload) return
    if (payload.queue) {
      setQueue(payload.queue)
      queueRef.current = payload.queue
    }
    if (typeof payload.revision === 'number') revisionRef.current = payload.revision
    if (typeof payload.currentSongIndex === 'number') setSong(payload.currentSongIndex)
  }
  const applySongChangeRef = useRef(applySongChange)
  applySongChangeRef.current = applySongChange
  const applyPlaylistRef = useRef(applyPlaylist)
  applyPlaylistRef.current = applyPlaylist
  const applyQueueUpdateRef = useRef(applyQueueUpdate)
  applyQueueUpdateRef.current = applyQueueUpdate

  useEffect(() => {
    const jamSessionId = p.jam.jamSessionId
    if (!jamSessionId) return
    const opened: { unsubscribe: () => void }[] = []
    const listen = (query: string, variables: object, onData: (data: Record<string, any> | undefined) => void) => {
      const observable = client.graphql({ query, variables }) as {
        subscribe: (observer: {
          next: (value: { data?: Record<string, any> }) => void
          error: (error: unknown) => void
        }) => { unsubscribe: () => void }
      }
      opened.push(observable.subscribe({
        next: ({ data }) => onData(data),
        error: (error) => console.error(error),
      }))
    }
    listen(docs.onJamSongsChanged, { jamSessionId }, (data) => applySongChangeRef.current(data?.onJamSongsChanged))
    listen(docs.onSongRemovedFromJam, { jamSessionId }, (data) => {
      const event = data?.onSongRemovedFromJam
      if (event?.songId) applyPlaylistRef.current(event)
    })
    listen(docs.onJamQueueUpdate, { jamSessionId }, (data) => applyQueueUpdateRef.current(data?.onJamQueueUpdate))
    listen(docs.onImportStatusChanged, { jamId: jamSessionId }, (data) => {
      const event = data?.onImportStatusChanged
      if (event?.status === 'DONE' && event.songId && event.chordSheet?.trim()) {
        setSongs((prev) => withImportedSheet(prev, event.songId, event.chordSheet) as JamSong[])
      }
    })
    return () => { opened.forEach((sub) => sub.unsubscribe()) }
  }, [p.jam.jamSessionId])

  const [transpose, setTranspose] = useState(0)
  const setCapo = (c: string) => { setTranspose(0-Number(c)) }

  const [ textSize, setTextSize ] = useState("text-lg")
  useEffect(() => { 
    (async () => {
      const a = await AsyncStorage.getItem('jam/textSize') || "text-lg"; 
      if (a && a != "false") { setTextSize(a) } 
    })()
  }, [])
  useEffect(() => { AsyncStorage.setItem('jam/textSize', textSize) }, [textSize])

  const [ complex, setComplex ] = useState(true)
  useEffect(() => {
    (async () => {
      const a = await AsyncStorage.getItem('jam/complex') || "true"; 
      if (a) { setComplex(a === "true") }
    })()
  }, [])
  useEffect(() => { AsyncStorage.setItem('jam/complex', JSON.stringify(complex)) }, [complex])

  const [ headsUp, setHeadsUp ] = useState(false)
  useEffect(() => { 
    (async () => {
      const a = await AsyncStorage.getItem('jam/headsUp') || "false"; 
      if (a) { setHeadsUp(a === "true") } 
    })()
  }, [])
  useEffect(() => { AsyncStorage.setItem('jam/headsUp', JSON.stringify(headsUp)) }, [headsUp])

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
        queueRemove: subscribeToQueueRemove(p.jam.jamSessionId)
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

  const subscribeNextSong = async (jamSessionId: string): Promise<ZenObservable.Subscription> => {
    const sub = client.graphql({
      query: s.onNextSong, variables: { jamSessionId } 
    }).subscribe({
      next: ({ data }) => {
        console.log("=== On NextSong Change ===")
        const song = data?.onNextSong?.song
        const page = data?.onNextSong?.page
        const key = data?.onNextSong?.key

        if (!song) { console.log(`No song index value found, this can be OK. ${song}`) }
        if (!page) { console.log(`No page value found, this can be OK. ${page}`) }

        // needs to be fixed to add key!
        setSong(song||0); setPage(page||0); setKey(key||"C")
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
        //toast(`Welcome ${username}!`)
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

  const setNextSong = async (song: number) => {
    if (songs.length > song) {
      const d = await client.graphql({
        query: m.nextSong, variables: {
        jamSessionId: p.jam.jamSessionId, song
      }}) as GraphQLResult<NextPageMutation>
      console.log(d)
    } else { console.error(`Error: next song index "${song}" is greater than setlist.length "${songs.length}"`) }
  }

  const setKey = async (key: string) => {
    console.log(`setKey Fired ${key}`)
    const d = await client.graphql({ query: m.setSongKey, variables: {
      jamSessionId: p.jam.jamSessionId, song, key
    }}) as GraphQLResult<SetSongKeyMutation>
    console.log(d)
  }

  const queueAt = async (index: number) => {
    const next = appendQueue(queueRef.current, index)
    const d = await client.graphql({
      query: docs.setJamQueue,
      variables: {
        jamSessionId: p.jam.jamSessionId,
        queue: next,
        ...(revisionRef.current != null ? { expectedRevision: revisionRef.current } : {}),
      },
    }) as GraphQLResult<{ setJamQueue?: { queue?: Array<number | null> | null, revision?: number | null, currentSongIndex?: number | null } | null }>
    applyQueueUpdate(d.data?.setJamQueue)
  }

  const addSongToJamQueue = async (songId: string) => {
    const index = songs.findIndex((row) => row.song.songId === songId)
    if (index < 0) { console.error(`song ${songId} not found.`); return }
    await queueAt(index)
  }

  const removeSongFromJamQueue = async (index: number) => {
    if (index < 0 || index >= queue.length) return
    await client.graphql({
      query: m.removeSongFromJamQueue, variables: {
      jamSessionId: p.jam.jamSessionId, queueIndex: index
    }}) as GraphQLResult<RemoveSongFromJamQueueMutation>
  }

  const setJamConfig = async (textSize: string) => {
    const d = await client.graphql({ query: m.setJamSlideConfig, variables: {
      jamSessionId: p.jam.jamSessionId, textSize
    }}) as GraphQLResult<SetJamSlideConfigMutation>
    console.log(d)
  }

  return <View style={{ flex: 1 }} id="player">
    {songs.length === 0 && <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 22, fontWeight: '700', color: '#1f2937', textAlign: 'center' }}>Search for a song to start</Text>
    </View>}
    { songs[song]?.song && 
      <PlayerSlides
        song={songs[song]!.song} skey={sKey} page={page} 
        setPage={setNextPage} transpose={transpose} 
        textSize={textSize} complex={complex} headsUp={headsUp}
        resetJam={p.resetJam}
        canImport={canEdit}
        userId={account?.userId}
      />
    }

    { !p.isSlideShow &&
      <Controls 
        open={p.openController}
        setOpen={p.setOpenController}
        jamSessionId={p.jam.jamSessionId}
        capo={{ capo:`${0-transpose}`, setCapo }} 
        song={{
          song, setSong: setNextSong, addToQueue: addSongToJamQueue, songs: songs as JamSong[],
          canAddSongs: canEdit, userId: account?.userId,
          onSongAdded: applySongChange, onSongRemoved: applyPlaylist, queueAt,
        }} 
        sKey={{ skey: sKey, setKey }}
        display={{ textSize, setTextSize, 
          auto: false, setAuto: () => {}, 
          complex, setComplex,
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
        qrCode
        canShareJam={canEdit}
        userId={account?.userId}
        queue={{
          songs: songs as JamSong[],
          queueOrder: queue,
          removeFromQueue: removeSongFromJamQueue
        }}
      /> 
    }
  </View>
}