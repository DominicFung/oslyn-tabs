import { Song, User } from "@/../src/API"
import SongTable from "@/app/(components)/(song)/songTable"

interface SongsProps {
  user: User | null
  ownSongs: Song[]
  sharedSongs: Song[]
}

export default function Songs(p: SongsProps) {
  return <>
    { p.user && <SongTable user={p.user} songs={p.ownSongs} type="own" />}
    <div className="mx-5 z-10 relative">
      <p className="mt-8 mb-1 mx-5 text-xs text-gray-500 font-semibold dark:text-gray-400 uppercase">
        Shared with me:
      </p>
    </div>
    { p.user && <SongTable user={p.user} songs={p.sharedSongs} type="share" /> }
  </>
}
