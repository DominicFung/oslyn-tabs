/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onNextPage = /* GraphQL */ `subscription OnNextPage($jamSessionId: ID!) {
  onNextPage(jamSessionId: $jamSessionId) {
    jamSessionId
    page
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnNextPageSubscriptionVariables,
  APITypes.OnNextPageSubscription
>;
export const onNextSong = /* GraphQL */ `subscription OnNextSong($jamSessionId: ID!) {
  onNextSong(jamSessionId: $jamSessionId) {
    jamSessionId
    song
    page
    key
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnNextSongSubscriptionVariables,
  APITypes.OnNextSongSubscription
>;
export const onSongKey = /* GraphQL */ `subscription OnSongKey($jamSessionId: ID!) {
  onSongKey(jamSessionId: $jamSessionId) {
    jamSessionId
    song
    key
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnSongKeySubscriptionVariables,
  APITypes.OnSongKeySubscription
>;
export const onJamSlideConfigChange = /* GraphQL */ `subscription OnJamSlideConfigChange($jamSessionId: ID!) {
  onJamSlideConfigChange(jamSessionId: $jamSessionId) {
    jamSessionId
    textSize
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnJamSlideConfigChangeSubscriptionVariables,
  APITypes.OnJamSlideConfigChangeSubscription
>;
export const onEnterJam = /* GraphQL */ `subscription OnEnterJam($jamSessionId: ID!) {
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
          __typename
        }
        labelledRecording {
          recordingId
          songId
          userId
          status
          audioFile
          samplingRate
          lyric
          comment
          createDate
          updateDate
          __typename
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
          __typename
        }
        likedSongs {
          key
          order
          __typename
        }
        bands {
          bandId
          imageUrl
          name
          description
          policy
          __typename
        }
        __typename
      }
      __typename
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
          __typename
        }
        labelledRecording {
          recordingId
          songId
          userId
          status
          audioFile
          samplingRate
          lyric
          comment
          createDate
          updateDate
          __typename
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
          __typename
        }
        likedSongs {
          key
          order
          __typename
        }
        bands {
          bandId
          imageUrl
          name
          description
          policy
          __typename
        }
        __typename
      }
      __typename
    }
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnEnterJamSubscriptionVariables,
  APITypes.OnEnterJamSubscription
>;
export const onExitJam = /* GraphQL */ `subscription OnExitJam($jamSessionId: ID!) {
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
          __typename
        }
        labelledRecording {
          recordingId
          songId
          userId
          status
          audioFile
          samplingRate
          lyric
          comment
          createDate
          updateDate
          __typename
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
          __typename
        }
        likedSongs {
          key
          order
          __typename
        }
        bands {
          bandId
          imageUrl
          name
          description
          policy
          __typename
        }
        __typename
      }
      __typename
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
          __typename
        }
        labelledRecording {
          recordingId
          songId
          userId
          status
          audioFile
          samplingRate
          lyric
          comment
          createDate
          updateDate
          __typename
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
          __typename
        }
        likedSongs {
          key
          order
          __typename
        }
        bands {
          bandId
          imageUrl
          name
          description
          policy
          __typename
        }
        __typename
      }
      __typename
    }
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnExitJamSubscriptionVariables,
  APITypes.OnExitJamSubscription
>;
