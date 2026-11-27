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

export const deleteJamSession = /* GraphQL */ `mutation DeleteJamSession($jamSessionId: ID!, $userId: ID!) {
  deleteJamSession(jamSessionId: $jamSessionId, userId: $userId) {
    jamSessionId
  }
}`

export const onJamDeleted = /* GraphQL */ `subscription OnJamDeleted($jamSessionId: ID!) {
  onJamDeleted(jamSessionId: $jamSessionId) {
    jamSessionId
  }
}`

export const onSetJamsDeleted = /* GraphQL */ `subscription OnSetJamsDeleted {
  onSetJamsDeleted {
    setListId
    jamSessionIds
  }
}`

export const ensureJamJoinToken = /* GraphQL */ `mutation EnsureJamJoinToken($jamSessionId: ID!, $userId: ID!) {
  ensureJamJoinToken(jamSessionId: $jamSessionId, userId: $userId) {
    jamSessionId
    joinToken
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

export const createChordImport = /* GraphQL */ `mutation CreateChordImport(
  $userId: ID!
  $songId: ID!
  $jamId: ID!
  $title: String!
  $artist: String
) {
  createChordImport(userId: $userId, songId: $songId, jamId: $jamId, title: $title, artist: $artist) {
    requestId
    userId
    songId
    jamId
    title
    artist
    status
    createdAt
    updatedAt
  }
}`

const importStatusFields = `
    requestId
    userId
    songId
    jamId
    title
    artist
    status
    chosenUrl
    error
    chordSheet`

// Only jamId is an argument. A null userId would tell AppSync to match imports with no user.
export const onImportStatusChanged = /* GraphQL */ `subscription OnImportStatusChanged($jamId: ID!) {
  onImportStatusChanged(jamId: $jamId) {${importStatusFields}
  }
}`

/** Asks for the detected key. Old AppSync schemas reject this field, so the client falls back. */
export const onImportStatusChangedWithKey = /* GraphQL */ `subscription OnImportStatusChanged($jamId: ID!) {
  onImportStatusChanged(jamId: $jamId) {${importStatusFields}
    detectedKey
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

export const getSongUsage = /* GraphQL */ `query GetSongUsage($songId: ID!, $userId: ID!) {
  getSongUsage(songId: $songId, userId: $userId) {
    songId
    setCount
    jamCount
  }
}`

export const deleteSong = /* GraphQL */ `mutation DeleteSong($songId: ID!, $userId: ID!) {
  deleteSong(songId: $songId, userId: $userId) {
    songId
    title
    userId
    setsAffected
    jamsAffected
    jams {
      jamSessionId
      currentSong
      queue
      songIds
    }
  }
}`

export const onSongDeleted = /* GraphQL */ `subscription OnSongDeleted {
  onSongDeleted {
    songId
    title
    userId
    setsAffected
    jamsAffected
    jams {
      jamSessionId
      currentSong
      queue
      songIds
    }
  }
}`

export const removeSongFromJam = /* GraphQL */ `mutation RemoveSongFromJam(
  $jamSessionId: ID!
  $songId: ID!
  $userId: ID!
  $index: Int
) {
  removeSongFromJam(jamSessionId: $jamSessionId, songId: $songId, userId: $userId, index: $index) {
    jamSessionId
    songId
    title
    index
    currentSong
    queue
    songIds
  }
}`

export const onSongRemovedFromJam = /* GraphQL */ `subscription OnSongRemovedFromJam($jamSessionId: ID!) {
  onSongRemovedFromJam(jamSessionId: $jamSessionId) {
    jamSessionId
    songId
    title
    index
    currentSong
    queue
    songIds
  }
}`

export const addSongToSet = /* GraphQL */ `mutation AddSongToSetAuthed($setListId: ID!, $songId: ID!, $key: String) {
  addSongToSet(setListId: $setListId, songId: $songId, key: $key) {
    setListId
    description
  }
}`
