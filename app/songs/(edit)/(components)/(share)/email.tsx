"use client"

import { ArrowsUpDownIcon } from "@heroicons/react/24/solid"
import { Listbox, Transition } from '@headlessui/react'
import { Fragment, useState } from "react"
import { User, Song } from "@/src/API"
import { InviteRequest } from "@/app/api/invite/create/route"

const permissions = [ "Admin", "Edit", "View" ]

interface EmailProps {
  user: User,
  song: Song,

  setClose: () => void
}

export default function Email(p: EmailProps) {
  const [ email, setEmail ] = useState("")
  const [ permission, setPermission ] = useState("edit")

  const share = async () => {
    if (!p.user.userId) { console.error("userId should be available"); return }
    if (!p.song.songId) { console.error("songId should be available"); return }

    const data = await (await fetch(`/api/invite/create`, {
      method: "POST",
      body: JSON.stringify({
        songId: p.song.songId, shareWithEmail: email, access: permission
      } as InviteRequest)
    })).json() as Song

    console.log(data)
    p.setClose()
  }

  return <>
    <div className="px-6 py-6 lg:px-8">
      <h3 className="mb-4 text-xl font-medium text-gray-900 dark:text-white">Share</h3>
      <span className="space-y-6">
          <div>
            <label htmlFor="link" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Friend&apos;s Email</label>
            <input type="email" name="link" id="link" value={email} onChange={(e) => { setEmail(e.currentTarget.value) }}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white" placeholder="john.doe@example.com" 
              required />
          </div>

          <div className='flex-0'>
        <Listbox as="div" value={permission} onChange={(e) => { setPermission(e)}} className="relative p-1 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500">
        {({ open }) => (
          <>
          <Listbox.Button className="relative w-full min-w-0 inline-flex items-center appearance-none focus:outline-none h-9 px-3 py-0 text-sm rounded-base pr-6 cursor-base shadow-sm text-neutral-900 dark:text-neutral-100 dark:bg-base dark:hover:border-neutral-600">
            <span className="p-1 px-4 text-sm truncate">{permission}</span>
            <span className="absolute flex items-center ml-3 pointer-events-none right-1">
            <ArrowsUpDownIcon
              className={`"w-4 h-4 ${open ? "text-blue-500" : "text-gray-400"}`}
            />
          </span>
          </Listbox.Button>
          <Transition
            show={open}
            as={Fragment}
            enter="transition ease-in-out duration-100"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition ease-out duration-75"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options static
              className="absolute left-0 z-40 max-h-64 w-full mt-2 origin-top-left rounded-base shadow-sm outline-none overflow-auto border border-gray-200 dark:bg-neutral-800 dark:border-gray-700 py-1.5 px-1.5 space-y-1"
            >
              {permissions.map((permission) => (
                <Listbox.Option
                  className="relative"
                  key={permission}
                  value={permission}
                >
                  {({ active, selected, disabled }) => (
                    <button
                      disabled={disabled}
                      aria-disabled={disabled}
                      className={`flex items-center w-full px-4 pl-4 h-9 border-0 flex-shrink-0 text-sm text-left cursor-base font-normal focus:outline-none rounded-base
                        ${active && "bg-neutral-100 dark:bg-neutral-700"}
                        ${selected && "bg-blue-50 text-blue-800 dark:bg-blue-200 dark:bg-opacity-15 dark:text-blue-200"}`}
                    >
                      <span
                        className={`flex-1 block truncate ${selected ? "font-semibold" : "font-normal"}`}
                      >
                        {permission}
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
          
          <button onClick={share}
            className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Share</button>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-300">
              How do I get a link? <a href="#" className="text-blue-700 hover:underline dark:text-blue-500">Instructions</a>
          </div>
      </span>
    </div>
  </>
}