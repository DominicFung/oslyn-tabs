export interface Session {
  expires: string,
  user: {
    email: string,
    image: string,
    name: string,
    userId: string,
  }
}

export interface SongRequest {
  title: string,
  artist?: string,
  album?: string,
  albumCover?: string,
  arrayBuffer?: Uint8Array,
  chordSheet: string,
  chordSheetKey: string,
  shareWithBand?: string
}