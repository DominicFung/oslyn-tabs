"use client"

import { ArrowUturnDownIcon } from "@heroicons/react/24/solid"

interface RevertProps {
  oldChordSheet: string,
  newChordSheet: string
  setChordSheet: (s: string ) => void
}

export default function Revert(p: RevertProps) {
  return <>
  { p.oldChordSheet && p.newChordSheet && <div id="toast-bottom-right" className="fixed flex items-center w-50 p-4 space-x-4 text-gray-500 bg-white divide-x divide-gray-200 rounded-lg shadow right-5 bottom-5 dark:text-gray-400 dark:divide-gray-700 space-x dark:bg-gray-800" role="alert">
        <div className="text-sm font-normal">
          <div className="flex">
            <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-oslyn-500 bg-oslyn-100 rounded-lg dark:text-oslyn-300 dark:bg-oslyn-900">
              <ArrowUturnDownIcon className="w-5 h-5" />
            </div>
            <div className="ml-3 text-sm font-normal max-w-sm">
              <span className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">Did it work?</span>
              <div className="mb-2 text-sm font-normal">We just used ChatGPT and Spotify to auto populate the rest of the chord sheet! We are aware, it sometimes messes up. You can revert below.</div> 
              <div className="grid grid-cols-2 gap-2">
                  <div>
                      <button onClick={() => p.setChordSheet(p.newChordSheet)}
                        className="inline-flex justify-center w-full px-2 py-1.5 text-xs font-medium text-center text-white bg-oslyn-600 rounded-lg hover:bg-oslyn-700 focus:ring-4 focus:outline-none focus:ring-oslyn-300 dark:bg-oslyn-500 dark:hover:bg-oslyn-600 dark:focus:ring-oslyn-800 disabled:bg-gray-600">
                          Looks Good!
                      </button>
                  </div>
                  <div>
                      <button onClick={() => p.setChordSheet(p.newChordSheet)}
                        className="inline-flex justify-center w-full px-2 py-1.5 text-xs font-medium text-center text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 dark:bg-gray-600 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-700 dark:focus:ring-gray-700">
                          Revert
                      </button> 
                  </div>
              </div>    
            </div>
            <button type="button" className="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700" data-dismiss-target="#toast-interactive" aria-label="Close"
              onClick={() => p.setChordSheet(p.newChordSheet)}
            >
              <span className="sr-only">Close</span>
              <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
            </button>
          </div>
        </div>
    </div>
  }
  </>
}