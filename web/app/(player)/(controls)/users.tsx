"use client"

import { getUsernameInitials } from "@/core/utils/frontend";
import { Participant } from "@/../src/API"
import { XMarkIcon } from "@heroicons/react/24/solid";

export interface UsersProps {
  users: (Participant)[]
  removeUser: (userId: string) => void
}

export default function Users(p: UsersProps) {
  return <>
    <div className="ml-3 text-sm font-normal overflow-auto">
      <div className="pb-2 text-xl font-semibold text-gray-900 dark:text-white">Active Users</div>
      <div className="pb-3 text-sm font-normal">Use this to monitor active users.</div> 

      <div className="max-h-[calc(100vh-10rem)]">
      <ul className="max-w-md divide-y divide-gray-200 dark:divide-gray-700">
        { p.users.map((e, i) => {
          if (e.participantType === "GUEST") {
            return <li className="max-w-xs py-3 px-4 my-0.5 sm:pb-4 hover:cursor-pointer hover:bg-oslyn-50 dark:hover:bg-oslyn-800" key={i} onClick={() => { console.log("clicked"); p.removeUser(e.userId) }}>
                  <div className="flex items-center space-x-4">
                    <div className={`pt-1.5 w-8 h-8 rounded-full bg-${e.colour}-500 text-center`}>
                      <span className="font-xl text-gray-600 dark:text-gray-300">{getUsernameInitials(e.username || "")}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                          {e.username} <span className="italic text-xs">(guest)</span>
                        </p>
                        <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                          {e.userId}
                        </p>
                    </div>
                    <div className="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white mr-2">
                      <XMarkIcon />
                    </div>
                  </div>
                </li>
          }

          console.log(e)
          if (e.user) {
            return <li className="max-w-xs py-3 px-4 my-0.5 sm:pb-4 hover:cursor-pointer hover:bg-oslyn-50 dark:hover:bg-oslyn-800" key={i} onClick={() => { console.log("clicked"); p.removeUser(e.userId) }}>
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                        {e.user.imageUrl && <img className="w-8 h-8 rounded-full" src={e.user.imageUrl} alt="Neil image" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                          {e.user.username}
                        </p>
                        <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                          {e.user.email}
                        </p>
                    </div>
                    <div className="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white mr-2">
                      <XMarkIcon />
                    </div>
                  </div>
                </li>
          }
        })}
      </ul>
    </div>

    </div>
  </>
}