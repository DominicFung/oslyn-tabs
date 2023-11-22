"use client"

import { Band, User, Song } from "@/../src/API"
import Image from "next/image"

import SongTable from "../../(components)/(song)/songTable"

import { useSideBarContext } from "@/app/context"
import ShareSongs from "../(components)/share"
import CreateJam from "../(components)/createJam"

interface BandProps {
  user: User|null
  band: Band
  songs: Song[]
}

export default function BandComponent(p: BandProps) {
  const { openSidebar } = useSideBarContext()



  return <div className={`${openSidebar?"min-w-[640px]":""}`}>
  <section className="bg-[url('https://flowbite.s3.amazonaws.com/docs/jumbotron/hero-pattern.svg')] dark:bg-[url('https://flowbite.s3.amazonaws.com/docs/jumbotron/hero-pattern-dark.svg')]">
    <div className="lg:pt-16 lg:pb-4 pt-8 pb-2 px-4 mx-auto max-w-screen-xl lg:py-16 z-10 relative flex flex-row">
        
        <Image src={p.band.imageUrl || ""} width={500} height={500} className="w-36 h-36 ml-auto" alt="band image" />
        
        <div className="ml-4 mr-auto">
          <h1 className="my-4 text-3xl font-extrabold tracking-tight leading-none text-gray-900 md:text-4xl lg:text-5xl dark:text-white">{p.band.name}</h1>
          <p className="mb-8 text-lg font-normal text-gray-500 pl-2 lg:text-xl dark:text-gray-200">
            {p.band.description}
          </p>
        </div>
    </div>
    <div className="flex flex-row-reverse z-10 relative">
      
      { p.user ? <ShareSongs user={p.user} band={p.band} songs={p.songs}/> : 
      <button disabled
        className="text-white mx-5 my-2 bg-gray-500 focus:ring-4 focus:outline-none focus:ring-oslyn-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-gray-700 dark:focus:ring-oslyn-800"
      >Add Song</button> }
      { p.user ? <CreateJam /> : 
      <button disabled
        className="text-white ml-5 my-2 bg-gray-500 focus:ring-4 focus:outline-none focus:ring-oslyn-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-gray-500 dark:focus:ring-oslyn-800">
        Start Jam
      </button> }
    </div>
  </section>
  <SongTable user={p.user} songs={p.band.songs as Song[] || []} type="own" />
  <div className="mx-5 z-10 relative">
    <p className="mt-8 mb-1 mx-5 text-xs text-gray-500 font-semibold dark:text-gray-400 uppercase">
      Admins
    </p>
  </div>
</div>
}