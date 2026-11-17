import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { v4 as uuidv4 } from 'uuid'
import { ChordImportRecord, putImport } from './store'

export const handler = async (event: AppSyncResolverEvent<{
  userId: string, songId: string, jamId: string, title: string, artist?: string | null
}, null>) => {
  const b = event.arguments
  if (!b?.userId || !b.songId || !b.jamId || !b.title?.trim()) {
    console.error('userId, songId, jamId, and title are required')
    return
  }
  const now = Date.now()
  const record: ChordImportRecord = {
    requestId: uuidv4(),
    userId: b.userId,
    songId: b.songId,
    jamId: b.jamId,
    title: b.title.trim(),
    ...(b.artist?.trim() ? { artist: b.artist.trim() } : {}),
    status: 'PENDING',
    createdAt: now,
    updatedAt: now,
  }
  const dynamo = new DynamoDBClient({})
  await putImport(dynamo, record)
  return record
}
