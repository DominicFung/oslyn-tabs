/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onNextLine = /* GraphQL */ `
  subscription OnNextLine($hash: String!) {
    onNextLine(hash: $hash) {
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
