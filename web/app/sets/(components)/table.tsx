"use client"
import { JamSong, SetList, Song, User } from "@/../src/API"

import { useEffect, useState, useMemo } from "react"
import Save from "./save"

import Row from "./(table)/row"

import { 
  closestCenter, DndContext, DragOverlay, KeyboardSensor, 
  MouseSensor, TouchSensor, useSensor, useSensors
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { DraggableTableRow } from "./(table)/dragrow"
import DragHandle from "./(table)/draghandle"


export interface SetTableProps {
  songs: Song[]
  set?: SetList
}

function songIndex(songs: Song[], songId: string) {
  for (let i=0; i<songs.length; i++) {
    if (songs[i].songId === songId) return i
  }
  return -1
}

export default function SetTable(p: SetTableProps) {
  const [ songs, setSongs ] = useState<Song[]>([]) // only to be set within
  const [ active, setActive ] = useState<Song|null>(null)
  const items = useMemo(() => songs?.map(({ songId }) => songId), [songs])

  const [ setList, setSetList ] = useState({
    setListId: "",
    description: "",
    songs: [] as JamSong[],
    creator: {} as User, editors: [] as User[],
  } as SetList)

  const [ description, setDescription ] = useState<string>("") 
  const [ keys, setKeys ] = useState<string[]>(Array(songs.length).fill("C"))
  const [ sListCheck, setSListCheck ] = useState<boolean[]>(Array(songs.length).fill(false)) 
  const [ allCheck, setAllCheck ] = useState<boolean>(false)

  const [ preview, setPreview ] = useState("")

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  function handleDragStart(event: any) {
    if (event.active && event.active.id) {
      console.log(`handleDragStart: ${event.active.id}`)
      setActive(songs[songIndex(songs, event.active.id)])
    } else console.error("ERROR: could not handdle 'handleDragStart'")
  }

  function handleDragEnd(event: any) {
    const { active, over } = event
    console.log("handleDragEnd")
    console.log(active)
    console.log(over)
    if (active.id !== over.id) {
      const oldIndex = songIndex(songs, active.id)
      const newIndex = songIndex(songs, over.id)
      console.log(`old: ${oldIndex}, new: ${newIndex}`)

      setSListCheck((data) => {
        return arrayMove(data, oldIndex, newIndex)
      })

      setSongs((data) => {
        console.log(data)
        let s = arrayMove(data, oldIndex, newIndex)
        console.log(s)
        return s
      })
    }

    setActive(null)
  }

  function handleDragCancel() {
    setActive(null)
  }

  useEffect(() => {
    const b = { ...setList, description, songs: [] as JamSong[] } as SetList
    if (sListCheck.length !== keys.length) { console.error("CheckList needs to be the same length as keys."); return }
    if (sListCheck.length !== songs.length) { console.error("CheckList needs to be the same length as p.songs."); return }

    for (let i = 0; i < sListCheck.length; i++) {
      if (sListCheck[i]) { b.songs.push({ song: songs[i] as Song, key: keys[i] } as JamSong) }
    }

    console.log(b)
    setSetList(b)
  }, [description, sListCheck, keys, songs])

  useEffect(() => {
    let allTrue = true
    let allFalse = true
    for (let i = 0; i < sListCheck.length; i++) { 
      if (sListCheck[i]) allFalse = false
      if (!sListCheck[i]) allTrue = false
    }
    if (allTrue) setAllCheck(true)
    if (allFalse) setAllCheck(false)
  }, [sListCheck])

  useEffect(() => {
    let k = [] as string[]
    for (let i = 0; i < p.songs.length; i++) { 
      k.push(p.songs[i].chordSheetKey || "C")
    }
    setKeys(k)
  }, [])

  useEffect(() => {
    if (p.set) {
      let songs = p.set.songs.map((s) => s!.song)
      let _songs = p.set.songs.map((s) => s?.song.songId || "")
      let keys = p.set.songs.map((s) => s?.key || "C")
      let checked = Array(p.set.songs.length).fill(true) as boolean[]
      
      for (let i=0; i<p.songs.length; i++) {
        if (!_songs.includes(p.songs[i].songId)) {
          songs.push(p.songs[i])
          keys.push(p.songs[i].chordSheetKey || "C")
          checked.push(false)
        }
      }

      setKeys(keys)
      setSListCheck(checked)
      setDescription(p.set.description)
      setSongs(songs)
      setSetList(p.set)
    } else { setSongs(p.songs); setKeys(Array(p.songs.length).fill("C")); setSListCheck(Array(p.songs.length).fill(false)) }
  }, [p.set, p.songs])

  return <>
  <section className="bg-[url('https://flowbite.s3.amazonaws.com/docs/jumbotron/hero-pattern.svg')] dark:bg-[url('https://flowbite.s3.amazonaws.com/docs/jumbotron/hero-pattern-dark.svg')]">
    <div className="py-8 px-4 mx-auto max-w-screen-xl text-center lg:py-16 z-10 relative">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight leading-none text-gray-900 md:text-5xl lg:text-6xl dark:text-white">Choose Your Songs</h1>
        <p className="mb-8 text-lg font-normal text-gray-500 lg:text-xl sm:px-16 lg:px-48 dark:text-gray-200">
          Check all the songs that you would like to add to your Set.
        </p>
        <div className="mx-auto max-w-xl">
          <input type="search" id="search" className="mx-auto w-full block p-4 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500" 
              value={description}  placeholder="Set Description (ie. May 12 2023 Jam)" onChange={(e) => setDescription(e.target.value)}/>
        </div>
       
    </div>
    <div className="bg-gradient-to-b from-oslyn-50 to-transparent dark:from-oslyn-900 w-full h-full absolute top-0 left-0 z-0"></div>
  </section>
  <div className="relative overflow-x-auto sm:rounded-lg mx-5 h-[calc(100vh-230px)]"> {/** height css calculation needs work. shadow removed to make this work. */}
    <DndContext
      sensors={sensors}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      onDragCancel={handleDragCancel}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
    >
      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th></th>
                <th scope="col" className="px-6 py-3">
                  <input id="default-checkbox" type="checkbox" value="" className="w-4 h-4 text-oslyn-600 bg-coral-100 border-coral-300 rounded focus:ring-oslyn-500 dark:focus:ring-oslyn-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" 
                    checked={allCheck} onChange={() => { setAllCheck(!allCheck); setSListCheck(Array(p.songs.length).fill(!allCheck)) }}
                  />
                </th>
                <th scope="col" className="px-6 py-3">
                    Title
                </th>
                <th scope="col" className="px-6 py-3">
                    Key
                </th>
                <th scope="col" className="px-6 py-3">
                    Album
                </th>
                <th scope="col" className="px-6 py-3">
                    Action
                </th>
            </tr>
        </thead>
        <tbody>
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            { songs.map((a, i) => <DraggableTableRow key={a.songId} row={a}>
                <Row key={i} song={songs[i]} setPreview={() => setPreview(songs[i].songId)}
                  checked={sListCheck[i]} setChecked={(b) => {sListCheck[i]=b; setSListCheck([...sListCheck])}}
                  skey={keys[i]} setKey={(e) => { keys[i] = e; setKeys([...keys]) }} 
                />
            </DraggableTableRow>)}
          </SortableContext>
        </tbody>
      </table>
      <DragOverlay>
        {active && (
          <table style={{ width: "100%" }}>
            <tbody>
              <tr className="bg-white border-b dark:bg-gray-900 dark:border-gray-700">
                <th>
                  <DragHandle />
                </th>
                <Row song={active} setPreview={() => setPreview(active.songId)}
                    checked={sListCheck[songIndex(songs, active.songId)]} setChecked={(b) => {sListCheck[songIndex(songs, active.songId)]=b; setSListCheck([...sListCheck])}}
                    skey={keys[songIndex(songs, active.songId)]} setKey={(e) => { keys[songIndex(songs, active.songId)] = e; setKeys([...keys]) }} 
                />
              </tr>
              
            </tbody>
          </table>
        )}
      </DragOverlay>

    </DndContext>
    
      
  </div>
  <Save set={setList} type="update" />
</>
} 


