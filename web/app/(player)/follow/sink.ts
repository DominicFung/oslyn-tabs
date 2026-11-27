import { sessionZip, type FollowSessionFile } from '@/core/follow'

export type SavedRecording = { ok: boolean, message: string, prefix?: string }

/** Where a debug recording goes. Download is local. S3 reuses the project bucket. */
export interface RecordingSink {
  save(session: FollowSessionFile, audio: Uint8Array | null): Promise<SavedRecording>
}

export class DownloadSink implements RecordingSink {
  async save(session: FollowSessionFile, audio: Uint8Array | null): Promise<SavedRecording> {
    const bytes = sessionZip(session, audio)
    const blob = new Blob([bytes], { type: 'application/zip' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `follow-${session.songId}-${session.recordedAt.replace(/[:.]/g, '')}.zip`
    link.click()
    URL.revokeObjectURL(url)
    return { ok: true, message: 'Downloaded session.zip' }
  }
}

/** Uploads through the Next.js route so credentials stay on the server. */
export class ProjectBucketSink implements RecordingSink {
  async save(session: FollowSessionFile, audio: Uint8Array | null): Promise<SavedRecording> {
    const body = new FormData()
    body.set('session', JSON.stringify(session))
    if (audio && audio.length) body.set('audio', new Blob([audio], { type: 'audio/webm' }), 'audio.webm')
    let response: Response
    try {
      response = await fetch('/api/follow/recording', { method: 'POST', body })
    } catch {
      return { ok: false, message: 'Upload is not available yet. Download the zip instead.' }
    }
    const payload = await response.json().catch(() => null) as SavedRecording | null
    if (!response.ok || !payload?.ok) {
      return { ok: false, message: payload?.message || 'Upload is not available yet. Download the zip instead.' }
    }
    return payload
  }
}
