// GraphQL queries for Oslyn Flutter App
// Simplified version - removed song-related complexity

class GraphQLQueries {
  // Get list of public jam sessions - simplified version
  static const String listPublicJamSessions = '''
    query ListPublicJamSessions(\$limit: Int, \$filter: String, \$nextToken: String) {
      listPublicJamSessions(limit: \$limit, filter: \$filter, nextToken: \$nextToken) {
        jamSessionId
        description
        admins {
          userId
          username
          email
          providers
          firstName
          lastName
          imageUrl
          recieveUpdatesFromOslyn
          isActivated
          createDate
          role
        }
        members {
          userId
          username
          email
          providers
          firstName
          lastName
          imageUrl
          recieveUpdatesFromOslyn
          isActivated
          createDate
          role
        }
        guests {
          userId
          username
          email
          providers
          firstName
          lastName
          imageUrl
          recieveUpdatesFromOslyn
          isActivated
          createDate
          role
        }
        policy
        active {
          userId
          participantType
          joinTime
          lastPing
          username
          colour
          ip
          user {
            userId
            username
            email
            providers
            firstName
            lastName
            imageUrl
            recieveUpdatesFromOslyn
            isActivated
            createDate
            role
          }
        }
        passcode
        startDate
        endDate
        queue
        revision
        setList {
          setListId
          description
          songs {
            key
            order
            song {
              songId
              title
              artist
              isApproved
              version
              chordSheet
              chordSheetKey
            }
          }
        }
      }
    }
  ''';

  // Get a specific jam session - simplified version
  static const String getJamSession = '''
query GetJamSession(\$jamSessionId: ID!, \$userId: ID) {
  getJamSession(jamSessionId: \$jamSessionId, userId: \$userId) {
    jamSessionId
    queue
    revision
    currentSong
    currentPage
    description
    admins {
      userId
      username
      email
      providers
      firstName
      lastName
      imageUrl
      recieveUpdatesFromOslyn
      isActivated
      createDate
      role
    }
    members {
      userId
      username
      email
      providers
      firstName
      lastName
      imageUrl
      recieveUpdatesFromOslyn
      isActivated
      createDate
      role
    }
    guests {
      userId
      username
      email
      providers
      firstName
      lastName
      imageUrl
      recieveUpdatesFromOslyn
      isActivated
      createDate
      role
    }
    policy
    active {
      userId
      participantType
      joinTime
      lastPing
      username
      colour
      ip
      user {
        userId
        username
        email
        providers
        firstName
        lastName
        imageUrl
        recieveUpdatesFromOslyn
        isActivated
        createDate
        role
      }
    }
    passcode
    startDate
    endDate
    setList {
      setListId
      description
      bandId
      songCache {
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
        CCLISongTitle
        CCLISongWriter
        CCLICopyrightNotice
        CCLILicenseNumber
        bandIds
        primaryBandId
      }
      editors {
        userId
        username
        email
        providers
        firstName
        lastName
        imageUrl
        recieveUpdatesFromOslyn
        isActivated
        createDate
        role
      }
    }
  }
}
''';

  // Get jam session by PIN
  static const String getJamSessionByPin = '''
query GetJamSessionByPin(\$pin: String!) {
  getJamSessionByPin(pin: \$pin) {
    jamSessionId
    pin
    queue
    revision
    currentSong
    currentPage
    description
    admins {
      userId
      username
      email
      providers
      firstName
      lastName
      imageUrl
      recieveUpdatesFromOslyn
      isActivated
      createDate
      role
    }
    members {
      userId
      username
      email
      providers
      firstName
      lastName
      imageUrl
      recieveUpdatesFromOslyn
      isActivated
      createDate
      role
    }
    guests {
      userId
      username
      email
      providers
      firstName
      lastName
      imageUrl
      recieveUpdatesFromOslyn
      isActivated
      createDate
      role
    }
    policy
    active {
      userId
      participantType
      joinTime
      lastPing
      username
      colour
      ip
      user {
        userId
        username
        email
        providers
        firstName
        lastName
        imageUrl
        recieveUpdatesFromOslyn
        isActivated
        createDate
        role
      }
    }
    passcode
    startDate
    endDate
    setList {
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
          CCLISongTitle
          CCLISongWriter
          CCLICopyrightNotice
          CCLILicenseNumber
        }
        defaultSlideConfig {
          songId
          backgroundImg
          backgroundColor
          textColor
          highlightColor
          highlightOpacity
        }
        order
      }
      editors {
        userId
        username
        email
        providers
        firstName
        lastName
        imageUrl
        recieveUpdatesFromOslyn
        isActivated
        createDate
        role
      }
    }
  }
}
''';

