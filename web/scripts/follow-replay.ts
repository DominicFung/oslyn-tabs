import { readFileSync } from 'fs'
import { scoreSession, type FollowSessionFile } from '../core/follow.ts'

const path = process.argv[2]
if (!path) {
  console.error('Usage: node --experimental-strip-types scripts/follow-replay.ts <session.json>')
  process.exit(1)
}
const session = JSON.parse(readFileSync(path, 'utf8')) as FollowSessionFile
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
