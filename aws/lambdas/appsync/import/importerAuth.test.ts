import { readFileSync } from 'fs'
import { join } from 'path'
import {
  IMPORTER_ADMIN_EMAIL,
  countsFromService,
  emailFromIdentity,
  importerProof,
  latestStartedAt,
  nextAuthSecretFromJson,
  verifyImporterCaller,
} from './importerAuth'
import { runImporter } from './importerControl'

const PROOF = '3603043ae879a98bf3b73a979e35bf81d935ad3b015731991a43738fbaca2cfc'

describe('importer auth', () => {
  it('normalizes the admin email and builds the shared proof', () => {
    expect(importerProof('test-secret', 'Mission.Possibleforsure@gmail.com')).toBe(PROOF)
  })

  it('reads NEXTAUTH_SECRET without treating other keys as the secret', () => {
    expect(nextAuthSecretFromJson(JSON.stringify({
      nextauth: { NEXTAUTH_SECRET: 'test-secret', google: { GOOGLE_CLIENT_SECRET: 'nope' } },
    }))).toBe('test-secret')
    expect(nextAuthSecretFromJson('not-json')).toBe('')
    expect(nextAuthSecretFromJson('{}')).toBe('')
  })

  it('accepts the admin identity without a browser proof', () => {
    expect(verifyImporterCaller({
      identity: { claims: { email: 'Mission.Possibleforsure@gmail.com' } },
      headers: {},
      secret: '',
    })).toEqual({ ok: true })
  })

  it('accepts an API-key call only with the admin HMAC', () => {
    const headers = {
      'X-Importer-Email': IMPORTER_ADMIN_EMAIL,
      'x-importer-proof': PROOF,
    }
    expect(verifyImporterCaller({ identity: { sourceIp: ['1.1.1.1'] }, headers, secret: 'test-secret' })).toEqual({ ok: true })
    expect(verifyImporterCaller({
      identity: null,
      headers: { ...headers, 'x-importer-proof': 'deadbeef' },
      secret: 'test-secret',
    })).toEqual({ ok: false })
    expect(verifyImporterCaller({
      identity: null,
      headers: { 'x-importer-email': 'other@gmail.com', 'x-importer-proof': PROOF },
      secret: 'test-secret',
    })).toEqual({ ok: false })
    expect(verifyImporterCaller({ identity: null, headers, secret: '' })).toEqual({ ok: false })
  })

  it('does not let a header override a different signed-in email', () => {
    expect(emailFromIdentity({ claims: { email: 'other@gmail.com' } })).toBe('other@gmail.com')
    expect(verifyImporterCaller({
      identity: { claims: { email: 'other@gmail.com' } },
      headers: { 'x-importer-email': IMPORTER_ADMIN_EMAIL, 'x-importer-proof': PROOF },
      secret: 'test-secret',
    })).toEqual({ ok: false })
  })
})

describe('importer status math', () => {
  it('reads ECS counts and the newest task start', () => {
    expect(countsFromService({ runningCount: 1, desiredCount: 1, pendingCount: 0 })).toEqual({
      running: 1, desired: 1, pending: 0,
    })
    expect(countsFromService(undefined)).toEqual({ running: 0, desired: 0, pending: 0 })
    const older = new Date('2026-11-23T01:00:00Z')
    const newer = new Date('2026-11-23T02:00:00Z')
    expect(latestStartedAt([{ startedAt: older }, { startedAt: newer }, {}])).toBe(Math.floor(newer.getTime() / 1000))
    expect(latestStartedAt([])).toBeNull()
  })
})

describe('importer resolver', () => {
  const deps = () => {
    const update = jest.fn(async (desired: number) => ({ running: 0, desired, pending: desired }))
    return {
      update,
      deps: {
        secret: 'test-secret',
        describe: async () => ({ running: 0, desired: 0, pending: 0 }),
        update,
        lastStarted: async () => 1_700_000_000,
      },
    }
  }

  it('refuses to scale when the caller is not the admin', async () => {
    const harness = deps()
    await expect(runImporter({
      info: { fieldName: 'setImporterRunning' },
      arguments: { enabled: true },
      request: { headers: { 'x-importer-email': 'other@gmail.com' } },
    }, harness.deps)).rejects.toThrow('Not authorized')
    expect(harness.update).not.toHaveBeenCalled()
  })

  it('returns counts and sets desired count to 1 or 0', async () => {
    const harness = deps()
    const headers = { 'x-importer-email': IMPORTER_ADMIN_EMAIL, 'x-importer-proof': PROOF }
    await expect(runImporter({ info: { fieldName: 'importerStatus' }, request: { headers } }, harness.deps)).resolves.toEqual({
      running: 0, desired: 0, pending: 0, lastStarted: 1_700_000_000,
    })
    await expect(runImporter({
      info: { fieldName: 'setImporterRunning' },
      arguments: { enabled: true },
      request: { headers },
    }, harness.deps)).resolves.toMatchObject({ desired: 1, pending: 1 })
    await expect(runImporter({
      info: { fieldName: 'setImporterRunning' },
      arguments: { enabled: false },
      request: { headers },
    }, harness.deps)).resolves.toMatchObject({ desired: 0 })
    expect(harness.update).toHaveBeenNthCalledWith(1, 1)
    expect(harness.update).toHaveBeenNthCalledWith(2, 0)
  })

  it('rejects a missing boolean', async () => {
    const harness = deps()
    await expect(runImporter({
      info: { fieldName: 'setImporterRunning' },
      arguments: {},
      identity: { claims: { email: IMPORTER_ADMIN_EMAIL } },
    }, harness.deps)).rejects.toThrow('enabled must be boolean')
  })
})

describe('importer wiring', () => {
  const repo = join(__dirname, '../../../..')

  it('publishes the admin operations on the schema', () => {
    const schema = readFileSync(join(repo, 'aws/schema.graphql'), 'utf8')
    expect(schema).toContain('importerStatus: ImporterStatus!')
    expect(schema).toContain('setImporterRunning(enabled: Boolean!): ImporterStatus!')
    expect(schema).toContain('type ImporterStatus')
  })

  it('uses the same admin email on the profile gate', () => {
    const web = readFileSync(join(repo, 'web/core/importerAdmin.ts'), 'utf8')
    const route = readFileSync(join(repo, 'web/app/api/profile/importer/route.ts'), 'utf8')
    expect(web).toContain(IMPORTER_ADMIN_EMAIL)
    expect(route).toContain('isImporterAdmin')
    expect(route).toContain('oslyn-importer:')
    expect(route).not.toContain(PROOF)
  })
})