  // Set jam queue mutation
  static const String setJamQueue = '''
mutation SetJamQueue(\$jamSessionId: ID!, \$queue: [Int!]!, \$expectedRevision: Int, \$currentSongIndex: Int) {
  setJamQueue(jamSessionId: \$jamSessionId, queue: \$queue, expectedRevision: \$expectedRevision, currentSongIndex: \$currentSongIndex) {
    jamSessionId
    queue
    revision
    currentSongIndex
  }
}
''';

  // Debug: Print the query for verification
  static void debugPrintQueries() {
    print('🔍 GraphQL Queries Debug Info:');
    print('📋 getJamSession query:');
    print(getJamSession);
    print('📋 listPublicJamSessions query:');
    print(listPublicJamSessions);
    print('📋 listSongs query:');
    print(listSongs);
    print('📋 setJamQueue mutation:');
    print(setJamQueue);
  }

  static const String listSongs = '''
query ListSongs(\$userId: ID!, \$bandId: ID, \$limit: Int, \$filter: String, \$nextToken: String) {
  listSongs(userId: \$userId, bandId: \$bandId, limit: \$limit, filter: \$filter, nextToken: \$nextToken) {
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
    chordSheet
    chordSheetKey
    originPlatorm
    originLink
    CCLISongTitle
    CCLISongWriter
    CCLICopyrightNotice
    CCLILicenseNumber
    bandIds
    primaryBandId
    creator {
      userId
      username
      email
      providers
      firstName
      lastName
      imageUrl
      recieveUpdatesFromOslyn
      isActivated
      createDate
      role
    }
  }
}
''';

  // Mutations for synchronized song selection
  static const String nextSong = '''
mutation NextSong(\$jamSessionId: ID!, \$song: Int, \$page: Int) {
  nextSong(jamSessionId: \$jamSessionId, song: \$song, page: \$page) {
    jamSessionId
    song
    page
    key
    queue
  }
}
''';

  static const String addSongToJamQueue = '''
mutation AddSongToJamQueue(\$jamSessionId: ID!, \$song: Int!) {
  addSongToJamQueue(jamSessionId: \$jamSessionId, song: \$song) {
    jamSessionId
    queue
  }
}
''';

  static const String removeSongFromJamQueue = '''
mutation RemoveSongFromJamQueue(\$jamSessionId: ID!, \$queueIndex: Int!) {
  removeSongFromJamQueue(jamSessionId: \$jamSessionId, queueIndex: \$queueIndex) {
    jamSessionId
    queue
  }
}
''';

  static const String setSongKey = '''
mutation SetSongKey(\$jamSessionId: ID!, \$song: Int, \$key: String!) {
  setSongKey(jamSessionId: \$jamSessionId, song: \$song, key: \$key) {
    jamSessionId
    song
    key
  }
}
''';

  static const String nextPage = '''
mutation NextPage(\$jamSessionId: ID!, \$page: Int!) {
  nextPage(jamSessionId: \$jamSessionId, page: \$page) {
    jamSessionId
    page
  }
}
''';

  // Add song to setlist
  static const String addSongToSet = '''
mutation AddSongToSet(\$setListId: ID!, \$songId: ID!, \$key: String) {
  addSongToSet(setListId: \$setListId, songId: \$songId, key: \$key) {
    setListId
    description
    songs {
      key
      order
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
    bandId
  }
}
''';

  // Get shared songs for a user
  static const String listSharedSongs = '''
query ListSharedSongs(\$userId: ID!, \$optimize: Boolean, \$limit: Int, \$filter: String, \$nextToken: String) {
  listSharedSongs(userId: \$userId, optimize: \$optimize, limit: \$limit, filter: \$filter, nextToken: \$nextToken) {
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
    chordSheet
    chordSheetKey
    originPlatorm
    originLink
    CCLISongTitle
    CCLISongWriter
    CCLICopyrightNotice
    CCLILicenseNumber
    creator {
      userId
      username
      email
      providers
      firstName
      lastName
      imageUrl
      recieveUpdatesFromOslyn
      isActivated
      createDate
      role
    }
  }
}
''';

  // Get public bands
  static const String listPublicBands = '''
query ListPublicBands(\$limit: Int, \$filter: String, \$nextToken: String) {
  listPublicBands(limit: \$limit, filter: \$filter, nextToken: \$nextToken) {
    bandId
    name
    description
    isPublic
    members {
      userId
      username
      email
      providers
      firstName
      lastName
      imageUrl
      recieveUpdatesFromOslyn
      isActivated
      createDate
      role
    }
  }
}
''';

