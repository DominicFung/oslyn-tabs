import React, { useState, useEffect } from "react"
import { Session, SongRequest } from '../types'

import { Listbox, Transition } from '@headlessui/react'
import { ArrowsUpDownIcon } from '@heroicons/react/24/solid'

import amplifyconfig from '../../../../src/amplifyconfiguration.json'
import { addSongToLiveJam, createImportedSong, listUserJamSessions } from '../graphql'
import { Amplify } from 'aws-amplify'
import { GraphQLResult, generateClient } from 'aws-amplify/api'

interface CreateProps {
  session: Session
}

const host = process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://tabs.oslyn.io"

const chords = ['A', 'Bb', 'B', 'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab']
const supported = [
  "https://tabs.ultimate-guitar.com/tab/"
]

Amplify.configure(amplifyconfig)

export default function CreateSong(p: CreateProps) {

  const [ currentTab, setCurrentTab ] = useState<chrome.tabs.Tab>()
  const [ song, setSong ] = useState<SongRequest>({ title: "", chordSheet: "", chordSheetKey: "C", artist: "" })
  const [ isSupported, setSupported ] = useState(false)
  const [ rooms, setRooms ] = useState<{ jamSessionId: string, label: string }[]>([])
  const [ jamId, setJamId ] = useState("")
  const [ status, setStatus ] = useState("")
  const [ pending, setPending ] = useState(false)
  const client = generateClient()

  useEffect(() => { getCurrentTab(); loadRooms() }, [p.session])

  useEffect(() => {
    if (!currentTab) return
    console.log(currentTab)

    const url = currentTab.url
    console.log(url)
    if (!url) return

    for (const s of supported) {
      if (url.startsWith(s)) { 
        setSupported(true); getSong(); return 
      }
    }
    setSupported(false)
  }, [currentTab])

  const getCurrentTab = async () => {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true})
    setCurrentTab(tab)
  }

  const getSong = async () => {
    console.log("getSong")

    const tabs = await chrome.tabs.query({active: true, currentWindow: true})
    console.log(tabs)

    const tabId = tabs[0].id

    if (!tabId) { return }
    chrome.tabs.sendMessage(
      tabId, { action: 'READ_SHEET' },
      (s: { chordsheet: string, title: string, artist: string }) => {
        console.log(s)
        if (s) { setSong({
          title: s.title,
          chordSheet: s.chordsheet,
          chordSheetKey: "C",
          artist: s.artist
        }) }
      }
    )
  }

  const loadRooms = async () => {
    const userId = p.session.user.userId
    if (!userId) return
    try {
      const data = await client.graphql({
        query: listUserJamSessions,
        variables: { userId },
      }) as GraphQLResult<{ listUserJamSessions?: {
        jamSessionId: string
        description?: string | null
        startDate?: number | null
        setList?: { description?: string | null } | null
      }[] }>
      const list = (data.data?.listUserJamSessions || [])
        .slice()
        .sort((a: { startDate?: number | null }, b: { startDate?: number | null }) => (b.startDate || 0) - (a.startDate || 0))
        .map((room: { jamSessionId: string, description?: string | null, setList?: { description?: string | null } | null }) => ({
          jamSessionId: room.jamSessionId,
          label: room.setList?.description || room.description || room.jamSessionId,
        }))
      setRooms(list)
      if (list[0]) setJamId(list[0].jamSessionId)
    } catch (e) {
      console.error(e)
      setStatus("Could not load your jam rooms.")
    }
  }

  const saveSong = async () => {
    if (!p.session.user.userId || !song.chordSheet || !song.title) {
      console.error("userId, title, or chordsheet not found.")
      return null
    }
    const data = await client.graphql({
      query: createImportedSong,
      variables: {
        title: song.title,
        userId: p.session.user.userId,
        chordSheet: song.chordSheet,
        chordSheetKey: song.chordSheetKey,
        artist: song.artist,
        originPlatorm: "UG",
        originLink: currentTab?.url || undefined,
      }
    }) as GraphQLResult<{ createSong?: { songId?: string | null } }>
    const songId = data.data?.createSong?.songId
    if (!songId) { console.error('songId not available'); return null }
    return songId as string
  }

  const createSong = async () => {
    if (pending) return
    setPending(true)
    setStatus("")
    try {
      const songId = await saveSong()
      if (!songId) { setStatus("Could not create the song."); return }
      chrome.tabs.create({ url : `${host}/songs/edit/${songId}?new=true`})
    } catch (e) {
      console.error(e)
      setStatus("Could not create the song.")
    } finally {
      setPending(false)
    }
  }

  const addToJam = async () => {
    if (pending || !jamId) return
    setPending(true)
    setStatus("")
    let createdId: string | null = null
    try {
      createdId = await saveSong()
      if (!createdId) { setStatus("Could not create the song."); return }
      await client.graphql({
        query: addSongToLiveJam,
        variables: {
          jamSessionId: jamId,
          songId: createdId,
          key: song.chordSheetKey || "C",
          userId: p.session.user.userId,
          jumpTo: false,
        }
      })
      const room = rooms.find((item) => item.jamSessionId === jamId)
      setStatus(`Added to ${room?.label || "the jam"}.`)
    } catch (e) {
      console.error(e)
      setStatus(createdId ? "Saved the song, but could not add it to the jam." : "Could not add this chart to the jam.")
    } finally {
      setPending(false)
    }
  }


  return <>
  <div className="relative max-w-md max-h-full mx-auto flex flex-col">
    <div className='flex-1' />
    <div className="relative bg-white shadow dark:bg-gray-700">
      <button type="button" onClick={() => { window.close() } }
          className="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-800 dark:hover:text-white" data-modal-hide="authentication-modal">
        <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
        <span className="sr-only">Close modal</span>
      </button>
      <div className="px-6 py-6 lg:px-8">
          <h3 className="mb-4 text-xl font-medium text-gray-900 dark:text-white">Oslyn Extension</h3>
          <p className="mb-6 text-sm font-normal dark:text-gray-400">Click Create to add this song to your account</p>

          <div className="flex flex-row mb-4">
            <div className='flex-1 mr-2'>
              <input type="search" id="search" className="block w-full p-4 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-oslyn-500 focus:border-oslyn-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-oslyn-500 dark:focus:border-oslyn-500" 
                value={song.title}  placeholder="Title" onChange={(e) => setSong({ ...song, title: e.currentTarget.value })}/>
            </div>
            <div className='flex-1 mr-2'>
              <input type="search" id="search" className="block w-full p-4 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-oslyn-500 focus:border-oslyn-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-oslyn-500 dark:focus:border-oslyn-500" 
                value={song.artist || ""}  placeholder="Artist" onChange={(e) => setSong({ ...song, artist: e.currentTarget.value })}/>
            </div>
            <div className='flex-0'>
              <Listbox as="div" value={song.chordSheetKey} onChange={(e) => setSong({...song, chordSheetKey: e})} className="relative p-1 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-oslyn-500 focus:border-oslyn-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-oslyn-500 dark:focus:border-oslyn-500">
              {({ open }) => (
                <>
                <Listbox.Button className="relative w-full min-w-0 inline-flex items-center appearance-none focus:outline-none h-9 px-3 py-0 text-sm rounded-base pr-6 cursor-base shadow-sm text-neutral-900 dark:text-neutral-100 dark:bg-base dark:hover:border-neutral-600">
                  <span className="p-1 px-4 text-sm truncate">{song.chordSheetKey}</span>
                  <span className="absolute flex items-center ml-3 pointer-events-none right-1">
                  <ArrowsUpDownIcon
                    className={`"w-4 h-4 ${open ? "text-oslyn-500" : "text-gray-400"}`}
                  />
                </span>
                </Listbox.Button>
                <Transition
                  show={open}
                  enter="transition ease-in-out duration-100"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="transition ease-out duration-75"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options static
                    className="absolute left-0 z-40 max-h-64 w-full mt-2 origin-top-left rounded-base shadow-sm outline-none overflow-auto border border-gray-200 bg-neutral-50 dark:bg-neutral-800 dark:border-gray-700 py-1.5 px-1.5 space-y-1"
                  >
                    {chords.map((chord) => (
                      <Listbox.Option
                        className="relative"
                        key={chord}
                        value={chord}
                      >
                        {({ active, selected, disabled }) => (
                          <button
                            disabled={disabled}
                            aria-disabled={disabled}
                            className={`flex items-center w-full px-4 pl-4 h-9 border-0 flex-shrink-0 text-sm text-left cursor-base font-normal focus:outline-none rounded-base
                              ${active && "bg-neutral-100 dark:bg-neutral-700"}
                              ${selected && "bg-oslyn-100 text-oslyn-800 dark:bg-oslyn-600 dark:bg-opacity-15 dark:text-oslyn-100"}`}
                          >
                            <span
                              className={`flex-1 block truncate ${selected ? "font-semibold" : "font-normal"}`}
                            >
                              {chord}
                            </span>
                          </button>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
                
                </>
              )}
              </Listbox>

            </div>
          </div>

            <code className="block w-full mb-4 text-xs space-x-4 bg-gray-800 text-white rounded-lg p-4 pl-6">
              <pre style={{ fontFamily: `"Roboto Mono", "Courier New", monospace;`}}>
              {song.chordSheet.split("\n").map((str, i) => <p key={i} className="min-h-[1.5em]">{str}</p>)}
              </pre>
            </code>

          <span className="space-y-2">
            { !song.chordSheet ? 
              <button onClick={getSong} disabled={!isSupported}
                  className="w-full flex flex-row text-oslyn-600 dark:text-white dark:disabled:text-gray-400 bg-oslyn-700 hover:bg-oslyn-800 disabled:bg-gray-500 focus:ring-4 focus:outline-none focus:ring-oslyn-300 font-medium rounded-lg text-sm px-5 py-1 text-center dark:bg-oslyn-600 dark:hover:bg-oslyn-700 dark:disabled:bg-gray-800  dark:focus:ring-oslyn-800">
                    <div className='flex-1' />
                    <div className="px-10 py-2.5" >Copy</div>
                    <div className='flex-1' />
              </button>:
              <>
              <button onClick={createSong} disabled={pending || !isSupported || song.chordSheet === "" || song.title === ""}
                  className="w-full flex flex-row text-oslyn-600 dark:text-white dark:disabled:text-gray-400 bg-oslyn-700 hover:bg-oslyn-800 disabled:bg-gray-500 focus:ring-4 focus:outline-none focus:ring-oslyn-300 font-medium rounded-lg text-sm px-5 py-1 text-center dark:bg-oslyn-600 dark:hover:bg-oslyn-700 dark:disabled:bg-gray-800 dark:focus:ring-oslyn-800">
                    <div className='flex-1' />
                    <div className="px-10 py-2.5">Create</div>
                    <div className='flex-1' />
              </button>
              {rooms.length > 0 && <label className="block mt-3 text-sm text-gray-700 dark:text-gray-200">
                Current jam
                <select value={jamId} onChange={(e) => setJamId(e.target.value)}
                  className="mt-1 block w-full p-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  {rooms.map((room) => <option key={room.jamSessionId} value={room.jamSessionId}>{room.label}</option>)}
                </select>
              </label>}
              <button onClick={addToJam} disabled={pending || !isSupported || !jamId || song.chordSheet === "" || song.title === ""}
                  className="w-full mt-2 flex flex-row text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl disabled:bg-gray-500 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-1 text-center">
                    <div className='flex-1' />
                    <div className="px-10 py-2.5">{pending ? "Adding…" : "Add to current jam"}</div>
                    <div className='flex-1' />
              </button>
              {rooms.length === 0 && <p className="pt-2 text-xs text-gray-500 dark:text-gray-300">Start a jam on Oslyn first, then add this chart to it.</p>}
              </>
            }

            {status && <p className="pt-2 text-sm text-gray-700 dark:text-gray-200">{status}</p>}

            <div className="pt-4 text-sm font-medium text-gray-500 dark:text-gray-300">
                Not copying the right stuff anymore? <a href="#" className="text-blue-700 hover:underline dark:text-blue-500">Report</a>
            </div>

          </span>
      </div>
    </div>
    <div className='flex-1' />
  </div>
</>
}