import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { getImport, setImportStatus } from './store'
import { writeOwnedChordSheet } from '../jam/setLiveJamChordSheet'

export const handler = async (event: AppSyncResolverEvent<{
  requestId: string, chordSheet: string, sourceUrl: string
}, null>) => {
  const b = event.arguments
  if (!b?.requestId || !b.chordSheet?.trim() || !b.sourceUrl?.trim()) {
    console.error('requestId, chordSheet, and sourceUrl are required')
    return
  }
  const dynamo = new DynamoDBClient({})
  const record = await getImport(dynamo, b.requestId)
  if (!record) { console.error(`import not found: ${b.requestId}`); return }
  if (record.status !== 'IMPORTING' && record.status !== 'PENDING') {
    console.error(`import ${b.requestId} is ${record.status}`)
    return
  }

  const written = await writeOwnedChordSheet(dynamo, {
    jamSessionId: record.jamId,
    songId: record.songId,
    userId: record.userId,
    chordSheet: b.chordSheet,
    originLink: b.sourceUrl.trim(),
  })
  if (!written) { console.error(`could not write chords for ${record.songId}`); return }

  const saved = await setImportStatus(dynamo, record.requestId, 'DONE', {
    chosenUrl: b.sourceUrl.trim(),
    chordSheet: b.chordSheet,
  })
  if (!saved) return
  return { ...saved, detectedKey: written.song?.chordSheetKey || written.key }
}