  // Get user's bands
  static const String listBands = '''
query ListBands(\$userId: ID!, \$limit: Int, \$filter: String, \$nextToken: String) {
  listBands(userId: \$userId, limit: \$limit, filter: \$filter, nextToken: \$nextToken) {
    bandId
    name
    description
    isPublic
    userRole
    owner {
      userId
      username
      email
      providers
      firstName
      lastName
      imageUrl
      recieveUpdatesFromOslyn
      isActivated
      createDate
      role
    }
    members {
      userId
      username
      email
      providers
      firstName
      lastName
      imageUrl
      recieveUpdatesFromOslyn
      isActivated
      createDate
      role
    }
    admins {
      userId
      username
      email
      providers
      firstName
      lastName
      imageUrl
      recieveUpdatesFromOslyn
      isActivated
      createDate
      role
    }
  }
}
''';

  // Get user by ID with band information
  static const String getUserById = '''
query GetUserById(\$userId: ID!) {
  getUserById(userId: \$userId) {
    userId
    username
    email
    providers
    firstName
    lastName
    imageUrl
    recieveUpdatesFromOslyn
    isActivated
    createDate
    role
  }
}
''';

  // Get user's accessible jam sessions
  static const String getUserJamSessions = '''
query GetUserJamSessions(\$userId: ID!) {
  getUserJamSessions(userId: \$userId) {
    jamSessionId
    bandId
    policy
    description
    startDate
    endDate
    admins {
      userId
      username
      firstName
      lastName
    }
    members {
      userId
      username
      firstName
      lastName
    }
    guests {
      userId
      username
      firstName
      lastName
    }
    active {
      userId
      participantType
      username
    }
    queue
    revision
  }
}
''';

  // Update jam session description
  static const String updateJamSessionDescription = '''
mutation UpdateJamSessionDescription(\$jamSessionId: ID!, \$description: String!) {
  updateJamSessionDescription(jamSessionId: \$jamSessionId, description: \$description) {
    jamSessionId
    description
    startDate
    endDate
    policy
    bandId
  }
}
''';

  // Get jam sessions for a user with band context
  static const String listJamSessions = '''
query ListJamSessions(\$userId: ID!, \$bandId: ID, \$limit: Int, \$filter: String, \$nextToken: String) {
  listJamSessions(userId: \$userId, bandId: \$bandId, limit: \$limit, filter: \$filter, nextToken: \$nextToken) {
    jamSessionId
    description
    bandId
    admins {
      userId
      username
      email
      providers
      firstName
      lastName
      imageUrl
      recieveUpdatesFromOslyn
      isActivated
      createDate
      role
    }
    members {
      userId
      username
      email
      providers
      firstName
      lastName
      imageUrl
      recieveUpdatesFromOslyn
      isActivated
      createDate
      role
    }
    guests {
      userId
      username
      email
      providers
      firstName
      lastName
      imageUrl
      recieveUpdatesFromOslyn
      isActivated
      createDate
      role
    }
    policy
    active {
      userId
      participantType
      joinTime
      lastPing
      username
      colour
      ip
      user {
        userId
        username
        email
        providers
        firstName
        lastName
        imageUrl
        recieveUpdatesFromOslyn
        isActivated
        createDate
        role
      }
    }
    passcode
    startDate
    endDate
    queue
    revision
    setList {
      setListId
      description
      bandId
      songs {
        key
        order
        song {
          songId
          title
          artist
          isApproved
          version
          chordSheet
          chordSheetKey
          bandIds
          primaryBandId
        }
      }
    }
  }
}
''';

  // Get songs from a specific band (deprecated - use listSongs with bandId)
  static const String listBandSongs = '''
query ListBandSongs(\$bandId: ID!, \$limit: Int, \$filter: String, \$nextToken: String) {
  listBandSongs(bandId: \$bandId, limit: \$limit, filter: \$filter, nextToken: \$nextToken) {
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
    chordSheet
    chordSheetKey
    originPlatorm
    originLink
    CCLISongTitle
    CCLISongWriter
    CCLICopyrightNotice
    CCLILicenseNumber
    bandIds
    primaryBandId
    creator {
      userId
      username
      email
      providers
      firstName
      lastName
      imageUrl
      recieveUpdatesFromOslyn
      isActivated
      createDate
      role
    }
  }
}
''';
}
