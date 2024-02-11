import { ShareBandRequest } from "@/app/api/share/song/route"
import { Song, Band } from "@/../src/API"
import { ShareIcon } from "@heroicons/react/24/solid"

interface SongProps {
 songs: Song[]
 band: Band

 setClose: () => void
}

export default function Songs(p: SongProps) {

  const shareSong = async (song: Song) => {
    if (!song.songId) { console.error("songId should be available"); return }
    if (!p.band.bandId) { console.error("bandId should be available"); return }

    console.log(`${song.title} ==> ${p.band.name}`)

    const data = await (await fetch(`/api/share/song`, {
      method: "POST",
      body: JSON.stringify({
        songId: song.songId, bandId: p.band.bandId
      } as ShareBandRequest)
    })).json() as Band

    console.log(data)
    p.setClose()
  }

  return <>
    <div className="ml-3 text-sm font-normal">
      <div className="pb-2 text-xl font-semibold text-gray-900 dark:text-white">Song</div>
      <div className="pb-3 text-sm font-normal text-gray-800 dark:text-gray-100">Choose a new Song! <br /><span className="text-xs italic">Note: this affects everyone in the session.</span></div> 

      <div className="max-h-[calc(100vh-10rem)] overflow-auto">
        <ul className="max-w-sm md:max-w-xl xl:max-w-2xl divide-y divide-gray-200 dark:divide-gray-700">
          { p.songs.map((e, i) => 
            <li className="max-w-xs md:max-w-md xl:max-w-lg py-3 px-4 my-0.5 sm:pb-4 hover:cursor-pointer hover:bg-oslyn-50 dark:hover:bg-oslyn-800" key={i} onClick={() => { shareSong(e) }}>
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                    {e.albumCover && <img className="w-8 h-8 rounded-full" src={e.albumCover} alt="Neil image" />}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                      {e.title}
                    </p>
                    <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                      {e.artist} | {e.album}
                    </p>
                </div>
                <div className="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white mr-2 pt-2">
                  <button type="button" onClick={() => { shareSong(e) }}
                    className="sm:flex flex-row text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 hidden">
                      <ShareIcon className="w-4 h-4" />
                    </button>
                  </div>
              </div>
            </li>
          )}
        </ul>
      </div>
    </div>
  
  </>
}