import { readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path'
// Node's type stripper needs the .ts specifier. The app tsconfig does not allow it.
// @ts-expect-error TS5097
import { scoreSession, stitchParts, type FollowChunkPart, type FollowManifest, type FollowSessionFile } from '../core/follow.ts'

function loadSession(path: string): FollowSessionFile {
  if (statSync(path).isDirectory()) {
    const manifest = JSON.parse(readFileSync(join(path, 'manifest.json'), 'utf8')) as FollowManifest
    const parts = readdirSync(path)
      .filter((name) => /^part-\d{4}\.json$/.test(name))
      .map((name) => JSON.parse(readFileSync(join(path, name), 'utf8')) as FollowChunkPart)
    return stitchParts(manifest, parts)
  }
  return JSON.parse(readFileSync(path, 'utf8')) as FollowSessionFile
}

const path = process.argv[2]
if (!path) {
  console.error('Usage: node --experimental-strip-types scripts/follow-replay.ts <session.json | chunk-dir>')
  process.exit(1)
}
const session = loadSession(path)
const report = scoreSession(session)
console.log(JSON.stringify({
  score: Number(report.score.toFixed(3)),
  missed: report.missed,
  falseTurns: report.falseTurns.length,
  turns: report.turns.map((turn) => ({
    expectedT: turn.expectedT,
    predictedT: turn.predictedT,
    deltaSec: turn.deltaSec == null ? null : Number(turn.deltaSec.toFixed(3)),
    missed: turn.missed,
  })),
}, null, 2))
