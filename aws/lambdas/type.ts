import { Band, JamSession, JamSong, SetList, Song, User, Participant } from "./API";

export type _User = User & {
  friendIds: string[]
  bandIds: string[]
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
  memberIds?: string[]
  guestIds?: string[]
  activeIds?: string[]
}

export type _Participant = Participant & {

}