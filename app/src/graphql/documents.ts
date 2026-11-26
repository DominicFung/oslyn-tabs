/**
 * Hand-written selections. The generated documents pull chord sheets, recordings,
 * and nested friends. A list of rooms does not need those, and a null non-null
 * child makes Amplify reject the whole response.
 */

export const listPublicJamSessions = /* GraphQL */ `query ListPublicJamSessions {
  listPublicJamSessions {
    jamSessionId
    description
    policy
    startDate
    endDate
    setList { setListId description }
    active { userId user { userId imageUrl } }
  }
}`

export const listUserJamSessions = /* GraphQL */ `query ListUserJamSessions($userId: ID!) {
  listUserJamSessions(userId: $userId) {
    jamSessionId
    description
    policy
    startDate
    endDate
    setList { setListId description }
    active { userId user { userId imageUrl } }
  }
}`

export const listPublicBands = /* GraphQL */ `query ListPublicBands {
  listPublicBands { bandId name description imageUrl }
}`

export const getJamSessionForPlayer = /* GraphQL */ `query GetJamSessionForPlayer($jamSessionId: ID!, $userId: ID, $joinToken: String) {
  getJamSession(jamSessionId: $jamSessionId, userId: $userId, joinToken: $joinToken) {
    jamSessionId
    hostId
    canEditSongs
    revision
    description
    policy
    currentSong
    currentPage
    slideTextSize
    queue
    active { userId participantType username colour user { userId username imageUrl } }
    setList {
      setListId
      description
      songs {
        key
        order
        song { songId title artist album albumCover chordSheet chordSheetKey }
      }
    }
  }
}`

export const getUserById = /* GraphQL */ `query GetUserById($userId: ID!) {
  getUserById(userId: $userId) {
    userId username email firstName lastName imageUrl
    friends { userId username email imageUrl role }
    bands { bandId name imageUrl }
  }
}`

export const listSongs = /* GraphQL */ `query ListSongs($userId: ID!) {
  listSongs(userId: $userId) { songId title artist album albumCover chordSheetKey }
}`

export const listSharedSongs = /* GraphQL */ `query ListSharedSongs($userId: ID!, $optimize: Boolean) {
  listSharedSongs(userId: $userId, optimize: $optimize) { songId title artist album albumCover chordSheetKey }
}`

export const searchSongs = /* GraphQL */ `query SearchSongs($userId: ID!, $query: String!) {
  searchSongs(userId: $userId, query: $query) { songId title artist album albumCover chordSheetKey }
}`

export const getSongForSheet = /* GraphQL */ `query GetSongForSheet($songId: ID!, $userId: ID!) {
  getSong(songId: $songId, userId: $userId) {
    songId title artist album albumCover chordSheet chordSheetKey originPlatorm originLink
  }
}`

export const getSongUsage = /* GraphQL */ `query GetSongUsage($songId: ID!, $userId: ID!) {
  getSongUsage(songId: $songId, userId: $userId) { songId setCount jamCount }
}`

export const createSong = /* GraphQL */ `mutation CreateSong(
  $title: String!
  $userId: ID!
  $artist: String
  $album: String
  $albumCover: String
  $chordSheet: String!
  $chordSheetKey: String!
  $originPlatorm: chordSheetPlatform
  $originLink: String
  $spotifyId: String
  $shareWithBand: ID
) {
  createSong(
    title: $title
    userId: $userId
    artist: $artist
    album: $album
    albumCover: $albumCover
    chordSheet: $chordSheet
    chordSheetKey: $chordSheetKey
    originPlatorm: $originPlatorm
    originLink: $originLink
    spotifyId: $spotifyId
    shareWithBand: $shareWithBand
  ) { songId title artist chordSheetKey }
}`

export const updateSong = /* GraphQL */ `mutation UpdateSong(
  $songId: ID!
  $userId: ID!
  $title: String
  $artist: String
  $album: String
  $albumCover: String
  $chordSheet: String
  $chordSheetKey: String
  $originalLink: String
) {
  updateSong(
    songId: $songId
    userId: $userId
    title: $title
    artist: $artist
    album: $album
    albumCover: $albumCover
    chordSheet: $chordSheet
    chordSheetKey: $chordSheetKey
    originalLink: $originalLink
  ) { songId title }
}`

export const deleteSong = /* GraphQL */ `mutation DeleteSong($songId: ID!, $userId: ID!) {
  deleteSong(songId: $songId, userId: $userId) { songId title setsAffected jamsAffected }
}`

export const shareSong = /* GraphQL */ `mutation ShareSong($songId: ID!, $userId: ID!, $shareWithEmail: AWSEmail!, $access: access!) {
  shareSong(songId: $songId, userId: $userId, shareWithEmail: $shareWithEmail, access: $access) { songId title }
}`

export const shareSongWithBand = /* GraphQL */ `mutation ShareSongWithBand($bandId: ID!, $songId: ID!, $userId: ID!) {
  shareSongWithBand(bandId: $bandId, songId: $songId, userId: $userId) { bandId name }
}`

export const searchSpotifyTracks = /* GraphQL */ `query SearchSpotifyTracks($userId: ID!, $term: String!, $limit: Int) {
  searchSpotifyTracks(userId: $userId, term: $term, limit: $limit) {
    error
    tracks { spotifyId title artist album albumCover }
  }
}`

export const createSet = /* GraphQL */ `mutation CreateSet($userId: ID!, $description: String!, $songs: [JamSongInput]!, $bandId: ID) {
  createSet(userId: $userId, description: $description, songs: $songs, bandId: $bandId) { setListId description }
}`

