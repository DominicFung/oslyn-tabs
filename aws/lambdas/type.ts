import { Band, JamSession, JamSong, SetList, Song, User, Participant } from "./API";

export type _User = User & {
  friendIds: string[]
  bandMemberships?: any[]
  editHistory?: any[]
  labelledRecording?: any[]
  songsCreated?: any[]
  likedSongs?: any[]
  friends?: any[]
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
  members?: any[]
  admins?: any[]
}

export type _JamSession = JamSession & {
  userId?: string
  setListId: string
  bandId?: string
  adminIds?: string[]
  memberIds?: string[]
  guestIds?: string[]
  activeIds?: string[]
  queue?: number[]
  revision?: number
}

export type _Participant = Participant & {

}