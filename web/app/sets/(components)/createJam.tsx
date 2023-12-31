"use client"

import { JamRequest } from "@/app/api/jam/create/route"
import { JamSession } from "@/../src/API"
import { PlusIcon } from "@heroicons/react/24/solid"
import { useRouter } from "next/navigation"

export interface CreateJamButtonProps {
  setListId: string
}

export default function CreateJamButton (p: CreateJamButtonProps) {
  const router = useRouter()

  const createJam = async (setListId: string) => {
    console.log(`create jam for ${setListId}`)

    const data = await (await fetch(`/api/jam/create`, {
      method: "POST",
      body: JSON.stringify({ setListId } as JamRequest)
    })).json() as JamSession
    console.log(data)

    router.push(`/jam/${data.jamSessionId}`)
  }

  return <>
    <button type="button" onClick={() => createJam(p.setListId)}
      className="flex flex-row text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2"
    >
      Create Jam <PlusIcon className="mt-0.5 ml-2 w-4 h-4" />
    </button>
  </>
}