import { DescribeServicesCommand, DescribeTasksCommand, ECSClient, ListTasksCommand, UpdateServiceCommand } from '@aws-sdk/client-ecs'
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager'
import { IMPORTER_CLUSTER_NAME, IMPORTER_SECRET_ID, IMPORTER_SERVICE_NAME } from '../../../importerNames'
import {
  countsFromService,
  latestStartedAt,
  nextAuthSecretFromJson,
  verifyImporterCaller,
  type ImporterStatus,
} from './importerAuth'

const cluster = process.env.IMPORTER_CLUSTER_NAME || IMPORTER_CLUSTER_NAME
const serviceName = process.env.IMPORTER_SERVICE_NAME || IMPORTER_SERVICE_NAME
const secretId = process.env.IMPORTER_SECRET_ID || IMPORTER_SECRET_ID

const ecs = new ECSClient({})
const secrets = new SecretsManagerClient({})

let cachedSecret = ''

export type ImporterEvent = {
  info?: { fieldName?: string }
  arguments?: { enabled?: boolean | null }
  identity?: unknown
  request?: { headers?: Record<string, string | undefined> | null }
}

export type ImporterDeps = {
  secret: string
  describe(): Promise<Pick<ImporterStatus, 'running' | 'desired' | 'pending'>>
  update(desired: number): Promise<Pick<ImporterStatus, 'running' | 'desired' | 'pending'>>
  lastStarted(): Promise<number | null>
}

export async function runImporter(event: ImporterEvent, deps: ImporterDeps): Promise<ImporterStatus> {
  if (!verifyImporterCaller({
    identity: event.identity,
    headers: event.request?.headers,
    secret: deps.secret,
  }).ok) {
    throw new Error('Not authorized')
  }

  const field = event.info?.fieldName
  if (field === 'importerStatus') {
    const counts = await deps.describe()
    return { ...counts, lastStarted: await deps.lastStarted() }
  }
  if (field === 'setImporterRunning') {
    if (typeof event.arguments?.enabled !== 'boolean') throw new Error('enabled must be boolean')
    const counts = await deps.update(event.arguments.enabled ? 1 : 0)
    return { ...counts, lastStarted: await deps.lastStarted() }
  }
  throw new Error('Unsupported field')
}

async function loadSecret() {
  if (cachedSecret) return cachedSecret
  const res = await secrets.send(new GetSecretValueCommand({ SecretId: secretId }))
  const value = nextAuthSecretFromJson(res.SecretString || '')
  if (value) cachedSecret = value
  return value
}

async function describedService() {
  const out = await ecs.send(new DescribeServicesCommand({ cluster, services: [serviceName] }))
  const found = (out.services || []).find((item) => item.status !== 'INACTIVE' && item.status !== 'MISSING')
  if (!found) throw new Error('Importer service was not found')
  return countsFromService(found)
}

async function taskLastStarted() {
  const running = await ecs.send(new ListTasksCommand({ cluster, serviceName, desiredStatus: 'RUNNING' }))
  const stopped = await ecs.send(new ListTasksCommand({ cluster, serviceName, desiredStatus: 'STOPPED' }))
  const tasks = [...(running.taskArns || []), ...(stopped.taskArns || [])].slice(0, 100)
  if (!tasks.length) return null
  const described = await ecs.send(new DescribeTasksCommand({ cluster, tasks }))
  return latestStartedAt(described.tasks || [])
}

export const handler = async (event: ImporterEvent): Promise<ImporterStatus> => {
  const secret = await loadSecret()
  return runImporter(event, {
    secret,
    describe: describedService,
    update: async (desired) => {
      const out = await ecs.send(new UpdateServiceCommand({ cluster, service: serviceName, desiredCount: desired }))
      if (!out.service) throw new Error('Importer service was not found')
      return countsFromService(out.service)
    },
    lastStarted: taskLastStarted,
  })
}
