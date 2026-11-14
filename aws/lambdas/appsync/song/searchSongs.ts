import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { normalizeSong } from '../../util/selection'
import { _Song } from '../../type'
import { bandSongIds, loadUser, matchesQuery, ownSongs, sharedSongs, songsByIds } from './library'

const RESULT_LIMIT = 40

export const handler = async (event: AppSyncResolverEvent<{
  userId: string, query: string
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b?.userId) { console.error('b.userId is empty'); return [] }
  const query = (b.query || '').trim()
  if (!query) return []
  if (query.length > 200) { console.error('query is too long'); return [] }

  const dynamo = new DynamoDBClient({})
  const user = await loadUser(dynamo, b.userId)
  if (!user) { console.error(`user not found: ${b.userId}`); return [] }

  const selection = event.info.selectionSetList
  const own = await ownSongs(dynamo, b.userId, selection)
  const shared = await sharedSongs(dynamo, b.userId, user, selection)
  const onBands = await bandSongIds(dynamo, b.userId, user)

  const seen = new Set<string>()
  const ordered: _Song[] = []
  const push = (song: _Song) => {
    if (!song?.songId || seen.has(song.songId)) return
    seen.add(song.songId)
    ordered.push(song)
  }
  own.forEach(push)
  shared.forEach(push)

  const missingBandSongs = [...onBands].filter((id) => !seen.has(id))
  const bandSongs = await songsByIds(dynamo, missingBandSongs, selection)
  bandSongs.forEach(push)

  const matches = ordered
    .filter((song) => matchesQuery(song, query))
    .sort((a, b) => (a.title || '').localeCompare(b.title || ''))
    .slice(0, RESULT_LIMIT)
    .map((song) => normalizeSong(song, selection))

  console.log(`searchSongs "${query}" -> ${matches.length}`)
  return matches
}
