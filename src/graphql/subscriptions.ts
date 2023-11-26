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
      key
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
export const onJamSlideConfigChange = /* GraphQL */ `
  subscription OnJamSlideConfigChange($jamSessionId: ID!) {
    onJamSlideConfigChange(jamSessionId: $jamSessionId) {
      jamSessionId
      textSize
    }
  }
`;
export const onEnterJam = /* GraphQL */ `
  subscription OnEnterJam($jamSessionId: ID!) {
    onEnterJam(jamSessionId: $jamSessionId) {
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
            CCLISongTitle
            CCLISongWriter
            CCLICopyrightNotice
            CCLILicenseNumber
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
            order
          }
          bands {
            bandId
            imageUrl
            name
            description
            policy
          }
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
            CCLISongTitle
            CCLISongWriter
            CCLICopyrightNotice
            CCLILicenseNumber
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
            order
          }
          bands {
            bandId
            imageUrl
            name
            description
            policy
          }
        }
      }
    }
  }
`;
export const onExitJam = /* GraphQL */ `
  subscription OnExitJam($jamSessionId: ID!) {
    onExitJam(jamSessionId: $jamSessionId) {
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
            CCLISongTitle
            CCLISongWriter
            CCLICopyrightNotice
            CCLILicenseNumber
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
            order
          }
          bands {
            bandId
            imageUrl
            name
            description
            policy
          }
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
            CCLISongTitle
            CCLISongWriter
            CCLICopyrightNotice
            CCLILicenseNumber
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
            order
          }
          bands {
            bandId
            imageUrl
            name
            description
            policy
          }
        }
      }
    }
  }
`;
