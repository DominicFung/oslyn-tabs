import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { planRecordingUpload } from './plan.ts'

const songId = '5618be0c-13c8-4ed3-8adf-bcba7ee88429'
const sessionId = '2aaed060-5512-42cf-bb74-5be8a2db073e'

function request(overrides: Record<string, unknown> = {}) {
  return {
    songId,
    sessionId,
    recordedAt: '2026-11-27T19:30:42.574Z',
    objects: [
      { name: 'part-0001.webm', contentType: 'audio/webm', bytes: 1024 },
      { name: 'part-0001.json', contentType: 'application/json', bytes: 2048 },
      { name: 'manifest.json', contentType: 'application/json', bytes: 512 },
    ],
    ...overrides,
  }
}

describe('recording upload plan', () => {
  it('builds a follow-recordings prefix and keeps the content types', () => {
    const plan = planRecordingUpload(request())
    assert.equal(plan.ok, true)
    if (!plan.ok) return
    assert.equal(plan.prefix, `follow-recordings/${songId}/2026-11-27T193042574Z-${sessionId}/`)
    assert.deepEqual(plan.objects.map((object) => [object.name, object.contentType]), [
      ['part-0001.webm', 'audio/webm'],
      ['part-0001.json', 'application/json'],
      ['manifest.json', 'application/json'],
    ])
    assert.ok(plan.objects.every((object) => object.key.startsWith(plan.prefix)))
  })

  it('rejects a bad id, a mismatched type, a huge webm, and a stray name', () => {
    assert.equal(planRecordingUpload(request({ songId: 'unknown' })).ok, false)
    assert.equal(planRecordingUpload(request({ sessionId: '../etc' })).ok, false)
    const typed = planRecordingUpload(request({
      objects: [{ name: 'part-0001.webm', contentType: 'application/json', bytes: 10 }],
    }))
    assert.equal(typed.ok, false)
    const huge = planRecordingUpload(request({
      objects: [{ name: 'audio.webm', contentType: 'audio/webm', bytes: 25_000_001 }],
    }))
    assert.equal(huge.ok, false)
    if (!huge.ok) assert.equal(huge.status, 413)
    const stray = planRecordingUpload(request({
      objects: [{ name: '../secret', contentType: 'application/json', bytes: 10 }],
    }))
    assert.equal(stray.ok, false)
  })
})
