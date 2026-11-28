import {
  chunkZip, partFileNames, sessionZip,
  type FollowChunkPart, type FollowManifest, type FollowSessionFile,
} from '@/core/follow'

export type SavedRecording = { ok: boolean, message: string, prefix?: string }

const FALLBACK = 'Upload is not available yet. Download the zip instead.'

/** Chrome drops keepalive bodies above about 64KB. Stay under that. */
export const UNLOAD_UPLOAD_LIMIT = 60_000
export const UPLOAD_ATTEMPTS = 3

export type UploadFile = { name: string, body: Blob, contentType: string }

type PresignResponse = { ok?: boolean, message?: string, prefix?: string, urls?: Record<string, string> }

export function downloadZip(name: string, bytes: Uint8Array) {
  const blob = new Blob([bytes], { type: 'application/zip' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

/** Where a debug recording goes. Download is local. S3 is a direct PUT with a presigned URL. */
export interface RecordingSink {
  save(session: FollowSessionFile, audio: Uint8Array | null): Promise<SavedRecording>
}

export class DownloadSink implements RecordingSink {
  async save(session: FollowSessionFile, audio: Uint8Array | null): Promise<SavedRecording> {
    downloadZip(
      `follow-${session.songId}-${session.recordedAt.replace(/[:.]/g, '')}.zip`,
      sessionZip(session, audio),
    )
    return { ok: true, message: 'Downloaded session.zip' }
  }
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function putOnce(
  songId: string,
  sessionId: string,
  recordedAt: string,
  files: UploadFile[],
  keepalive: boolean,
  jamId?: string,
): Promise<SavedRecording & { retry?: boolean }> {
  let response: Response
  try {
    response = await fetch('/api/follow/recording', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive,
      body: JSON.stringify({
        songId,
        sessionId,
        recordedAt,
        jamId,
        objects: files.map((file) => ({ name: file.name, contentType: file.contentType, bytes: file.body.size })),
      }),
    })
  } catch {
    return { ok: false, message: FALLBACK, retry: true }
  }
  const payload = await response.json().catch(() => null) as PresignResponse | null
  if (!response.ok || !payload?.ok || !payload.urls) {
    return { ok: false, message: payload?.message || FALLBACK, retry: response.status >= 500 }
  }
  try {
    for (const file of files) {
      const url = payload.urls[file.name]
      if (!url) return { ok: false, message: FALLBACK, retry: true }
      const put = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': file.contentType },
        body: file.body,
        keepalive,
      })
      if (!put.ok) return { ok: false, message: FALLBACK, retry: put.status >= 500 || put.status === 403 }
    }
  } catch {
    return { ok: false, message: FALLBACK, retry: true }
  }
  return { ok: true, message: `Uploaded to ${payload.prefix}`, prefix: payload.prefix }
}

/** Presign, PUT, and retry a failed batch. A rejected request is not retried. */
export async function uploadFiles(
  songId: string,
  sessionId: string,
  recordedAt: string,
  files: UploadFile[],
  options: { keepalive?: boolean, attempts?: number, jamId?: string } = {},
): Promise<SavedRecording> {
  const keepalive = options.keepalive === true
  const fitting = keepalive ? files.filter((file) => file.body.size <= UNLOAD_UPLOAD_LIMIT) : files
  if (fitting.length === 0) {
    return { ok: false, message: 'Chunk is too large to send while the page is closing.' }
  }
  const attempts = keepalive ? 1 : options.attempts ?? UPLOAD_ATTEMPTS
  let last: SavedRecording = { ok: false, message: FALLBACK }
  for (let attempt = 0; attempt < attempts; attempt++) {
    const result = await putOnce(songId, sessionId, recordedAt, fitting, keepalive, options.jamId)
    if (result.ok) return { ok: true, message: result.message, prefix: result.prefix }
    last = { ok: false, message: result.message }
    if (!result.retry) break
    if (attempt + 1 < attempts) await sleep(300 * (attempt + 1))
  }
  return last
}

export function chunkUploadFiles(manifest: FollowManifest, part: FollowChunkPart, audio: Blob | null): UploadFile[] {
  const names = partFileNames(part.chunk)
  const json = (value: unknown) => new Blob([JSON.stringify(value)], { type: 'application/json' })
  const files: UploadFile[] = [
    { name: 'manifest.json', body: json(manifest), contentType: 'application/json' },
    { name: names.json, body: json(part), contentType: 'application/json' },
  ]
  if (audio && audio.size > 0 && manifest.chunks.some((chunk) => chunk.part === part.chunk && chunk.audio === names.audio)) {
    files.push({ name: names.audio, body: audio, contentType: 'audio/webm' })
  }
  return files
}

export function failedChunkZip(manifest: FollowManifest, part: FollowChunkPart, audio: Uint8Array | null): Uint8Array {
  return chunkZip(manifest, part, audio)
}
