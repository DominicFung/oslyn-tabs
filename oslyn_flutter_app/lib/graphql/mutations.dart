// GraphQL mutations for Oslyn Flutter App
// Simplified version - removed song-related complexity

class GraphQLMutations {
  // Create a new jam session - simplified version
  static const String createJamSession = '''
    mutation CreateJamSession(
      \$setListId: ID!
      \$userId: ID!
      \$policy: Policy!
      \$bandId: ID
    ) {
      createJamSession(
        setListId: \$setListId
        userId: \$userId
        policy: \$policy
        bandId: \$bandId
      ) {
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
        pin
        bandId
      }
    }
  ''';

  // Create a new band
  static const String createBand = '''
    mutation CreateBand(
      \$name: String!
      \$description: String
      \$isPublic: Boolean
      \$userId: ID!
    ) {
      createBand(
        name: \$name
        description: \$description
        isPublic: \$isPublic
        userId: \$userId
      ) {
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

  // Add user to band
  static const String addUserToBand = '''
    mutation AddUserToBand(
      \$bandId: ID!
      \$userId: ID!
      \$role: bandRole!
    ) {
      addUserToBand(
        bandId: \$bandId
        userId: \$userId
        role: \$role
      ) {
        roleId
        user {
          userId
          username
          email
        }
        band {
          bandId
          name
        }
        role
      }
    }
  ''';

  // Remove user from band
  static const String removeUserFromBand = '''
    mutation RemoveUserFromBand(
      \$bandId: ID!
      \$userId: ID!
    ) {
      removeUserFromBand(
        bandId: \$bandId
        userId: \$userId
      ) {
        bandId
        name
        description
        isPublic
      }
    }
  ''';

  // Create a song with band association
  static const String createSong = '''
    mutation CreateSong(
      \$title: String!
      \$userId: ID!
      \$bandId: ID!
      \$artist: String
      \$album: String
      \$albumCover: String
      \$chordSheet: String!
      \$chordSheetKey: String!
    ) {
      createSong(
        title: \$title
        userId: \$userId
        bandId: \$bandId
        artist: \$artist
        album: \$album
        albumCover: \$albumCover
        chordSheet: \$chordSheet
        chordSheetKey: \$chordSheetKey
      ) {
        songId
        title
        artist
        album
        albumCover
        isApproved
        version
        chordSheet
        chordSheetKey
        bandIds
        primaryBandId
        creator {
          userId
          username
          email
        }
      }
    }
  ''';

  // Import song to band
  static const String importSongToBand = '''
    mutation ImportSongToBand(
      \$songId: ID!
      \$fromBandId: ID!
      \$toBandId: ID!
      \$userId: ID!
    ) {
      importSongToBand(
        songId: \$songId
        fromBandId: \$fromBandId
        toBandId: \$toBandId
        userId: \$userId
      ) {
        songId
        title
        artist
        album
        albumCover
        isApproved
        version
        chordSheet
        chordSheetKey
        bandIds
        primaryBandId
        creator {
          userId
          username
          email
        }
      }
    }
  ''';
}
