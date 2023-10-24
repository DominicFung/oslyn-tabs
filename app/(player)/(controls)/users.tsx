"use client"

import { User } from "@/src/API"
import { XMarkIcon } from "@heroicons/react/24/solid";

export interface UsersProps {
  users: (User|string)[]
  removeUser: (userId: string) => void
}

export default function Users(p: UsersProps) {
  return <>
    <div className="ml-3 text-sm font-normal">
      <div className="pb-2 text-xl font-semibold text-gray-900 dark:text-white">Active Users</div>
      <div className="pb-3 text-sm font-normal">Use this to monitor active users.</div> 

      <div className="max-h-[calc(100vh-10rem)] overflow-auto">
      <ul className="max-w-md divide-y divide-gray-200 dark:divide-gray-700">
        { p.users.map((u, i) => {
          if (typeof u === "string") {
            return <li className="max-w-xs py-3 px-4 my-0.5 sm:pb-4 hover:cursor-pointer hover:bg-oslyn-50 dark:hover:bg-oslyn-800" key={i} onClick={() => { console.log("clicked"); p.removeUser(e.userId) }}>
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <span className="font-medium text-gray-600 dark:text-gray-300">JL</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                          {e.username}
                        </p>
                        <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                          {e.email}
                        </p>
                    </div>
                    <div className="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white mr-2">
                      <XMarkIcon />
                    </div>
                  </div>
                </li>

          }

          let e = u as User
          return <li className="max-w-xs py-3 px-4 my-0.5 sm:pb-4 hover:cursor-pointer hover:bg-oslyn-50 dark:hover:bg-oslyn-800" key={i} onClick={() => { console.log("clicked"); p.removeUser(e.userId) }}>
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                        {e.imageUrl && <img className="w-8 h-8 rounded-full" src={e.imageUrl} alt="Neil image" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                          {e.username}
                        </p>
                        <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                          {e.email}
                        </p>
                    </div>
                    <div className="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white mr-2">
                      <XMarkIcon />
                    </div>
                  </div>
                </li>
        })}
      </ul>
    </div>

    </div>
  </>
}