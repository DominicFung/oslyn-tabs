// GraphQL mutations for Oslyn Flutter App
// Simplified version - removed song-related complexity

class GraphQLMutations {
  // Create a new jam session - simplified version
  static const String createJamSession = '''
    mutation CreateJamSession(
      \$setListId: ID!
      \$userId: ID!
      \$policy: policy
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
      }
    }
  ''';
}
