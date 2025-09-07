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

  // Debug: Print the query for verification
  static void debugPrintQueries() {
    print('🔍 GraphQL Queries Debug Info:');
    print('📋 getJamSession query:');
    print(getJamSession);
    print('📋 listPublicJamSessions query:');
    print(listPublicJamSessions);
    print('📋 listSongs query:');
    print(listSongs);
  }

  static const String listSongs = '''
query ListSongs(\$userId: ID!, \$limit: Int, \$filter: String, \$nextToken: String) {
  listSongs(userId: \$userId, limit: \$limit, filter: \$filter, nextToken: \$nextToken) {
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
}
