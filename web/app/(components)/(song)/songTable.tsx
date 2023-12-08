"use client"

import Image from "next/image"
import ClickableCell from "@/app/(components)/clikableCell"
import { ArrowDownOnSquareIcon, ArrowDownTrayIcon, ArrowRightOnRectangleIcon, EyeIcon } from "@heroicons/react/24/solid"
import { Song, User } from "@/../src/API"

import Share from "./share"
import { useEffect, useState } from "react"
import { save, createSheet } from "@/core/pdf"

export interface SongTableProps {
  bandId: string,
  user: User|null
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

  const downloadSheet = async (song: Song) => {
    console.log("downloading sheet ...")
    let pdf =  await createSheet(song)
    let uri = await save(pdf)

    const link = document.createElement("a")
    link.download = `${song.title}.pdf`
    link.href = uri
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return <>
    <div className="mt-2 relative overflow-x-auto shadow-md sm:rounded-lg mx-5">
      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
                <th scope="col" className="px-6 py-3 hidden sm:table-cell">
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
                
                  <ClickableCell href={`/songs/edit/${a.songId}?band=${p.bandId}`} className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white hidden sm:table-cell">
                    {i+1}
                  </ClickableCell>
                
                  <ClickableCell href={`/songs/edit/${a.songId}?band=${p.bandId}`} className="px-6 py-4 text-ellipsis">
                    <div className="flex flex-row">
                      { a.albumCover && <div className="m-auto w-16">
                          <Image src={a.albumCover} alt={""} width={40} height={40} className="w-10 m-2"/> 
                        </div>
                      }
                      <div className="flex-0 m-2 w-36 lg:w-full">
                        <div className="dark:text-white text-oslyn-900 bold truncate">{a.title}</div>
                        <div className="text-ellipsis truncate">{a.artist}</div>
                      </div>
                    </div>
                  </ClickableCell>
                  <ClickableCell href={`/songs/edit/${a.songId}?band=${p.bandId}`} className="px-6 py-4 hidden sm:table-cell">
                    {a.chordSheetKey}
                  </ClickableCell>
                  <ClickableCell href={`/songs/edit/${a.songId}?band=${p.bandId}`} className="px-6 py-4 hidden sm:table-cell text-ellipsis">
                    {a.album}
                  </ClickableCell>
                
                <td className="px-6 py-4">
                  <div className="flex flex-row">
                    <a href={`/songs/preview/${a.songId}?band=${p.bandId}`}>
                      <button type="button" className="sm:flex flex-row text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-4 py-2.5 text-center mr-2 mb-2 hidden">
                        <EyeIcon className="w-4 h-4 mt-1" />
                      </button>
                    </a>
                    { p.user && <Share user={p.user} song={a} /> }
                    <button type="button" onClick={() => downloadSheet(a)}
                      className="sm:flex flex-row text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-4 py-2.5 text-center mr-2 mb-2 hidden">
                        <ArrowDownTrayIcon className="w-4 h-4 mt-0.5" />
                    </button>
                  </div>
                </td>
            </tr>)}
        </tbody>
      </table>
    </div>
  </>
}