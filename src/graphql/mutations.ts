/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createUser = /* GraphQL */ `
  mutation CreateUser(
    $username: String!
    $email: String!
    $firstName: String
    $lastName: String
  ) {
    createUser(
      username: $username
      email: $email
      firstName: $firstName
      lastName: $lastName
    ) {
      userId
      username
      firstName
      lastName
      recieveUpdatesFromOslyn
      isActivated
      createDate
      email
      role
      labelledRecording {
        recordingId
        songTitle
        formId
        key
        tabLink
        rawTabs
        prelabelTool
        prelabelToolVersion
        labelTool
        labelToolVersion
        isLabelerRejected
        labelerRejectionReason
        singerName
        singerEmail
        gender
        status
        comment
        createDate
        updateDate
        lastOULGenerateDate
      }
      songsCreated {
        songId
        title
        artist
        album
        albumCover
        isApproved
        version
        chordSheet
        chordSheetKey
        originPlatorm
        originLink
        oslynJson
        oslynVersion
      }
      editHistory {
        recordingHistoryId
        date
        actionColumn
        previousAction
        newAction
        comment
      }
      likedSongs {
        key
      }
    }
  }
`;
export const createSong = /* GraphQL */ `
  mutation CreateSong(
    $title: String!
    $userId: ID!
    $key: String!
    $rawTabs: String!
    $artist: String
    $album: String
  ) {
    createSong(
      title: $title
      userId: $userId
      key: $key
      rawTabs: $rawTabs
      artist: $artist
      album: $album
    ) {
      songId
      title
      artist
      album
      albumCover
      beat {
        count
        note
      }
      isApproved
      version
      creator {
        userId
        username
        firstName
        lastName
        recieveUpdatesFromOslyn
        isActivated
        createDate
        email
        role
      }
      recordings {
        recordingId
        songTitle
        formId
        key
        tabLink
        rawTabs
        prelabelTool
        prelabelToolVersion
        labelTool
        labelToolVersion
        isLabelerRejected
        labelerRejectionReason
        singerName
        singerEmail
        gender
        status
        comment
        createDate
        updateDate
        lastOULGenerateDate
      }
      chordSheet
      chordSheetKey
      originPlatorm
      originLink
      oslynJson
      oslynVersion
    }
  }
`;
export const updateSong = /* GraphQL */ `
  mutation UpdateSong(
    $songId: ID!
    $ownerId: ID!
    $title: String
    $artist: String
    $album: String
    $albumCover: String
    $beat: _Beat
    $approved: Boolean
    $chordSheet: String
    $chordSheetKey: String
    $originalPlatorm: chordSheetPlatform
    $originalLink: String
  ) {
    updateSong(
      songId: $songId
      ownerId: $ownerId
      title: $title
      artist: $artist
      album: $album
      albumCover: $albumCover
      beat: $beat
      approved: $approved
      chordSheet: $chordSheet
      chordSheetKey: $chordSheetKey
      originalPlatorm: $originalPlatorm
      originalLink: $originalLink
    ) {
      songId
      title
      artist
      album
      albumCover
      beat {
        count
        note
      }
      isApproved
      version
      creator {
        userId
        username
        firstName
        lastName
        recieveUpdatesFromOslyn
        isActivated
        createDate
        email
        role
      }
      recordings {
        recordingId
        songTitle
        formId
        key
        tabLink
        rawTabs
        prelabelTool
        prelabelToolVersion
        labelTool
        labelToolVersion
        isLabelerRejected
        labelerRejectionReason
        singerName
        singerEmail
        gender
        status
        comment
        createDate
        updateDate
        lastOULGenerateDate
      }
      chordSheet
      chordSheetKey
      originPlatorm
      originLink
      oslynJson
      oslynVersion
    }
  }
`;
export const addRecordingToSong = /* GraphQL */ `
  mutation AddRecordingToSong($songId: ID!, $recordingId: ID!) {
    addRecordingToSong(songId: $songId, recordingId: $recordingId) {
      songId
      title
      artist
      album
      albumCover
      beat {
        count
        note
      }
      isApproved
      version
      creator {
        userId
        username
        firstName
        lastName
        recieveUpdatesFromOslyn
        isActivated
        createDate
        email
        role
      }
      recordings {
        recordingId
        songTitle
        formId
        key
        tabLink
        rawTabs
        prelabelTool
        prelabelToolVersion
        labelTool
        labelToolVersion
        isLabelerRejected
        labelerRejectionReason
        singerName
        singerEmail
        gender
        status
        comment
        createDate
        updateDate
        lastOULGenerateDate
      }
      chordSheet
      chordSheetKey
      originPlatorm
      originLink
      oslynJson
      oslynVersion
    }
  }
`;
export const removeRecordingFromSong = /* GraphQL */ `
  mutation RemoveRecordingFromSong($songId: ID!, $recordingId: ID!) {
    removeRecordingFromSong(songId: $songId, recordingId: $recordingId) {
      songId
      title
      artist
      album
      albumCover
      beat {
        count
        note
      }
      isApproved
      version
      creator {
        userId
        username
        firstName
        lastName
        recieveUpdatesFromOslyn
        isActivated
        createDate
        email
        role
      }
      recordings {
        recordingId
        songTitle
        formId
        key
        tabLink
        rawTabs
        prelabelTool
        prelabelToolVersion
        labelTool
        labelToolVersion
        isLabelerRejected
        labelerRejectionReason
        singerName
        singerEmail
        gender
        status
        comment
        createDate
        updateDate
        lastOULGenerateDate
      }
      chordSheet
      chordSheetKey
      originPlatorm
      originLink
      oslynJson
      oslynVersion
    }
  }
`;
export const createBand = /* GraphQL */ `
  mutation CreateBand($ownerId: ID!, $name: String) {
    createBand(ownerId: $ownerId, name: $name) {
      bandId
      songs {
        songId
        title
        artist
        album
        albumCover
        isApproved
        version
        chordSheet
        chordSheetKey
        originPlatorm
        originLink
        oslynJson
        oslynVersion
      }
      members {
        userId
        username
        firstName
        lastName
        recieveUpdatesFromOslyn
        isActivated
        createDate
        email
        role
      }
      owner {
        userId
        username
        firstName
        lastName
        recieveUpdatesFromOslyn
        isActivated
        createDate
        email
        role
      }
    }
  }
`;
export const addBandMembers = /* GraphQL */ `
  mutation AddBandMembers($bandId: ID!, $userIds: [ID]!) {
    addBandMembers(bandId: $bandId, userIds: $userIds) {
      bandId
      songs {
        songId
        title
        artist
        album
        albumCover
        isApproved
        version
        chordSheet
        chordSheetKey
        originPlatorm
        originLink
        oslynJson
        oslynVersion
      }
      members {
        userId
        username
        firstName
        lastName
        recieveUpdatesFromOslyn
        isActivated
        createDate
        email
        role
      }
      owner {
        userId
        username
        firstName
        lastName
        recieveUpdatesFromOslyn
        isActivated
        createDate
        email
        role
      }
    }
  }
`;
export const removeBandMembers = /* GraphQL */ `
  mutation RemoveBandMembers($bandId: ID!, $userIds: [ID]!) {
    removeBandMembers(bandId: $bandId, userIds: $userIds) {
      bandId
      songs {
        songId
        title
        artist
        album
        albumCover
        isApproved
        version
        chordSheet
        chordSheetKey
        originPlatorm
        originLink
        oslynJson
        oslynVersion
      }
      members {
        userId
        username
        firstName
        lastName
        recieveUpdatesFromOslyn
        isActivated
        createDate
        email
        role
      }
      owner {
        userId
        username
        firstName
        lastName
        recieveUpdatesFromOslyn
        isActivated
        createDate
        email
        role
      }
    }
  }
`;
export const addSongsToBand = /* GraphQL */ `
  mutation AddSongsToBand($bandId: ID!, $songIds: [ID]!) {
    addSongsToBand(bandId: $bandId, songIds: $songIds) {
      bandId
      songs {
        songId
        title
        artist
        album
        albumCover
        isApproved
        version
        chordSheet
        chordSheetKey
        originPlatorm
        originLink
        oslynJson
        oslynVersion
      }
      members {
        userId
        username
        firstName
        lastName
        recieveUpdatesFromOslyn
        isActivated
        createDate
        email
        role
      }
      owner {
        userId
        username
        firstName
        lastName
        recieveUpdatesFromOslyn
        isActivated
        createDate
        email
        role
      }
    }
  }
`;
export const removeSongsFromBand = /* GraphQL */ `
  mutation RemoveSongsFromBand($bandId: ID!, $songIds: [ID]!) {
    removeSongsFromBand(bandId: $bandId, songIds: $songIds) {
      bandId
      songs {
        songId
        title
        artist
        album
        albumCover
        isApproved
        version
        chordSheet
        chordSheetKey
        originPlatorm
        originLink
        oslynJson
        oslynVersion
      }
      members {
        userId
        username
        firstName
        lastName
        recieveUpdatesFromOslyn
        isActivated
        createDate
        email
        role
      }
      owner {
        userId
        username
        firstName
        lastName
        recieveUpdatesFromOslyn
        isActivated
        createDate
        email
        role
      }
    }
  }
`;
export const createSet = /* GraphQL */ `
  mutation CreateSet($creatorId: ID!, $description: String) {
    createSet(creatorId: $creatorId, description: $description) {
      setListId
      description
      songs {
        key
      }
      editors {
        userId
        username
        firstName
        lastName
        recieveUpdatesFromOslyn
        isActivated
        createDate
        email
        role
      }
      creator {
        userId
        username
        firstName
        lastName
        recieveUpdatesFromOslyn
        isActivated
        createDate
        email
        role
      }
      band {
        bandId
      }
    }
  }
`;
export const addEditorToSet = /* GraphQL */ `
  mutation AddEditorToSet($setListId: ID!, $userId: ID!) {
    addEditorToSet(setListId: $setListId, userId: $userId) {
      setListId
      description
      songs {
        key
      }
      editors {
        userId
        username
        firstName
        lastName
        recieveUpdatesFromOslyn
        isActivated
        createDate
        email
        role
      }
      creator {
        userId
        username
        firstName
        lastName
        recieveUpdatesFromOslyn
        isActivated
        createDate
        email
        role
      }
      band {
        bandId
      }
    }
  }
`;
export const removeEditorFromSet = /* GraphQL */ `
  mutation RemoveEditorFromSet($setListId: ID!, $userId: ID!) {
    removeEditorFromSet(setListId: $setListId, userId: $userId) {
      setListId
      description
      songs {
        key
      }
      editors {
        userId
        username
        firstName
        lastName
        recieveUpdatesFromOslyn
        isActivated
        createDate
        email
        role
      }
      creator {
        userId
        username
        firstName
        lastName
        recieveUpdatesFromOslyn
        isActivated
        createDate
        email
        role
      }
      band {
        bandId
      }
    }
  }
`;
export const addSongToSet = /* GraphQL */ `
  mutation AddSongToSet($setListId: ID!, $songId: ID!, $key: String) {
    addSongToSet(setListId: $setListId, songId: $songId, key: $key) {
      setListId
      description
      songs {
        key
      }
      editors {
        userId
        username
        firstName
        lastName
        recieveUpdatesFromOslyn
        isActivated
        createDate
        email
        role
      }
      creator {
        userId
        username
        firstName
        lastName
        recieveUpdatesFromOslyn
        isActivated
        createDate
        email
        role
      }
      band {
        bandId
      }
    }
  }
`;
export const removeSongFromSet = /* GraphQL */ `
  mutation RemoveSongFromSet($setListId: ID!, $jamSongId: [ID]!) {
    removeSongFromSet(setListId: $setListId, jamSongId: $jamSongId) {
      setListId
      description
      songs {
        key
      }
      editors {
        userId
        username
        firstName
        lastName
        recieveUpdatesFromOslyn
        isActivated
        createDate
        email
        role
      }
      creator {
        userId
        username
        firstName
        lastName
        recieveUpdatesFromOslyn
        isActivated
        createDate
        email
        role
      }
      band {
        bandId
      }
    }
  }
`;
export const startJamSession = /* GraphQL */ `
  mutation StartJamSession($setListId: ID!) {
    startJamSession(setListId: $setListId) {
      jamSessionId
      setList {
        setListId
        description
      }
      admin {
        userId
        username
        firstName
        lastName
        recieveUpdatesFromOslyn
        isActivated
        createDate
        email
        role
      }
      members {
        userId
        username
        firstName
        lastName
        recieveUpdatesFromOslyn
        isActivated
        createDate
        email
        role
      }
      currentSong {
        key
      }
      currentLine
      startDate
      endDate
    }
  }
`;
export const endJamSession = /* GraphQL */ `
  mutation EndJamSession($jamSessionId: ID!) {
    endJamSession(jamSessionId: $jamSessionId) {
      jamSessionId
      setList {
        setListId
        description
      }
      admin {
        userId
        username
        firstName
        lastName
        recieveUpdatesFromOslyn
        isActivated
        createDate
        email
        role
      }
      members {
        userId
        username
        firstName
        lastName
        recieveUpdatesFromOslyn
        isActivated
        createDate
        email
        role
      }
      currentSong {
        key
      }
      currentLine
      startDate
      endDate
    }
  }
`;
export const nextLine = /* GraphQL */ `
  mutation NextLine($hash: String!) {
    nextLine(hash: $hash) {
      jamSessionId
      setList {
        setListId
        description
      }
      admin {
        userId
        username
        firstName
        lastName
        recieveUpdatesFromOslyn
        isActivated
        createDate
        email
        role
      }
      members {
        userId
        username
        firstName
        lastName
        recieveUpdatesFromOslyn
        isActivated
        createDate
        email
        role
      }
      currentSong {
        key
      }
      currentLine
      startDate
      endDate
    }
  }
`;
