import { NextResponse } from 'next/server'
import { PutObjectCommand, S3Client, S3ClientConfig } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import cdk from '@/cdk-outputs.json'
import { planRecordingUpload, PRESIGN_TTL_SECONDS } from './plan'

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

export async function POST(request: Request) {
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ ok: false, message: 'Expected a recording request.' }, { status: 400 })
  }
  const planned = planRecordingUpload(body)
  if (!planned.ok) {
    return NextResponse.json({ ok: false, message: planned.message }, { status: planned.status })
  }
  const bucket = cdk['oslynstudio-S3Stack'].bucketName
  try {
    const client = s3Client()
    const urls: Record<string, string> = {}
    for (const object of planned.objects) {
      urls[object.name] = await getSignedUrl(client, new PutObjectCommand({
        Bucket: bucket,
        Key: object.key,
        ContentType: object.contentType,
      }), { expiresIn: PRESIGN_TTL_SECONDS })
    }
    return NextResponse.json({ ok: true, prefix: planned.prefix, urls })
  } catch {
    return NextResponse.json({ ok: false, message: UNAVAILABLE }, { status: 503 })
  }
}
