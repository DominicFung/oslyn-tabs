import { claim, complete, listPending, settleImport } from './appsync'
import { importChords } from './fetchChart'

const BETWEEN_JOBS_MS = 3000

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
    let batch: Awaited<ReturnType<typeof listPending>> = []
    try {
      batch = await listPending()
    } catch (error) {
      console.error('listPendingImports failed', error)
      await sleep(5000)
      continue
    }
    const next = batch[0]
    if (!next) {
      await sleep(5000)
      continue
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
      const picked = await importChords(next.title, next.artist || '')
      await complete(next.requestId, picked.chart, picked.url)
      console.log(`done ${picked.url} (${picked.votes} ratings${picked.fallback ? ', artist fallback' : ''})`)
    })
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
  loop().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
