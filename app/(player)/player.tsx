"use client"

import { ZenObservable } from "zen-observable-ts"

import awsConfig from '@/src/aws-exports'
import { Amplify, API, graphqlOperation } from 'aws-amplify'
import { GraphQLResult, GraphQLSubscription } from '@aws-amplify/api'

import * as s from '@/src/graphql/subscriptions'
import * as m from '@/src/graphql/mutations'
import { 
  JamSession, JamSessionSlideConfig, JamSong, NextKey, NextPage, 
  OnNextPageSubscription, OnNextSongSubscription, OnSongKeySubscription, 
  OnJamSlideConfigChangeSubscription, 
  Participant, User, JamSessionActiveUsers, OnEnterJamSubscription 
} from "@/src/API"

import { useEffect, useState } from "react"
import { ChevronDoubleRightIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/solid'
import Controls from './controls'
import { useSideBarContext } from '../context'

import { default as PSlides } from "./slides"
import { default as SSlides } from '../(slides)/slides'
import { useTheme } from 'next-themes'
import { useSession } from 'next-auth/react'
import SignInAsGuest from './signInAsGuest'

import toast, { Toaster } from 'react-hot-toast'

export interface PlayerProps {
  jam: JamSession, 
  isSlideShow?: boolean
  user: User|null
}

Amplify.configure({ ...awsConfig, ssr: true });

export default function Player(p: PlayerProps) {
  const theme = useTheme()
  const { setOpenSidebar, guestIdentity, addGuestIdentity } = useSideBarContext()
  const { data: session, status } = useSession()
  
  const [ isFullScreenEnabled, setFullScreenEnabled ] = useState(false)
  useEffect(() => { setFullScreenEnabled(document?.fullscreenEnabled || (document as any)?.webkitFullscreenEnabled) }, [])

  // after onload, we need to sync jam manually
  const [ jam, setJam ] = useState(p.jam) 
  useEffect( () => { setJam(p.jam) }, [p.jam] )

  const [ song, setSong ] = useState(jam.currentSong || 0)
  const [ sKey, setSKey ] = useState(jam.setList.songs[jam.currentSong || 0]?.key || "C")
  const [ page, setPage ] = useState(jam.currentPage || 0)

  const [ guestOpen, setGuestOpen ] = useState(false)

  const [ isLastPage, setLastPage ] = useState(false)

  const [transpose, setTranspose] = useState(0)
  const setCapo = (c: string) => { setTranspose(0-Number(c)) }

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

  const [ slideTextSize, setSlideTextSize ] = useState(jam.slideTextSize || "text-3xl")
  useEffect(() => {
    console.log("subscribe text size")
    if (jam.jamSessionId) { subscribeTextSize(jam.jamSessionId) }
  }, [jam.slideTextSize, jam.jamSessionId])

  const subscribeTextSize = async (jamSessionId: string): Promise<ZenObservable.Subscription> => {
    const sub = API.graphql<GraphQLSubscription<OnJamSlideConfigChangeSubscription>>(
      graphqlOperation(s.onJamSlideConfigChange, { jamSessionId } )
    ).subscribe({
      next: ({ value }) => {
        const ts = value.data?.onJamSlideConfigChange?.textSize
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
    if (jam.jamSessionId && !subs.nextPage && !subs.nextSong && !subs.keyChange && !subs.userJoin) { 
      setSubs({
        nextPage: subscribeNextPage(jam.jamSessionId),
        nextSong: subscribeNextSong(jam.jamSessionId),
        keyChange: subscribeKeyChange(jam.jamSessionId),
        userJoin: subscribeUserJoin(jam.jamSessionId)
      })
      console.log("yes sub")
    }
  }, [page, jam.jamSessionId, subs])

  const subscribeNextPage = async (jamSessionId: string): Promise<ZenObservable.Subscription> => {
    const sub = API.graphql<GraphQLSubscription<OnNextPageSubscription>>(
      graphqlOperation(s.onNextPage, { jamSessionId } )
    ).subscribe({
      next: ({ value }) => {
        const page = value.data?.onNextPage?.page
        incomingNextPage(page || 0)
      },
      error: (error) => console.error(error)
    })
    console.log(sub)
    return sub
  }

  const subscribeNextSong = async (jamSessionId: string): Promise<ZenObservable.Subscription> => {
    const sub = API.graphql<GraphQLSubscription<OnNextSongSubscription>>(
      graphqlOperation(s.onNextSong, { jamSessionId } )
    ).subscribe({
      next: ({ value }) => {
        const song = value.data?.onNextSong?.song
        const page = value.data?.onNextSong?.page

        if (!song) { console.log(`No song index value found, this can be OK. ${song}`) }
        if (!page) { console.log(`No page value found, this can be OK. ${page}`) }

        incomingNextSong(song||0, page||0)
      },
      error: (error) => console.error(error)
    })
    console.log(sub)
    return sub
  }

  const subscribeKeyChange = async (jamSessionId: string): Promise<ZenObservable.Subscription> => {
    const sub = API.graphql<GraphQLSubscription<OnSongKeySubscription>>(
      graphqlOperation(s.onSongKey, { jamSessionId } )
    ).subscribe({
      next: ({ value }) => {
        console.log("=== On Key Change ===")
        console.log(JSON.stringify(value))

        const song = value.data?.onSongKey?.song
        const key = value.data?.onSongKey?.key

        if (!song) { console.log(`No song index value found, this can be OK. ${song}`) }
        if (!key) { console.log(`No page value found, this can be OK. ${page}`) }

        incomingKey(song || 0, key || "C")

        let j = JSON.parse(JSON.stringify(jam)) as JamSession
        j.setList.songs[song || 0]!.key = key || "C"
        console.log(j)
        setJam(j)
      },
      error: (error) => console.error(error)
    })
    console.log(sub)
    return sub
  }

  const subscribeUserJoin = async (jamSessionId: string): Promise<ZenObservable.Subscription> => {
    console.log(`= ${jamSessionId}`)

    const sub = API.graphql<GraphQLSubscription<OnEnterJamSubscription>>(
      graphqlOperation(s.onEnterJam, { jamSessionId: jamSessionId } )
    ).subscribe({
      next: ({ value }) => {
        console.log("=== On User Join ===")
        console.log(JSON.stringify(value))

        const active = value.data?.onEnterJam?.active as Participant[]
        const latest = value.data?.onEnterJam?.latest

        if (!active) { console.log(`subscribeUserJoin: No active value found, this can be OK. ${active}`) }
        if (!latest) { console.log(`subscribeUserJoin: No latest value found, this can be OK. ${latest}`) }

        jam.active = [...active]
        setJam({...jam})

        if (latest?.username) toast(`Welcome ${latest?.username}!`)
        else if (latest?.user?.username) toast(`Welcome ${latest?.username}!`)
      },
      error: (error) => console.error(`=== ${JSON.stringify(error)}`)
    })
    console.log(sub)
    return sub
  }
  
  const incomingNextPage = async (page: number) => { setPage(page) }
  const incomingNextSong = async (song: number, page: number) => { 
    setSong(song); setPage(page) 
    setKey(jam.setList.songs[song]?.key || "C")
  }
  const incomingKey = async (s: number, key: string) => {
    if (song === s) { setSKey(key) } 
    else { console.error("TODO: handle case where we are modifying NOT current song's key.") }
  }
  
  const setNextPage = async (page: number) => {
    const d = await API.graphql(graphqlOperation(m.nextPage, {
      jamSessionId: jam.jamSessionId, page
    })) as GraphQLResult<{ nextPage: NextPage }>
    console.log(d)
  }

  const setNextSong = async (song: number) => {
    if (jam.setList.songs.length > song) {
      const d = await API.graphql(graphqlOperation(m.nextSong, {
        jamSessionId: jam.jamSessionId, song
      })) as GraphQLResult<{ nextPage: NextPage }>
      console.log(d)
    } else { console.error(`Error: next song index "${song}" is greater than setlist.length "${jam.setList.songs.length}"`) }
  }

  const setKey = async (key: string) => {
    const d = await API.graphql(graphqlOperation(m.setSongKey, {
      jamSessionId: jam.jamSessionId, song, key
    })) as GraphQLResult<{ setSongKey: NextKey }>
    console.log(d)

    // once key is changed, sync jam
    // jam.setList.songs[song]!.key = key
    // setJam(jam)
  }

  const setJamConfig = async (textSize: string) => {
    const d = await API.graphql(graphqlOperation(m.setJamSlideConfig, {
      jamSessionId: jam.jamSessionId, textSize
    })) as GraphQLResult<{ setJamSlideConfig: JamSessionSlideConfig }>
    console.log(d)
  }
  
  useEffect(() => {
    if (!jam || jam.currentSong! <= -1 || jam.currentSong! >= jam.setList.songs.length) { 
      console.warn(`currentSong not within range of setList: ${jam.currentPage}`); return 
    }
    const cp = jam.currentSong!
    if (!jam || jam.currentPage! <= -1) { 
      console.warn(`currentPage not > 1. ${jam.currentPage}`); return 
    }

    if (!jam.setList.songs[cp]) { console.error(`song in setlist at ${cp} not found`); return }
    setSong(cp)
    setSKey(jam.setList.songs[cp]!.key)
    setPage(jam.currentPage || 0)
    console.log("all set")
  }, [jam])

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
      const data = await (await fetch(`/api/jam/${jam.jamSessionId}/add/user`, {
        method: "POST", body: JSON.stringify({ userId: u.userId })
      })).json() as JamSessionActiveUsers

      if (typeof data === "string") { return data }
      console.log(data)
    } catch (e) { return JSON.stringify(e) }
    return ""
  }

  const signInAsGuest = async (name: string, colour: string): Promise<string> => {
    try {
      const data = await (await fetch(`/api/jam/${jam.jamSessionId}/add/guest`, {
        method: "POST", body: JSON.stringify({ name, colour })
      })).json() as JamSessionActiveUsers  
      
      if (typeof data === "string") { return data }
      console.log(data)

      if (data.jamSessionId && data.latest?.userId) {
        addGuestIdentity(data.jamSessionId, data.latest.userId)
      }
    } catch (e) { return JSON.stringify(e) }
    return ""
  }

  useEffect(() => {
    console.log(guestIdentity)
    const guestIds = jam.active.map((j) => j?.userId)
    if (session && status === "authenticated" && p.user) {
      console.log(`User is authenticated .. ${p.user.userId}`)
      console.log(guestIds)
      if (!guestIds.includes(p.user.userId)) signInAsUser(p.user)
    } else if (status === "unauthenticated") {
      console.log(guestIdentity)
      console.log(jam.active)
      if (guestIdentity[jam.jamSessionId]) {
        const guestId = guestIdentity[jam.jamSessionId]
        if (guestIds.includes(guestId)) { setGuestOpen(false) }
        else setGuestOpen(true)
      } else setGuestOpen(true)
    }
  }, [session, status, guestIdentity, jam])

  const onFullScreenChange = (event: any) => { 
    if (document.fullscreenElement) setFullScreen(true)
    else setFullScreen(false)
  }
  useEffect(() => {
    addEventListener("fullscreenchange", onFullScreenChange)
    return () => removeEventListener("fullscreenchange", onFullScreenChange)
  }, [])

  return <div className={`text-white w-full h-screen flex flex-col overflow-hidden ${theme.theme || "light"}`} id="player">
    { jam.setList.songs[song]?.song && 
      (p.isSlideShow ? 
        <SSlides
          song={jam.setList.songs[song]!.song} page={page} 
          setPage={setNextPage} setLastPage={setLastPage}
          textSize={slideTextSize || "text-3xl"}
        />:
        <PSlides 
          song={jam.setList.songs[song]!.song} skey={sKey} page={page} 
          setPage={setNextPage} setLastPage={setLastPage} transpose={transpose} 
          textSize={textSize} complex={complex} headsUp={headsUp}
        />)
    }
    { !p.isSlideShow && isLastPage && jam.setList.songs.length > song+1 && <button onClick={() => setNextSong(song+1)}
        className='fixed bottom-4 right-10 bg-oslyn-600 dark:bg-gray-700 rounded-full p-4 drop-shadow-lg flex justify-center items-center text-4xl hover:bg-coral-300'
      >
        <ChevronDoubleRightIcon className="w-6 h-6 text-white" />
    </button> }
    { jam.setList.songs && !p.isSlideShow &&
      <Controls 
        capo={{ capo:`${0-transpose}`, setCapo }} 
        song={{ song, setSong: setNextSong, songs: jam.setList.songs as JamSong[] }} 
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
          active: jam.active as Participant[],
          removeActive: () => {}
        }}
      /> 
    }
    { isFullScreenEnabled && p.isSlideShow && !fullScreen && <button onClick={() => setFullScreen(true)}
      className={`fixed z-90 right-10 top-4 bg-coral-400 w-12 h-12 rounded-lg p-2 drop-shadow-lg flex justify-center items-center text-4xl hover:bg-coral-300 hover:drop-shadow-2xl`}
    >
      <ArrowsPointingOutIcon className="w-8 h-8 text-oslyn-800 hover:text-oslyn-900" />
    </button>}

    <SignInAsGuest open={guestOpen} setOpen={setGuestOpen} jamId={jam.jamSessionId} signInAsGuest={signInAsGuest} />
    <Toaster position="bottom-left" />
  </div>
}