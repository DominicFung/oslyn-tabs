/**
 * Hand-written list documents. Detail pages keep the generated queries in src/graphql.
 * These selections are the fields the list UI renders: no chordSheet, recordings,
 * songsCreated, or nested friends.
 */

export const listSongs = /* GraphQL */ `query ListSongs($userId: ID!) {
  listSongs(userId: $userId) {
    songId
    title
    artist
    album
    albumCover
    chordSheetKey
  }
}`

export const listSharedSongs = /* GraphQL */ `query ListSharedSongs($userId: ID!, $optimize: Boolean) {
  listSharedSongs(userId: $userId, optimize: $optimize) {
    songId
    title
    artist
    album
    albumCover
    chordSheetKey
  }
}`

export const getUserForLists = /* GraphQL */ `query GetUserForLists($userId: ID!) {
  getUserById(userId: $userId) {
    userId
    username
    email
    firstName
    lastName
    imageUrl
    bands {
      bandId
      name
      imageUrl
    }
  }
}`

export const listBands = /* GraphQL */ `query ListBands($userId: ID!) {
  listBands(userId: $userId) {
    bandId
    name
    description
    imageUrl
    policy
    songs {
      songId
      title
      artist
      album
      albumCover
      chordSheetKey
    }
  }
}`

export const listSets = /* GraphQL */ `query ListSets($userId: ID!) {
  listSets(userId: $userId) {
    setListId
    description
    creator {
      userId
      firstName
      lastName
    }
    editors {
      userId
      firstName
      lastName
    }
    songs {
      song {
        songId
        albumCover
      }
    }
  }
}`

export const listPublicJamSessions = /* GraphQL */ `query ListPublicJamSessions {
  listPublicJamSessions {
    jamSessionId
    description
    policy
    startDate
    setList {
      setListId
      description
    }
    active {
      userId
      user {
        userId
        imageUrl
      }
    }
  }
}`

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
    active {
      userId
      user {
        userId
        imageUrl
      }
    }
  }
}`

export const listPublicBands = /* GraphQL */ `query ListPublicBands {
  listPublicBands {
    bandId
    name
    description
    imageUrl
  }
}`

export const countJamsForSet = /* GraphQL */ `query CountJamsForSet($setListId: ID!, $userId: ID!) {
  countJamsForSet(setListId: $setListId, userId: $userId)
}`

export const deleteSet = /* GraphQL */ `mutation DeleteSet($setListId: ID!, $userId: ID!) {
  deleteSet(setListId: $setListId, userId: $userId) {
    setListId
    deleted
    jamsRemoved
  }
}`

export const getSongForSheet = /* GraphQL */ `query GetSongForSheet($songId: ID!, $userId: ID!, $bandId: ID) {
  getSong(songId: $songId, userId: $userId, bandId: $bandId) {
    songId
    title
    artist
    chordSheet
    chordSheetKey
  }
}`
