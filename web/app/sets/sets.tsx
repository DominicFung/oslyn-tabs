"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { SetList } from "@/../src/API"
import CreateJamButton from "./(components)/createJam"
import DeleteSetButton from "./(components)/deleteSet"

interface SetsProps {
  sets: SetList[]
}

export default function Sets (p: SetsProps) {
  const [sets, setSets] = useState(p.sets)
  useEffect(() => { setSets(p.sets) }, [p.sets])

  return <div className="mb-5">
    <div className="mt-2 relative overflow-x-auto shadow-md sm:rounded-lg mx-5">
    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
                <th scope="col" className="px-6 py-3">#</th>
                <th scope="col" className="px-6 py-3">Description</th>
                <th scope="col" className="px-6 py-3">Creator</th>
                <th scope="col" className="px-6 py-3">Shared</th>
                <th scope="col" className="px-6 py-3">Action</th>
            </tr>
        </thead>
        <tbody>
            {sets.length === 0 && <tr className="bg-white border-b dark:bg-gray-900 dark:border-gray-700">
              <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-300">You don&apos;t have any sets yet.</td>
            </tr>}
            {sets.map((a, i) => <tr key={a.setListId || i} className="bg-white border-b dark:bg-gray-900 dark:border-gray-700">
                <th className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{i+1}</th>
                <td className="px-6 py-4">
                  <a href={`/sets/edit/${a.setListId}`}>
                    <div className="flex flex-row hover:cursor-pointer">
                      {a.songs?.[0]?.song?.albumCover && <Image src={a.songs[0].song.albumCover} alt={""} width={40} height={40} className="w-10 m-2" unoptimized/> }
                      <div className="m-2">
                        <div className="dark:text-white text-oslyn-900 bold">{a.description}</div>
                      </div>
                    </div>
                  </a>
                </td>
                <td className="px-6 py-4">
                  <span className="font-medium text-gray-600 dark:text-gray-300">
                    {a.creator?.firstName ? a.creator.firstName.charAt(0).toUpperCase():"?"}{a.creator?.lastName ? a.creator.lastName.charAt(0).toUpperCase():"?"}
                  </span>
                </td>
                <td className="px-6 py-4">
                    {!a.editors && <span className="text-gray-400">—</span>}
                    {a.editors && <div>
                      {a.editors.map((e, editorIndex) =>
                          <div key={e?.userId || editorIndex} className="relative inline-flex items-center justify-center w-10 h-10 overflow-hidden bg-gray-100 rounded-full dark:bg-gray-600">
                            <span className="font-medium text-gray-600 dark:text-gray-300">
                              {e?.firstName ? e.firstName.charAt(0).toUpperCase():"?"}{e?.lastName ? e.lastName.charAt(0).toUpperCase():"?"}
                            </span>
                          </div>)}
                    </div>}
                </td>
                <td className="px-6 py-4">
                  <CreateJamButton setListId={a.setListId} />
                  <DeleteSetButton setListId={a.setListId} description={a.description} />
                </td>
            </tr>)}
        </tbody>
      </table>
    </div>
  </div>
}
