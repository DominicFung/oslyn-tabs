import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { GetObjectCommand, ListObjectsV2Command, S3Client, type S3ClientConfig } from '@aws-sdk/client-s3'
// Node's type stripper needs the .ts specifier. The app tsconfig does not allow it.
// @ts-expect-error TS5097
import { scoreSession, type FollowSessionFile } from '../core/follow.ts'

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function loadOutputs(): Record<string, Record<string, string>> | null {
  for (const path of [join(process.cwd(), 'cdk-outputs.json'), join(process.cwd(), '..', 'cdk-outputs.json')]) {
    try { return JSON.parse(readFileSync(path, 'utf8')) } catch { /* next */ }
  }
  return null
}

function clientAndBucket(): { client: S3Client, bucket: string } {
  const outputs = loadOutputs()
  const bucket = arg('--bucket') || process.env.OSLYN_BUCKET || outputs?.['oslynstudio-S3Stack']?.bucketName
  if (!bucket) {
    console.error('No bucket. Pass --bucket or set OSLYN_BUCKET, or provide cdk-outputs.json.')
    process.exit(1)
  }
  const config = { region: 'us-east-1' } as S3ClientConfig
  if (!process.env.AWS_ACCESS_KEY_ID && !process.env.AWS_PROFILE) {
    const key = outputs?.['oslynstudio-IamStack']?.AccessKey
    const secret = outputs?.['oslynstudio-IamStack']?.SecretKey
    if (key && secret) config.credentials = { accessKeyId: key, secretAccessKey: secret }
  }
  return { client: new S3Client(config), bucket }
}

async function bodyBytes(body: unknown): Promise<Uint8Array> {
  if (body && typeof (body as { transformToByteArray?: () => Promise<Uint8Array> }).transformToByteArray === 'function') {
    return (body as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray()
  }
  const chunks: Buffer[] = []
  for await (const chunk of body as AsyncIterable<Buffer>) chunks.push(Buffer.from(chunk))
  return new Uint8Array(Buffer.concat(chunks))
}

async function main() {
  const prefixArg = arg('--prefix')
  const name = arg('--name')
  if (!prefixArg || !name) {
    console.error('Usage: node --experimental-strip-types scripts/follow-fetch-recording.ts --prefix follow-recordings/<songId>/<stamp>-<sessionId>/ --name <fixture>')
    process.exit(1)
  }
  const prefix = prefixArg.endsWith('/') ? prefixArg : `${prefixArg}/`
  if (!prefix.startsWith('follow-recordings/')) {
    console.error('Prefix must start with follow-recordings/')
    process.exit(1)
  }
  const { client, bucket } = clientAndBucket()
  const listed = await client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix }))
  const keys = (listed.Contents || []).map((item) => item.Key || '').filter(Boolean)
  const sessionKey = keys.find((key) => key.endsWith('session.json'))
  if (!sessionKey) {
    console.error(`No session.json under ${prefix}`)
    process.exit(1)
  }
  const sessionObject = await client.send(new GetObjectCommand({ Bucket: bucket, Key: sessionKey }))
  const session = JSON.parse(new TextDecoder().decode(await bodyBytes(sessionObject.Body))) as FollowSessionFile
  const dir = join(process.cwd(), 'core', 'follow-fixtures', name)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'session.json'), JSON.stringify(session, null, 2))
  const audioKey = keys.find((key) => key.endsWith('audio.webm'))
  if (audioKey) {
    const audioObject = await client.send(new GetObjectCommand({ Bucket: bucket, Key: audioKey }))
    writeFileSync(join(dir, 'audio.webm'), await bodyBytes(audioObject.Body))
  }
  const report = scoreSession(session)
  const baselinePath = join(process.cwd(), 'core', 'follow-fixtures', 'baseline.json')
  const baseline = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, 'utf8')) as Record<string, number> : {}
  const floor = Math.max(0, Math.round((report.score - 0.05) * 100) / 100)
  baseline[name] = floor
  if (arg('--write-baseline') === 'yes' || process.argv.includes('--write-baseline')) {
    writeFileSync(baselinePath, JSON.stringify(baseline, null, 2) + '\n')
  }
  console.log(JSON.stringify({
    fixture: dir,
    prefix,
    shouldTurn: session.events.filter((event) => event.type === 'should-turn').length,
    score: Number(report.score.toFixed(3)),
    suggestedMinScore: floor,
    wroteBaseline: process.argv.includes('--write-baseline'),
  }, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Download failed')
  process.exit(1)
})
