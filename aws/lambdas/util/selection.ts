/** Attributes a list view needs. chordSheet and recordings stay off this projection. */
export const SONG_LIST_PROJECTION =
  'songId, title, artist, album, albumCover, chordSheetKey, userId, isApproved, version, beat, adminIds, editorIds, viewerIds'

const HEAVY_SONG_FIELDS = ['chordSheet', 'recordings']
const HEAVY_USER_FIELDS = ['friends', 'songsCreated', 'labelledRecording', 'likedSongs', 'bands', 'editHistory']

/** Match a selection-set path segment. `chordSheetKey` must not count as `chordSheet`. */
function selectsField(selectionSetList: string[] | undefined, field: string): boolean {
  return (selectionSetList || []).some((path) => path.split('/').includes(field))
}

export function wantsHeavySongFields(selectionSetList?: string[]): boolean {
  return selectsField(selectionSetList, 'chordSheet') || selectsField(selectionSetList, 'recordings')
}

export function songReadOptions(selectionSetList?: string[]): { projectionExpression?: string } {
  if (wantsHeavySongFields(selectionSetList)) return {}
  return { projectionExpression: SONG_LIST_PROJECTION }
}

export function normalizeSong(song: any, selectionSetList?: string[]): any {
  if (!song.recordings) song.recordings = []
  if (!song.editors) song.editors = []
  if (!song.viewers) song.viewers = []
  if (!Array.isArray(song.bandIds)) song.bandIds = []

  for (const field of HEAVY_SONG_FIELDS) {
    if (!selectsField(selectionSetList, field)) delete song[field]
  }

  if (song.creator && typeof song.creator === 'object') {
    normalizeUser(song.creator, selectionSetList)
  }

  return song
}

export function normalizeUser(user: any, selectionSetList?: string[]): any {
  if (!user.labelledRecording) user.labelledRecording = []
  if (!user.songsCreated) user.songsCreated = []
  if (!user.editHistory) user.editHistory = []
  if (!user.likedSongs) user.likedSongs = []
  if (!user.friends) user.friends = []

  for (const field of HEAVY_USER_FIELDS) {
    if (!selectsField(selectionSetList, field)) delete user[field]
  }

  return user
}
