/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onNextPage = /* GraphQL */ `
  subscription OnNextPage($jamSessionId: ID!) {
    onNextPage(jamSessionId: $jamSessionId) {
      jamSessionId
      page
    }
  }
`;
export const onNextSong = /* GraphQL */ `
  subscription OnNextSong($jamSessionId: ID!) {
    onNextSong(jamSessionId: $jamSessionId) {
      jamSessionId
      song
      page
    }
  }
`;
export const onSongKey = /* GraphQL */ `
  subscription OnSongKey($jamSessionId: ID!) {
    onSongKey(jamSessionId: $jamSessionId) {
      jamSessionId
      song
      key
    }
  }
`;
export const onSignInToJamSession = /* GraphQL */ `
  subscription OnSignInToJamSession($jamSessionId: ID!) {
    onSignInToJamSession(jamSessionId: $jamSessionId) {
      active {
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
        friends {
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
          friends {
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
          viewers {
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
      guests
    }
  }
`;
export const onSignOutFromJamSession = /* GraphQL */ `
  subscription OnSignOutFromJamSession($jamSessionId: ID!) {
    onSignOutFromJamSession(jamSessionId: $jamSessionId) {
      active {
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
        friends {
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
          friends {
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
          viewers {
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
      guests
    }
  }
`;
