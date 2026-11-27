import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import { PutObjectCommand, S3Client, type S3ClientConfig } from '@aws-sdk/client-s3'

export const runtime = 'nodejs'

const UNAVAILABLE = 'Upload is not available yet. Download the zip instead.'

function loadOutputs(): Record<string, Record<string, string>> | null {
  for (const path of [join(process.cwd(), 'cdk-outputs.json'), join(process.cwd(), '..', 'cdk-outputs.json')]) {
    try { return JSON.parse(readFileSync(path, 'utf8')) } catch { /* try the next path */ }
  }
  return null
}

function s3ForBucket(): { client: S3Client, bucket: string } | null {
  const outputs = loadOutputs()
  const bucket = process.env.OSLYN_BUCKET || outputs?.['oslynstudio-S3Stack']?.bucketName
  if (!bucket) return null
  const config = { region: 'us-east-1' } as S3ClientConfig
  if (process.env.NODE_ENV === 'development') {
    const key = outputs?.['oslynstudio-IamStack']?.AccessKey
    const secret = outputs?.['oslynstudio-IamStack']?.SecretKey
    if (!key || !secret) return null
    config.credentials = { accessKeyId: key, secretAccessKey: secret }
  }
  return { client: new S3Client(config), bucket }
}

function safeId(value: string): string {
  const cleaned = value.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 80)
  return cleaned || 'unknown'
}

export async function POST(request: Request) {
  const storage = s3ForBucket()
  if (!storage) return NextResponse.json({ ok: false, message: UNAVAILABLE }, { status: 503 })

  let form: FormData
  try { form = await request.formData() } catch {
    return NextResponse.json({ ok: false, message: 'Expected a recording form.' }, { status: 400 })
  }
  const raw = form.get('session')
  if (typeof raw !== 'string') return NextResponse.json({ ok: false, message: 'Missing session.json' }, { status: 400 })
  let session: { songId?: string, recordedAt?: string }
  try { session = JSON.parse(raw) } catch {
    return NextResponse.json({ ok: false, message: 'session.json is not valid JSON' }, { status: 400 })
  }
  const songId = safeId(session.songId || 'unknown')
  const stamp = safeId((session.recordedAt || new Date().toISOString()).replace(/[:.]/g, ''))
  const sessionId = safeId(crypto.randomUUID())
  const prefix = `follow-recordings/${songId}/${stamp}-${sessionId}/`

  const audio = form.get('audio')
  try {
    await storage.client.send(new PutObjectCommand({
      Bucket: storage.bucket,
      Key: `${prefix}session.json`,
      Body: raw,
      ContentType: 'application/json',
    }))
    if (audio instanceof Blob) {
      if (audio.size > 25_000_000) {
        return NextResponse.json({ ok: false, message: 'Recording is larger than 25 MB.' }, { status: 413 })
      }
      await storage.client.send(new PutObjectCommand({
        Bucket: storage.bucket,
        Key: `${prefix}audio.webm`,
        Body: Buffer.from(await audio.arrayBuffer()),
        ContentType: audio.type || 'audio/webm',
      }))
    }
  } catch {
    return NextResponse.json({ ok: false, message: UNAVAILABLE }, { status: 503 })
  }
  return NextResponse.json({ ok: true, message: `Uploaded to ${prefix}`, prefix })
}
