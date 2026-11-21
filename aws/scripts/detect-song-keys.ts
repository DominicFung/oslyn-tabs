/**
 * Dry-run key detection over oslynstudio-SongTable.
 * Default: read songs and write a CSV. Does not update DynamoDB.
 * --apply writes a detected key only where chordSheetKey is missing.
 * --apply --overwrite replaces every detected key. Do not use that without a reason.
 *
 *   npx tsx aws/scripts/detect-song-keys.ts
 *   npx tsx aws/scripts/detect-song-keys.ts --out aws/scripts/key-detection-dry-run.csv
 */
import { writeFileSync } from 'fs'
import { DynamoDBClient, ScanCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import { detectKey } from '../lambdas/util/detectKey'

const TABLE = process.env.SONG_TABLE_NAME || 'oslynstudio-SongTable'
const REGION = process.env.AWS_REGION || 'us-east-1'

type Row = {
  songId?: string
  title?: string
  artist?: string
  chordSheet?: string
  chordSheetKey?: string
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

function sameKey(current: string, detected: string): boolean {
  const norm = (value: string) => value.trim().toLowerCase().replace(/\s+/g, '')
  return norm(current) === norm(detected)
}

async function main() {
  const apply = process.argv.includes('--apply')
  const overwrite = process.argv.includes('--overwrite')
  const outFlag = process.argv.indexOf('--out')
  const out = outFlag >= 0 ? process.argv[outFlag + 1] : 'aws/scripts/key-detection-dry-run.csv'
  const dynamo = new DynamoDBClient({ region: REGION })
  const songs: Row[] = []
  let startKey: Record<string, any> | undefined
  do {
    const page = await dynamo.send(new ScanCommand({
      TableName: TABLE,
      ExclusiveStartKey: startKey,
      ProjectionExpression: 'songId, title, artist, chordSheetKey, chordSheet',
    }))
    for (const item of page.Items || []) songs.push(unmarshall(item) as Row)
    startKey = page.LastEvaluatedKey
  } while (startKey)

  const lines = ['songId,title,artist,currentKey,detectedKey,confidence,result']
  let agree = 0
  let disagree = 0
  let none = 0
  let noChart = 0
  for (const song of songs) {
    const detected = song.chordSheet?.trim() ? detectKey(song.chordSheet) : null
    const current = (song.chordSheetKey || '').trim()
    let result = 'no-chart'
    if (!song.chordSheet?.trim()) { noChart += 1; result = 'no-chart' }
    else if (!detected) { none += 1; result = 'no-chords' }
    else if (!current) { none += 1; result = 'missing' }
    else if (sameKey(current, detected.key)) { agree += 1; result = 'agree' }
    else { disagree += 1; result = 'disagree' }
    lines.push([
      song.songId || '',
      song.title || '',
      song.artist || '',
      current,
      detected?.key || '',
      detected ? String(detected.confidence) : '',
      result,
    ].map(csvCell).join(','))
    if (apply && detected && song.songId && (overwrite || !current)) {
      const values: Record<string, { S: string }> = { ':key': { S: detected.key } }
      if (!overwrite) values[':empty'] = { S: '' }
      await dynamo.send(new UpdateItemCommand({
        TableName: TABLE,
        Key: { songId: { S: song.songId } },
        UpdateExpression: 'SET chordSheetKey = :key',
        ExpressionAttributeValues: values,
        ...(overwrite ? {} : { ConditionExpression: 'attribute_not_exists(chordSheetKey) OR chordSheetKey = :empty' }),
      }))
    }
  }
  writeFileSync(out, `${lines.join('\n')}\n`)
  console.log(`songs ${songs.length}`)
  console.log(`agree ${agree}`)
  console.log(`disagree ${disagree}`)
  console.log(`missing-or-undetected ${none}`)
  console.log(`no-chart ${noChart}`)
  console.log(`wrote ${out}`)
  if (agree + disagree > 0) {
    console.log(`accuracy ${Math.round((1000 * agree) / (agree + disagree)) / 10}% of songs that already have a key and a detection`)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
