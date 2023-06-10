/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getSong = /* GraphQL */ `
  query GetSong($songId: ID!) {
    getSong(songId: $songId) {
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
      recordings {
        recordingId
        songTitle
        formId
        song {
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
        }
        key
        tabLink
        rawTabs
        prelabelTool
        prelabelToolVersion
        labelTool
        labelToolVersion
        labeller {
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
        isLabelerRejected
        labelerRejectionReason
        singerName
        singerEmail
        gender
        status
        editHistory {
          recordingHistoryId
          date
          actionColumn
          previousAction
          newAction
          comment
        }
        comment
        createDate
        updateDate
        lastOULGenerateDate
      }
      chordSheet
      chordSheetKey
      originPlatorm
      originLink
    }
  }
`;
export const listSongs = /* GraphQL */ `
  query ListSongs(
    $userId: ID!
    $limit: Int
    $filter: String
    $nextToken: String
  ) {
    listSongs(
      userId: $userId
      limit: $limit
      filter: $filter
      nextToken: $nextToken
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
      recordings {
        recordingId
        songTitle
        formId
        song {
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
        }
        key
        tabLink
        rawTabs
        prelabelTool
        prelabelToolVersion
        labelTool
        labelToolVersion
        labeller {
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
        isLabelerRejected
        labelerRejectionReason
        singerName
        singerEmail
        gender
        status
        editHistory {
          recordingHistoryId
          date
          actionColumn
          previousAction
          newAction
          comment
        }
        comment
        createDate
        updateDate
        lastOULGenerateDate
      }
      chordSheet
      chordSheetKey
      originPlatorm
      originLink
    }
  }
`;
export const getUserById = /* GraphQL */ `
  query GetUserById($userId: ID!) {
    getUserById(userId: $userId) {
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
        song {
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
        }
        key
        tabLink
        rawTabs
        prelabelTool
        prelabelToolVersion
        labelTool
        labelToolVersion
        labeller {
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
        isLabelerRejected
        labelerRejectionReason
        singerName
        singerEmail
        gender
        status
        editHistory {
          recordingHistoryId
          date
          actionColumn
          previousAction
          newAction
          comment
        }
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
      }
      editHistory {
        recordingHistoryId
        recording {
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
        labeller {
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
        date
        actionColumn
        previousAction
        newAction
        comment
      }
      likedSongs {
        key
        song {
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
        }
      }
    }
  }
`;
export const getUserByEmail = /* GraphQL */ `
  query GetUserByEmail($email: AWSEmail) {
    getUserByEmail(email: $email) {
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
        song {
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
        }
        key
        tabLink
        rawTabs
        prelabelTool
        prelabelToolVersion
        labelTool
        labelToolVersion
        labeller {
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
        isLabelerRejected
        labelerRejectionReason
        singerName
        singerEmail
        gender
        status
        editHistory {
          recordingHistoryId
          date
          actionColumn
          previousAction
          newAction
          comment
        }
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
      }
      editHistory {
        recordingHistoryId
        recording {
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
        labeller {
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
        date
        actionColumn
        previousAction
        newAction
        comment
      }
      likedSongs {
        key
        song {
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
        }
      }
    }
  }
`;
export const listUsers = /* GraphQL */ `
  query ListUsers($limit: Int, $filter: String, $nextToken: String) {
    listUsers(limit: $limit, filter: $filter, nextToken: $nextToken) {
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
        song {
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
        }
        key
        tabLink
        rawTabs
        prelabelTool
        prelabelToolVersion
        labelTool
        labelToolVersion
        labeller {
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
        isLabelerRejected
        labelerRejectionReason
        singerName
        singerEmail
        gender
        status
        editHistory {
          recordingHistoryId
          date
          actionColumn
          previousAction
          newAction
          comment
        }
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
      }
      editHistory {
        recordingHistoryId
        recording {
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
        labeller {
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
        date
        actionColumn
        previousAction
        newAction
        comment
      }
      likedSongs {
        key
        song {
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
        }
      }
    }
  }
`;
export const getBand = /* GraphQL */ `
  query GetBand($bandId: ID!, $userId: ID!) {
    getBand(bandId: $bandId, userId: $userId) {
      bandId
      songs {
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
  }
`;
export const listBands = /* GraphQL */ `
  query ListBands($limit: Int, $filter: String, $nextToken: String) {
    listBands(limit: $limit, filter: $filter, nextToken: $nextToken) {
      bandId
      songs {
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
  }
`;
export const getSet = /* GraphQL */ `
  query GetSet($setListId: ID!, $userId: ID!) {
    getSet(setListId: $setListId, userId: $userId) {
      setListId
      description
      songs {
        key
        song {
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
        }
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
      band {
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
  }
`;
export const listSets = /* GraphQL */ `
  query ListSets(
    $userId: ID!
    $limit: Int
    $filter: String
    $nextToken: String
  ) {
    listSets(
      userId: $userId
      limit: $limit
      filter: $filter
      nextToken: $nextToken
    ) {
      setListId
      description
      songs {
        key
        song {
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
        }
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
      band {
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
  }
`;
export const getJamSong = /* GraphQL */ `
  query GetJamSong($jamSongId: ID!, $userId: ID!) {
    getJamSong(jamSongId: $jamSongId, userId: $userId) {
      key
      song {
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
      }
    }
  }
`;
export const getJamSession = /* GraphQL */ `
  query GetJamSession($jamSessionId: ID!, $userId: ID!) {
    getJamSession(jamSessionId: $jamSessionId, userId: $userId) {
      jamSessionId
      setList {
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
      currentSong {
        key
        song {
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
        }
      }
      currentLine
      startDate
      endDate
    }
  }
`;
export const listJamSessions = /* GraphQL */ `
  query ListJamSessions(
    $bandId: ID!
    $limit: Int
    $filter: String
    $nextToken: String
  ) {
    listJamSessions(
      bandId: $bandId
      limit: $limit
      filter: $filter
      nextToken: $nextToken
    ) {
      jamSessionId
      setList {
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
      currentSong {
        key
        song {
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
        }
      }
      currentLine
      startDate
      endDate
    }
  }
`;
