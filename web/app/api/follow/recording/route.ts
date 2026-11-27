import { NextResponse } from 'next/server'
import { PutObjectCommand, S3Client, S3ClientConfig } from '@aws-sdk/client-s3'
import cdk from '@/cdk-outputs.json'

export const runtime = 'nodejs'

const UNAVAILABLE = 'Upload is not available yet. Download the zip instead.'

function s3Client(): S3Client {
  const config = { region: 'us-east-1' } as S3ClientConfig
  if (process.env.NODE_ENV === 'development') {
    config.credentials = {
      accessKeyId: cdk['oslynstudio-IamStack'].AccessKey,
      secretAccessKey: cdk['oslynstudio-IamStack'].SecretKey,
    }
    config.region = 'us-east-1'
  }
  return new S3Client(config)
}

function safeId(value: string): string {
  const cleaned = value.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 80)
  return cleaned || 'unknown'
}

export async function POST(request: Request) {
  let form: FormData
  try { form = await request.formData() } catch {
    return NextResponse.json({ ok: false, message: 'Expected a recording form.' }, { status: 400 })
  }
  const raw = form.get('session')
  if (typeof raw !== 'string' || raw.trim() === '') {
    return NextResponse.json({ ok: false, message: 'Missing session.json' }, { status: 400 })
  }
  let session: { songId?: string, recordedAt?: string }
  try { session = JSON.parse(raw) } catch {
    return NextResponse.json({ ok: false, message: 'session.json is not valid JSON' }, { status: 400 })
  }
  if (!session || typeof session !== 'object') {
    return NextResponse.json({ ok: false, message: 'Missing session.json' }, { status: 400 })
  }

  const songId = safeId(session.songId || 'unknown')
  const stamp = safeId((session.recordedAt || new Date().toISOString()).replace(/[:.]/g, ''))
  const sessionId = safeId(crypto.randomUUID())
  const prefix = `follow-recordings/${songId}/${stamp}-${sessionId}/`
  const audio = form.get('audio')
  const client = s3Client()
  const bucket = cdk['oslynstudio-S3Stack'].bucketName

  try {
    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: `${prefix}session.json`,
      Body: raw,
      ContentType: 'application/json',
    }))
    if (audio instanceof Blob) {
      if (audio.size > 25_000_000) {
        return NextResponse.json({ ok: false, message: 'Recording is larger than 25 MB.' }, { status: 413 })
      }
      await client.send(new PutObjectCommand({
        Bucket: bucket,
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