export const updateSet = /* GraphQL */ `mutation UpdateSet($setListId: ID!, $description: String, $songs: [JamSongInput], $userId: ID) {
  updateSet(setListId: $setListId, description: $description, songs: $songs, userId: $userId) { setListId description }
}`

export const getSet = /* GraphQL */ `query GetSet($setListId: ID!, $userId: ID!) {
  getSet(setListId: $setListId, userId: $userId) {
    setListId
    description
    songs { key order song { songId title artist chordSheetKey } }
  }
}`

export const listSets = /* GraphQL */ `query ListSets($userId: ID!) {
  listSets(userId: $userId) {
    setListId
    description
    creator { userId firstName lastName }
    editors { userId firstName lastName }
    songs { song { songId albumCover } }
  }
}`

export const deleteSet = /* GraphQL */ `mutation DeleteSet($setListId: ID!, $userId: ID!) {
  deleteSet(setListId: $setListId, userId: $userId) { setListId deleted jamsRemoved }
}`

export const countJamsForSet = /* GraphQL */ `query CountJamsForSet($setListId: ID!, $userId: ID!) {
  countJamsForSet(setListId: $setListId, userId: $userId)
}`

export const createJamSession = /* GraphQL */ `mutation CreateJamSession($setListId: ID!, $userId: ID!, $policy: policy, $description: String, $bandId: ID) {
  createJamSession(setListId: $setListId, userId: $userId, policy: $policy, description: $description, bandId: $bandId) {
    jamSessionId
    policy
    description
  }
}`

export const deleteJamSession = /* GraphQL */ `mutation DeleteJamSession($jamSessionId: ID!, $userId: ID!) {
  deleteJamSession(jamSessionId: $jamSessionId, userId: $userId) { jamSessionId }
}`

export const createChordImport = /* GraphQL */ `mutation CreateChordImport($userId: ID!, $songId: ID!, $jamId: ID!, $title: String!, $artist: String) {
  createChordImport(userId: $userId, songId: $songId, jamId: $jamId, title: $title, artist: $artist) { requestId status }
}`

export const listBands = /* GraphQL */ `query ListBands($userId: ID!) {
  listBands(userId: $userId) { bandId name description imageUrl policy }
}`

export const listSharedBands = /* GraphQL */ `query ListSharedBands($userId: ID!) {
  listSharedBands(userId: $userId) { roleId role band { bandId name description imageUrl } }
}`

export const getBand = /* GraphQL */ `query GetBand($bandId: ID!, $userId: ID) {
  getBand(bandId: $bandId, userId: $userId) {
    bandId name description imageUrl policy
    songs { songId title artist albumCover chordSheetKey }
  }
}`

export const createBand = /* GraphQL */ `mutation CreateBand($userId: ID!, $name: String!, $description: String!, $imageUrl: String, $policy: String) {
  createBand(userId: $userId, name: $name, description: $description, imageUrl: $imageUrl, policy: $policy) { bandId name }
}`

export const updateBand = /* GraphQL */ `mutation UpdateBand($bandId: ID!, $imageUrl: String, $policy: String) {
  updateBand(bandId: $bandId, imageUrl: $imageUrl, policy: $policy) { bandId policy }
}`

export const addFriendByEmail = /* GraphQL */ `mutation AddFriendByEmail($userId: ID!, $email: AWSEmail!) {
  addFriendByEmail(userId: $userId, email: $email) { userId }
}`

export const removeFriendById = /* GraphQL */ `mutation RemoveFriendById($userId: ID!, $friendId: ID!) {
  removeFriendById(userId: $userId, friendId: $friendId) { userId }
}`

export const importerStatus = /* GraphQL */ `query ImporterStatus {
  importerStatus { running desired pending lastStarted }
}`

export const setImporterRunning = /* GraphQL */ `mutation SetImporterRunning($enabled: Boolean!) {
  setImporterRunning(enabled: $enabled) { running desired pending lastStarted }
}`

export const addSongToLiveJam = /* GraphQL */ `mutation AddSongToLiveJam(
  $jamSessionId: ID!
  $songId: ID!
  $key: String!
  $userId: ID!
  $jumpTo: Boolean
) {
  addSongToLiveJam(jamSessionId: $jamSessionId, songId: $songId, key: $key, userId: $userId, jumpTo: $jumpTo) {
    jamSessionId
    index
    key
    jumpTo
    song { songId title artist album albumCover chordSheet chordSheetKey spotifyId }
  }
}`

export const onJamSongsChanged = /* GraphQL */ `subscription OnJamSongsChanged($jamSessionId: ID!) {
  onJamSongsChanged(jamSessionId: $jamSessionId) {
    jamSessionId
    index
    key
    jumpTo
    song { songId title artist album albumCover chordSheet chordSheetKey spotifyId }
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

export const setJamQueue = /* GraphQL */ `mutation SetJamQueue(
  $jamSessionId: ID!
  $queue: [Int!]!
  $expectedRevision: Int
  $currentSongIndex: Int
) {
  setJamQueue(jamSessionId: $jamSessionId, queue: $queue, expectedRevision: $expectedRevision, currentSongIndex: $currentSongIndex) {
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

export const ensureJamJoinToken = /* GraphQL */ `mutation EnsureJamJoinToken($jamSessionId: ID!, $userId: ID!) {
  ensureJamJoinToken(jamSessionId: $jamSessionId, userId: $userId) {
    jamSessionId
    joinToken
  }
}`

export const onImportStatusChanged = /* GraphQL */ `subscription OnImportStatusChanged($jamId: ID!) {
  onImportStatusChanged(jamId: $jamId) {
    requestId
    songId
    jamId
    status
    chordSheet
    error
  }
}`
