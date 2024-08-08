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
  SetSongKeyMutation, SetJamSlideConfigMutation 
} from "@/../src/API"

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

Amplify.configure(amplifyconfig, { ssr: true })

const nextSongEventId = "next-song"

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
  const client = generateClient()
  
  const [ isLogin, setIsLogin ] = useState(false)

  const [ isFullScreenEnabled, setFullScreenEnabled ] = useState(false)
  useEffect(() => { setFullScreenEnabled(document?.fullscreenEnabled || (document as any)?.webkitFullscreenEnabled) }, [])

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
        method: "POST", body: JSON.stringify({ userId: u.userId })
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
        method: "POST", body: JSON.stringify({ name, colour })
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
    console.log(event.code)
    if (event.code === "ArrowRight") {
      if (!p.isSlideShow && isLastPage && songs.length > song+1) {
        setNextSong(song+1)
        return
      } else console.log(`cannot turn to go to next song using ${event.code}`)
    }
  }

  useEffect(() => {
    if (songs) window.addEventListener('keydown', keydown)
    return () => window.removeEventListener('keydown', keydown)
  }, [p.isSlideShow, isLastPage, songs, song])

  useEffect(() => {
    if (songs.length > 0) {
      let sid = songs[song].song.songId
      console.log(`setSong: ${songs[song].song.title} ${sid}`)
      document.body.dispatchEvent(
        new CustomEvent(nextSongEventId, { 
          detail: { songId: sid } 
        })
      )
    } else console.warn("PLAYER - songs list not set yet.")
  } , [songs, song])

  return <div className={`text-white w-full h-screen flex flex-col overflow-hidden ${localTheme || "light"}`} id="player">
    { songs[song]?.song && 
      (p.isSlideShow ? 
        <SSlides
          song={songs[song].song} page={page} 
          setPage={setNextPage} setLastPage={setLastPage}
          textSize={slideTextSize || "text-3xl"}
        />:
        <PSlides jamId={p.jam.jamSessionId} userId={p.user?.userId || guestIdentity[p.jam.jamSessionId] || ""}
          song={songs[song]!.song} skey={sKey} page={page} 
          setPage={setNextPage} setLastPage={setLastPage} transpose={transpose} 
          textSize={textSize} complex={complex} headsUp={headsUp}
        />)
    }
    { !p.isSlideShow && isLastPage && songs.length > song+1 && <button onClick={() => setNextSong(song+1)}
        className='fixed bottom-4 right-10 bg-oslyn-600 dark:bg-gray-700 rounded-full p-4 drop-shadow-lg flex justify-center items-center text-4xl hover:bg-coral-300'
      >
        <ChevronDoubleRightIcon className="w-6 h-6 text-white" />
    </button> }
    { songs && !p.isSlideShow &&
      <Controls 
        capo={{ capo:`${0-transpose}`, setCapo }} 
        song={{ song, setSong: setNextSong, songs: songs as JamSong[] }} 
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
      /> 
    }
    { isFullScreenEnabled && p.isSlideShow && !fullScreen && <button onClick={() => setFullScreen(true)}
      className={`fixed z-90 right-10 top-4 bg-coral-400 w-12 h-12 rounded-lg p-2 drop-shadow-lg flex justify-center items-center text-4xl hover:bg-coral-300 hover:drop-shadow-2xl`}
    >
      <ArrowsPointingOutIcon className="w-8 h-8 text-oslyn-800 hover:text-oslyn-900" />
    </button>}

    <SignInAsGuest open={guestOpen} setOpen={setGuestOpen} jamId={p.jam.jamSessionId} signInAsGuest={signInAsGuest} />
    <Toaster position="bottom-left" />
  </div>
}