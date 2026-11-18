import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import { _Song } from '../../type'
import { jamsContaining, loadSetsAndJams, setsContaining } from './usage'

const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{ songId: string, userId: string }, null>) => {
  const b = event.arguments
  if (!b?.songId || !b.userId) { console.error('songId and userId are required'); return }
  const dynamo = new DynamoDBClient({})
  const song = await ownedSong(dynamo, b.songId, b.userId)
  if (!song) return

  const { sets, jams } = await loadSetsAndJams(dynamo)
  return {
    songId: b.songId,
    setCount: setsContaining(sets, b.songId).length,
    jamCount: jamsContaining(jams, sets, b.songId, true).length,
  }
}

export async function ownedSong(dynamo: DynamoDBClient, songId: string, userId: string): Promise<_Song | undefined> {
  const res = await dynamo.send(new GetItemCommand({
    TableName: SONG_TABLE_NAME,
    Key: { songId: { S: songId } },
  }))
  if (!res.Item) { console.error(`song not found: ${songId}`); return }
  const song = unmarshall(res.Item) as _Song
  if (song.userId !== userId) { console.error(`user ${userId} does not own song ${songId}`); return }
  return song
}
