import { ZenObservable } from "zen-observable-ts"

import React, { useEffect, useState } from 'react'
import { View } from 'react-native'

import { default as PlayerSlides } from "./slides"

import AsyncStorage from '@react-native-async-storage/async-storage'

import { Amplify } from 'aws-amplify'
import { GraphQLResult, generateClient } from 'aws-amplify/api'

import * as s from 'oslyn-src/graphql/subscriptions'
import * as m from 'oslyn-src/graphql/mutations'
import { 
  JamSession, JamSong, Participant, User, NextPageMutation, 
  SetSongKeyMutation, SetJamSlideConfigMutation 
} from "oslyn-src/API"

import amplifyconfig from 'oslyn-src/amplifyconfiguration.json'
Amplify.configure(amplifyconfig)

export interface PlayerProps {
  jam: JamSession, 
  isSlideShow?: boolean
  user: User|null
}

export default function Player(p: PlayerProps){
  const client = generateClient()

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
  const [ active, setActive ] = useState<Participant[]>([])
  const [ songs, setSongs ] = useState<JamSong[]>([])

  const [ isLastPage, setLastPage ] = useState(false)

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
        userJoin: subscribeUserJoin(p.jam.jamSessionId)
      })
      console.log("yes sub")
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
    console.error(`setKey Fired ${key}`)
    const d = await client.graphql({ query: m.setSongKey, variables: {
      jamSessionId: p.jam.jamSessionId, song, key
    }}) as GraphQLResult<SetSongKeyMutation>
    console.log(d)
  }

  const setJamConfig = async (textSize: string) => {
    const d = await client.graphql({ query: m.setJamSlideConfig, variables: {
      jamSessionId: p.jam.jamSessionId, textSize
    }}) as GraphQLResult<SetJamSlideConfigMutation>
    console.log(d)
  }

  return <View className={`text-white w-full h-screen flex flex-col overflow-hidden`} id="player">
    { songs[song]?.song && 
      <PlayerSlides 
        song={songs[song]!.song} skey={sKey} page={page} 
        setPage={setNextPage} setLastPage={setLastPage} transpose={transpose} 
        textSize={textSize} complex={complex} headsUp={headsUp}
      />
    }
    </View>
}