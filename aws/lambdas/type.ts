import { Band, JamSession, JamSong, SetList, Song, User } from "./API";

export type _User = User & {
  friendIds: string[]
}

export type _SetList = SetList & {
  userId: string
  songs: _JamSong[]
  editorIds?: string[]
}

export type _JamSong = JamSong & {
  songId: string
}

export type _Song = Song & {
  userId: string
  adminIds?: string[]
  editorIds?: string[]
  viewerIds?: string[]
}

export type _Band = Band & {
  userId: string
  adminIds: string[]
  memberIds?: string[]
  setIds?: string[]
  songIds?: string[]
}

export type _JamSession = JamSession & {
  userId?: string
  setListId: string
  adminIds?: string[]
  activeIds: string[]
}