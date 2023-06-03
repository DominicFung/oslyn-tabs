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
      currentSong {
        key
      }
      currentLine
      startDate
      endDate
    }
  }
`;
