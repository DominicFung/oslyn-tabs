"use client"

import Image from "next/image"
import ClickableCell from "../(components)/clikableCell"
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/solid"
import { Song, User } from "@/src/API"

import Share from "./(edit)/(components)/share"
import { useEffect, useState } from "react"

export interface SongTableProps {
  user: User
  songs?: Song[]
  type: "own" | "share"
}

export default function SongTable(p: SongTableProps) {

  const [songs, setSongs] = useState<Song[]>([])

  const listShared = async () => {
    const shared = await (await fetch(`/api/song/shared`, {
      method: "GET",
    })).json() as Song[]
    console.log(shared)

    setSongs(shared)
  }

  useEffect(() => { 
    if (p.songs != undefined) { setSongs(p.songs) } 
    else { listShared() }
  }, [p.songs])

  return <>
    <div className="mt-2 relative overflow-x-auto shadow-md sm:rounded-lg mx-5">
      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
                <th scope="col" className="px-6 py-3">
                    #
                </th>
                <th scope="col" className="px-6 py-3">
                    Title
                </th>
                <th scope="col" className="px-6 py-3 hidden sm:table-cell">
                    Key
                </th>
                <th scope="col" className="px-6 py-3 hidden sm:table-cell">
                    Album
                </th>
                <th scope="col" className="px-6 py-3">
                    Action
                </th>
            </tr>
        </thead>
        <tbody>
            {songs.map((a, i) => <tr key={i} className="bg-white border-b dark:bg-gray-900 dark:border-gray-700">
                
                  <ClickableCell href={`/songs/edit/${a.songId}`} className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                    {i+1}
                  </ClickableCell>
                
                  <ClickableCell href={`/songs/edit/${a.songId}`} className="px-6 py-4 text-ellipsis">
                    <div className="flex flex-row">
                      { a.albumCover && <div className="m-auto w-16">
                          <Image src={a.albumCover} alt={""} width={40} height={40} className="w-10 m-2"/> 
                        </div>
                      }
                      <div className="flex-0 m-2 w-36 lg:w-full">
                        <div className="text-white bold truncate">{a.title}</div>
                        <div className="text-ellipsis truncate">{a.artist}</div>
                      </div>
                    </div>
                  </ClickableCell>
                  <ClickableCell href={`/songs/edit/${a.songId}`} className="px-6 py-4 hidden sm:table-cell">
                    {a.chordSheetKey}
                  </ClickableCell>
                  <ClickableCell href={`/songs/edit/${a.songId}`} className="px-6 py-4 hidden sm:table-cell text-ellipsis">
                    {a.album}
                  </ClickableCell>
                
                <td className="px-6 py-4">
                  <div className="flex flex-row">
                    <a href={`/songs/preview/${a.songId}`}>
                      <button type="button" className="flex flex-row text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2">
                        <span className='text-md pt-0.5'>Preview</span>
                        <ArrowRightOnRectangleIcon className="ml-2 w-4 h-4 mt-1" />
                      </button>
                    </a>
                    { p.user && <Share user={p.user} song={a} /> }
                  </div>
                </td>
            </tr>)}
        </tbody>
      </table>
    </div>
  </>
}