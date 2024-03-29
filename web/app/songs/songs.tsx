"use client"

import { Song, User } from "@/../src/API"
import SongTable from "@/app/(components)/(song)/songTable"
import { useSideBarContext } from "../context"
import NewFeature from "../(components)/new"

interface SongsProps {
  user: User | null
  ownSongs: Song[]
  sharedSongs: Song[]
}

export default function Songs(p: SongsProps) {
  const { openSidebar } = useSideBarContext()

  return <div className={`${openSidebar?"min-w-[640px]":""}`}>
  <section className="bg-[url('https://flowbite.s3.amazonaws.com/docs/jumbotron/hero-pattern.svg')] dark:bg-[url('https://flowbite.s3.amazonaws.com/docs/jumbotron/hero-pattern-dark.svg')]">
    <div className="lg:pt-16 lg:pb-4 pt-8 pb-2 px-4 mx-auto max-w-screen-xl text-center lg:py-16 z-10 relative">
        <NewFeature />
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight leading-none text-gray-900 md:text-5xl lg:text-6xl dark:text-white">{p.user?.username ? `${p.user.username}'s` : "Your"} Songs</h1>
        <p className="mb-8 text-lg font-normal text-gray-500 lg:text-xl sm:px-16 lg:px-48 dark:text-gray-200">
          These are all the song&apos;s you&apos;ve added. Share them with your friends!
        </p>
    </div>
    <div className="flex flex-row-reverse z-10 relative">
      <a href="/songs/create">
        <button type="submit" className="text-white mx-5 my-2 bg-oslyn-700 hover:bg-oslyn-800 focus:ring-4 focus:outline-none focus:ring-oslyn-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-oslyn-600 dark:hover:bg-oslyn-700 dark:focus:ring-oslyn-800">Add Song</button>
      </a>
    </div>
  </section>
  { p.user && <SongTable user={p.user} songs={p.ownSongs} type="own" />}
  <div className="mx-5 z-10 relative">
    <p className="mt-8 mb-1 mx-5 text-xs text-gray-500 font-semibold dark:text-gray-400 uppercase">
      Shared with me:
    </p>
  </div>
  { p.user && <SongTable user={p.user} songs={p.sharedSongs} type="share" /> }
</div>
}