// GraphQL subscriptions for Oslyn Flutter App
// These match the subscriptions used in your web app for real-time updates

class GraphQLSubscriptions {
  // Subscribe to page changes - same as your web app
  static const String onNextPage = '''
    subscription OnNextPage(\$jamSessionId: ID!) {
      onNextPage(jamSessionId: \$jamSessionId) {
        jamSessionId
        page
      }
    }
  ''';

  // Subscribe to song changes - same as your web app
  static const String onNextSong = '''
    subscription OnNextSong(\$jamSessionId: ID!) {
      onNextSong(jamSessionId: \$jamSessionId) {
        jamSessionId
        song
        page
        key
        queue
      }
    }
  ''';

  // Subscribe to key changes - same as your web app
  static const String onSongKey = '''
    subscription OnSongKey(\$jamSessionId: ID!) {
      onSongKey(jamSessionId: \$jamSessionId) {
        jamSessionId
        song
        key
      }
    }
  ''';

  // Subscribe to user joins - same as your web app
  static const String onUserJoin = '''
    subscription OnUserJoin(\$jamSessionId: ID!) {
      onUserJoin(jamSessionId: \$jamSessionId) {
        jamSessionId
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
        latest {
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
      }
    }
  ''';

  // Subscribe to queue additions - same as your web app
  static const String onQueueAdd = '''
    subscription OnQueueAdd(\$jamSessionId: ID!) {
      onQueueAdd(jamSessionId: \$jamSessionId) {
        jamSessionId
        queue
      }
    }
  ''';

  // Subscribe to queue removals - same as your web app
  static const String onQueueRemove = '''
    subscription OnQueueRemove(\$jamSessionId: ID!) {
      onQueueRemove(jamSessionId: \$jamSessionId) {
        jamSessionId
        queue
      }
    }
  ''';

  // Subscribe to slide config changes - same as your web app
  static const String onJamSlideConfigChange = '''
    subscription OnJamSlideConfigChange(\$jamSessionId: ID!) {
      onJamSlideConfigChange(jamSessionId: \$jamSessionId) {
        jamSessionId
        textSize
      }
    }
  ''';

  // Subscribe to any queue update (set/add/remove)
  static const String onJamQueueUpdate = '''
    subscription OnJamQueueUpdate(\$jamSessionId: ID!) {
      onJamQueueUpdate(jamSessionId: \$jamSessionId) {
        jamSessionId
        queue
        revision
        currentSongIndex
      }
    }
  ''';
}
