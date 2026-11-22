import { claim, complete, fail, listPending, release, settleImport } from './appsync'
import { touchHeartbeat } from './heartbeat'
import { importChords } from './fetchChart'
import { shutdownAction } from './shutdown'
import { nextImport } from './stale'
import { withTimeout } from './timeout'

const BETWEEN_JOBS_MS = 3000
const JOB_TIMEOUT_MS = 120_000

let stopRequested = false

function args() {
  const argv = process.argv.slice(2)
  const dry = argv.indexOf('--dry')
  if (dry >= 0) {
    const title = argv[dry + 1]
    const artist = argv[dry + 2]
    if (!title || !artist) {
      console.error("Usage: npm run worker -- --dry 'Friday' 'Rebecca Black'")
      process.exit(1)
    }
    return { dry: { title, artist } }
  }
  return { dry: null }
}

function requestStop() {
  if (stopRequested) return
  stopRequested = true
  console.log('stop requested; the current import will finish or return to pending')
}

async function dryRun(title: string, artist: string) {
  const picked = await importChords(title, artist)
  console.log(`title: ${title}`)
  console.log(`artist: ${artist}`)
  console.log(`url: ${picked.url}`)
  console.log(`votes: ${picked.votes}`)
  console.log(`rating: ${picked.rating}`)
  console.log(`version: ${picked.version}`)
  console.log(`matched artist: ${picked.artistName}`)
  console.log(`fallback: ${picked.fallback ? 'yes' : 'no'}`)
  console.log('---')
  console.log(picked.chart.split('\n').slice(0, 20).join('\n'))
}

async function loop() {
  console.log('UG import worker polling every 5s')
  for (;;) {
    if (stopRequested) break
    let batch: Awaited<ReturnType<typeof listPending>> = []
    try {
      batch = await listPending()
    } catch (error) {
      console.error('listPendingImports failed', error)
      await sleep(5000)
      continue
    }
    if (stopRequested) break
    const next = nextImport(batch, Date.now())
    if (!next) {
      await sleep(5000)
      continue
    }
    if (next.status === 'IMPORTING') {
      console.log(`reclaiming stale import ${next.title} (${next.requestId})`)
    }
    const claimed = await claim(next.requestId).catch((error) => {
      console.error('claimImport failed', error)
      return false
    })
    if (!claimed) {
      await sleep(5000)
      continue
    }
    await settleImport(next.requestId, async () => {
      console.log(`importing ${next.title} by ${next.artist || 'unknown'} (${next.requestId})`)
      await withTimeout((async () => {
        const picked = await importChords(next.title, next.artist || '')
        await complete(next.requestId, picked.chart, picked.url)
        console.log(`done ${picked.url} (${picked.votes} ratings${picked.fallback ? ', artist fallback' : ''})`)
      })(), JOB_TIMEOUT_MS, 'import')
    }, async (requestId, message) => {
      if (shutdownAction(stopRequested, new Error(message)) === 'release') {
        console.log(`releasing ${requestId} back to pending`)
        await release(requestId)
        return
      }
      await fail(requestId, message)
    })
    if (stopRequested) break
    await sleep(BETWEEN_JOBS_MS)
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const mode = args()
if (mode.dry) {
  dryRun(mode.dry.title, mode.dry.artist).catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
} else {
  process.on('SIGTERM', requestStop)
  process.on('SIGINT', requestStop)
  touchHeartbeat()
  const beat = setInterval(() => touchHeartbeat(), 15_000)
  beat.unref()
  loop().then(() => process.exit(0)).catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
