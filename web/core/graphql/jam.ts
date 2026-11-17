/**
 * Hand-written jam documents. Validated against aws/schema.graphql.
 * searchSongs must not request chordSheet. The live-jam change sends one song, including its chordSheet.
 */

export type JamSongChange = {
  jamSessionId: string
  index: number
  key: string
  jumpTo?: boolean | null
  song: {
    songId: string
    title: string
    artist?: string | null
    album?: string | null
    albumCover?: string | null
    chordSheet?: string | null
    chordSheetKey?: string | null
  }
}

export const searchSongs = /* GraphQL */ `query SearchSongs($userId: ID!, $query: String!) {
  searchSongs(userId: $userId, query: $query) {
    songId
    title
    artist
    album
    albumCover
    chordSheetKey
  }
}`

export const jamAccess = /* GraphQL */ `query JamAccess($jamSessionId: ID!, $userId: ID) {
  getJamSession(jamSessionId: $jamSessionId, userId: $userId) {
    jamSessionId
    hostId
    canEditSongs
  }
}`

export const createEmptySet = /* GraphQL */ `mutation CreateEmptySet($userId: ID!, $description: String!, $songs: [JamSongInput]!) {
  createSet(userId: $userId, description: $description, songs: $songs) {
    setListId
    description
  }
}`

export const createPrivateJam = /* GraphQL */ `mutation CreatePrivateJam($setListId: ID!, $userId: ID!, $policy: policy) {
  createJamSession(setListId: $setListId, userId: $userId, policy: $policy) {
    jamSessionId
    policy
    setList {
      setListId
      description
    }
  }
}`

export const addSongToLiveJam = /* GraphQL */ `mutation AddSongToLiveJam(
  $jamSessionId: ID!
  $songId: ID!
  $key: String!
  $userId: ID!
  $jumpTo: Boolean
) {
  addSongToLiveJam(
    jamSessionId: $jamSessionId
    songId: $songId
    key: $key
    userId: $userId
    jumpTo: $jumpTo
  ) {
    jamSessionId
    index
    key
    jumpTo
    song {
      songId
      title
      artist
      album
      albumCover
      chordSheet
      chordSheetKey
    }
  }
}`

export const onJamSongsChanged = /* GraphQL */ `subscription OnJamSongsChanged($jamSessionId: ID!) {
  onJamSongsChanged(jamSessionId: $jamSessionId) {
    jamSessionId
    index
    key
    jumpTo
    song {
      songId
      title
      artist
      album
      albumCover
      chordSheet
      chordSheetKey
    }
  }
}`

export const setJamQueue = /* GraphQL */ `mutation SetJamQueue(
  $jamSessionId: ID!
  $queue: [Int!]!
  $expectedRevision: Int
  $currentSongIndex: Int
) {
  setJamQueue(
    jamSessionId: $jamSessionId
    queue: $queue
    expectedRevision: $expectedRevision
    currentSongIndex: $currentSongIndex
  ) {
    jamSessionId
    queue
    revision
    currentSongIndex
  }
}`

export const onJamQueueUpdate = /* GraphQL */ `subscription OnJamQueueUpdate($jamSessionId: ID!) {
  onJamQueueUpdate(jamSessionId: $jamSessionId) {
    jamSessionId
    queue
    revision
    currentSongIndex
  }
}`

export const searchSpotifyTracks = /* GraphQL */ `query SearchSpotifyTracks($userId: ID!, $term: String!, $limit: Int) {
  searchSpotifyTracks(userId: $userId, term: $term, limit: $limit) {
    error
    tracks {
      spotifyId
      title
      artist
      album
      albumCover
    }
  }
}`

export const createSongFromSpotify = /* GraphQL */ `mutation CreateSongFromSpotify(
  $title: String!
  $userId: ID!
  $artist: String
  $album: String
  $albumCover: String
  $chordSheet: String!
  $chordSheetKey: String!
  $spotifyId: String
  $originPlatorm: chordSheetPlatform
) {
  createSong(
    title: $title
    userId: $userId
    artist: $artist
    album: $album
    albumCover: $albumCover
    chordSheet: $chordSheet
    chordSheetKey: $chordSheetKey
    spotifyId: $spotifyId
    originPlatorm: $originPlatorm
  ) {
    songId
    title
    artist
    album
    spotifyId
  }
}`

export const setLiveJamChordSheet = /* GraphQL */ `mutation SetLiveJamChordSheet(
  $jamSessionId: ID!
  $songId: ID!
  $userId: ID!
  $chordSheet: String!
  $chordSheetKey: String
  $originLink: String
) {
  setLiveJamChordSheet(
    jamSessionId: $jamSessionId
    songId: $songId
    userId: $userId
    chordSheet: $chordSheet
    chordSheetKey: $chordSheetKey
    originLink: $originLink
  ) {
    jamSessionId
    index
    key
    jumpTo
    song {
      songId
      title
      artist
      album
      albumCover
      chordSheet
      chordSheetKey
      spotifyId
    }
  }
}`

export const createSongForLibrary = /* GraphQL */ `mutation CreateSongForLibrary(
  $title: String!
  $userId: ID!
  $artist: String
  $chordSheet: String!
  $chordSheetKey: String!
  $originPlatorm: chordSheetPlatform
  $originLink: String
) {
  createSong(
    title: $title
    userId: $userId
    artist: $artist
    chordSheet: $chordSheet
    chordSheetKey: $chordSheetKey
    originPlatorm: $originPlatorm
    originLink: $originLink
  ) {
    songId
    title
    artist
    chordSheetKey
    originPlatorm
    originLink
  }
}`

export const getSetForAdd = /* GraphQL */ `query GetSetForAdd($setListId: ID!, $userId: ID!) {
  getSet(setListId: $setListId, userId: $userId) {
    setListId
    description
  }
}`

export const addSongToSet = /* GraphQL */ `mutation AddSongToSetAuthed($setListId: ID!, $songId: ID!, $key: String) {
  addSongToSet(setListId: $setListId, songId: $songId, key: $key) {
    setListId
    description
  }
}`
