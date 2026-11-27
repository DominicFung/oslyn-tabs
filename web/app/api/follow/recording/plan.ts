const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const RECORDED_AT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,9})?Z$/
const OBJECT_NAME = /^(manifest\.json|session\.json|audio\.webm|part-\d{4}\.(json|webm))$/

export const AUDIO_BYTES_LIMIT = 25_000_000
export const JSON_BYTES_LIMIT = 25_000_000
export const PRESIGN_TTL_SECONDS = 600

export type PlannedObject = { name: string, key: string, contentType: string }

export type UploadPlan =
  | { ok: true, prefix: string, objects: PlannedObject[] }
  | { ok: false, status: number, message: string }

function contentTypeFor(name: string): string | null {
  if (name.endsWith('.json')) return 'application/json'
  if (name.endsWith('.webm')) return 'audio/webm'
  return null
}

function byteLimit(contentType: string): number {
  return contentType === 'audio/webm' ? AUDIO_BYTES_LIMIT : JSON_BYTES_LIMIT
}

/** Names, ids, and sizes for one presigned PUT batch. The client sends bytes; the files stay off this request. */
export function planRecordingUpload(input: unknown): UploadPlan {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, status: 400, message: 'Expected a recording request.' }
  }
  const body = input as { songId?: unknown, sessionId?: unknown, recordedAt?: unknown, objects?: unknown }
  if (typeof body.songId !== 'string' || !UUID.test(body.songId)) {
    return { ok: false, status: 400, message: 'songId must be a UUID.' }
  }
  if (typeof body.sessionId !== 'string' || !UUID.test(body.sessionId)) {
    return { ok: false, status: 400, message: 'sessionId must be a UUID.' }
  }
  if (typeof body.recordedAt !== 'string' || !RECORDED_AT.test(body.recordedAt)) {
    return { ok: false, status: 400, message: 'recordedAt must be a UTC timestamp.' }
  }
  if (!Array.isArray(body.objects) || body.objects.length === 0 || body.objects.length > 6) {
    return { ok: false, status: 400, message: 'Expected the files to upload.' }
  }
  const stamp = body.recordedAt.replace(/[:.]/g, '')
  const prefix = `follow-recordings/${body.songId}/${stamp}-${body.sessionId}/`
  const seen = new Set<string>()
  const objects: PlannedObject[] = []
  for (const entry of body.objects) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      return { ok: false, status: 400, message: 'Each file needs a name, type, and size.' }
    }
    const file = entry as { name?: unknown, contentType?: unknown, bytes?: unknown }
    if (typeof file.name !== 'string' || !OBJECT_NAME.test(file.name) || seen.has(file.name)) {
      return { ok: false, status: 400, message: 'File name is not a follow-recording part.' }
    }
    const contentType = contentTypeFor(file.name)
    if (typeof file.contentType !== 'string' || file.contentType !== contentType) {
      return { ok: false, status: 400, message: 'Content type does not match the file.' }
    }
    if (typeof file.bytes !== 'number' || !Number.isInteger(file.bytes) || file.bytes < 1) {
      return { ok: false, status: 400, message: 'File size is missing.' }
    }
    if (file.bytes > byteLimit(contentType)) {
      return { ok: false, status: 413, message: 'Recording is larger than 25 MB.' }
    }
    seen.add(file.name)
    objects.push({ name: file.name, key: `${prefix}${file.name}`, contentType })
  }
  return { ok: true, prefix, objects }
}
