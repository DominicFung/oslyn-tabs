import { handler } from './lambdas/spotifyPlaylistToJamSession'

// https://open.spotify.com/playlist/3JcodCNT1R437MAXrRnJ93?si=905d337ace6746c0
handler({
  arguments: {
    playlistId: '3JcodCNT1R437MAXrRnJ93'
  },
  source: null,
  request: {
    headers: {},
    domainName: null
  },
  info: {
    selectionSetList: [],
    selectionSetGraphQL: '',
    parentTypeName: '',
    fieldName: '',
    variables: {}
  },
  prev: null,
  stash: {}
})