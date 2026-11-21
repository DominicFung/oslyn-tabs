/**
 * Documents the extension sends. Validated by web/scripts/validate-list-queries.cjs.
 */

export const listUserJamSessions = /* GraphQL */ `query ListUserJamSessions($userId: ID!) {
  listUserJamSessions(userId: $userId) {
    jamSessionId
    description
    policy
    startDate
    setList {
      setListId
      description
    }
  }
}`

export const createImportedSong = /* GraphQL */ `mutation CreateImportedSong(
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

// JamSongChange.key is non-null. AppSync forwards only this selection set to
// onJamSongsChanged, so a missing key makes every open jam reject the update.
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
    }
  }
}`
