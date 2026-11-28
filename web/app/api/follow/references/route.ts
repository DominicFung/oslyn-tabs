import { GetObjectCommand, ListObjectsV2Command, S3Client, S3ClientConfig } from '@aws-sdk/client-s3'
import { NextResponse } from 'next/server'
import cdk from '@/cdk-outputs.json'
import { stitchParts, type FollowChunkPart, type FollowManifest } from '@/core/follow'
import { referenceFromSession, type TakeReference } from '@/core/pageDtw'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_TAKES = 6

function s3Client(): S3Client {
  const config = { region: 'us-east-1' } as S3ClientConfig
  if (process.env.NODE_ENV === 'development') {
    config.credentials = {
      accessKeyId: cdk['oslynstudio-IamStack'].AccessKey,
      secretAccessKey: cdk['oslynstudio-IamStack'].SecretKey,
    }
  }
  return new S3Client(config)
}

async function readJson(client: S3Client, bucket: string, key: string): Promise<unknown> {
  const out = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
  const text = await out.Body?.transformToString()
  if (!text) return null
  return JSON.parse(text)
}

function shrink(take: TakeReference): TakeReference {
  return {
    id: take.id,
    times: take.times,
    segments: take.segments,
    features: take.features.map((frame) => frame.map((value) => Math.round(value * 1000) / 1000)),
  }
}

/** Read-only. Lists this song's existing follow recordings and returns page alignments. No new AWS resources. */
export async function GET(request: Request) {
  const songId = new URL(request.url).searchParams.get('songId') || ''
  if (!UUID.test(songId)) {
    return NextResponse.json({ ok: false, message: 'songId must be a UUID.' }, { status: 400 })
  }
  const bucket = cdk['oslynstudio-S3Stack'].bucketName
  try {
    const client = s3Client()
    const listed = await client.send(new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: `follow-recordings/${songId}/`,
    }))
    const keys = (listed.Contents || []).map((item) => item.Key || '').filter((key) => key.endsWith('.json'))
    const folders = new Map<string, string[]>()
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const folder = key.slice(0, key.lastIndexOf('/') + 1)
      const list = folders.get(folder) || []
      list.push(key)
      folders.set(folder, list)
    }
    const names: string[] = []
    folders.forEach((_keys, folder) => names.push(folder))
    names.sort().reverse()
    const takes: TakeReference[] = []
    for (let i = 0; i < names.length && takes.length < MAX_TAKES; i++) {
      const folderKeys = folders.get(names[i]) || []
      const manifestKey = folderKeys.filter((key) => key.endsWith('/manifest.json'))[0]
      const partKeys = folderKeys.filter((key) => /part-\d{4}\.json$/.test(key)).sort()
      if (!manifestKey || partKeys.length === 0) continue
      try {
        const manifest = await readJson(client, bucket, manifestKey) as FollowManifest
        const parts: FollowChunkPart[] = []
        for (let p = 0; p < partKeys.length; p++) {
          const part = await readJson(client, bucket, partKeys[p]) as FollowChunkPart
          if (part) parts.push(part)
        }
        const session = stitchParts(manifest, parts)
        const ref = referenceFromSession(session, names[i])
        if (ref) takes.push(shrink(ref))
      } catch { /* one bad take does not hide the others */ }
    }
    return NextResponse.json({ ok: true, takes })
  } catch {
    return NextResponse.json({ ok: false, message: 'Past takes are not available.' }, { status: 503 })
  }
}
