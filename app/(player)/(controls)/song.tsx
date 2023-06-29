import { JamSong, Song } from "@/src/API"

interface SongProps {
  song: number
  setSong: (n: number) => void

  songs: JamSong[]
}

export default function Song(p: SongProps) {
  return <div className="ml-3 text-sm font-normal">
    <div className="pb-2 text-xl font-semibold text-gray-900 dark:text-white">Song</div>
    <div className="pb-3 text-sm font-normal">Choose a new Song! <br /><span className="text-xs italic">Note: this affects everyone in the session.</span></div> 

    <div className="max-h-[calc(100vh-10rem)] overflow-auto">
      <ul className="max-w-md divide-y divide-gray-200 dark:divide-gray-700">
        { p.songs.map((e, i) => 
          <li className="max-w-xs py-3 px-4 my-0.5 sm:pb-4 hover:cursor-pointer hover:bg-oslyn-800" key={i} onClick={() => { console.log("clicked"); p.setSong(i) }}>
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
            </div>
          </li>
        )}
      </ul>
    </div>
  </div>
}