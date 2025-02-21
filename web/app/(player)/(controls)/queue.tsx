import { JamSong } from "@/../src/API";

interface QueueProps {
  songs: JamSong[],
  queue: (number|null)[]
  removeFromQueue: (index: number) => void
}

import { MinusIcon } from "@heroicons/react/24/solid";

export default function SongControl(p: QueueProps) {
  return <div className="ml-3 text-sm font-normal w-full">
  <div className="pb-2 text-xl font-semibold text-gray-900 dark:text-white">Queued Songs</div>
  <div className="pb-3 text-sm font-normal">These are the songs currently queued up! <br /><span className="text-xs italic">Note: this affects everyone in the session.</span></div> 

  <div className="max-h-[calc(100vh-14rem)] overflow-auto w-full">
    <ul className="divide-y divide-gray-200 dark:divide-gray-700 w-full">
      { p.queue.map((a, i) => {
        if (a === null) return <></>
        let e = p.songs[a]

        return <li className="max-w-sm py-3 px-4 my-0.5 sm:pb-4" key={i}>
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
                {e.song.albumCover && <img className="w-8 h-8 rounded-full" src={e.song.albumCover} alt="Neil image" />}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                  {e.song.title}
                </p>
                <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                  {e.song.artist} | {e.song.album}
                </p>
            </div>
            <div className="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white mr-2">
              {e.key}
            </div>
            <div className="flex-0 min-w-0">
            <button type="button" onClick={() => { console.log(`remove "${e.song.title}", index: ${i} from queue`); p.removeFromQueue(i)}} 
                className="sm:flex flex-row text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-4 py-2.5 text-center mx-2 hidden">
              <MinusIcon className="w-4 h-4 mt-1" />
            </button>
            </div>
          </div>
        </li>
      })}
    </ul>
  </div>
</div>
}