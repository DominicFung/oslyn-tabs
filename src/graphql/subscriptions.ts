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
      songId
      song
    }
  }
`;
