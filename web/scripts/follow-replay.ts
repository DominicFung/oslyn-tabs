import { readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path'
// Node's type stripper needs the .ts specifier. The app tsconfig does not allow it.
// @ts-expect-error TS5097
import { scoreSession, stitchParts, type FollowChunkPart, type FollowManifest, type FollowSessionFile } from '../core/follow.ts'
// @ts-expect-error TS5097
import { counts, leaveOneOut, replayChordsAndDtw } from '../core/followReplay.ts'
// @ts-expect-error TS5097
import { referenceFromSession } from '../core/pageDtw.ts'

function loadSession(path: string): FollowSessionFile {
  if (statSync(path).isDirectory()) {
    const sessionPath = join(path, 'session.json')
    try {
      if (statSync(sessionPath).isFile()) return JSON.parse(readFileSync(sessionPath, 'utf8')) as FollowSessionFile
    } catch { /* stitch parts below */ }
    const manifest = JSON.parse(readFileSync(join(path, 'manifest.json'), 'utf8')) as FollowManifest
    const parts = readdirSync(path)
      .filter((name) => /^part-\d{4}\.json$/.test(name))
      .map((name) => JSON.parse(readFileSync(join(path, name), 'utf8')) as FollowChunkPart)
    return stitchParts(manifest, parts)
  }
  return JSON.parse(readFileSync(path, 'utf8')) as FollowSessionFile
}

function printReport(label: string, report: ReturnType<typeof scoreSession>) {
  const row = counts(report)
  console.log(JSON.stringify({
    label,
    matched: row.matched,
    expected: row.expected,
    falseTurns: row.falseTurns,
    score: Number(report.score.toFixed(3)),
  }))
}

const loo = process.argv.indexOf('--dtw-loo')
if (loo >= 0) {
  const root = process.argv[loo + 1] || 'core/follow-fixtures'
  const names = readdirSync(root).filter((name) => name.startsWith('build-my-life-')).sort()
  const sessions = names.map((name) => ({ name, session: loadSession(join(root, name)) }))
  const rows = leaveOneOut(sessions)
  let chordMatched = 0
  let chordFalse = 0
  let voteMatched = 0
  let voteFalse = 0
  let expected = 0
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    chordMatched += row.chords.matched
    chordFalse += row.chords.falseTurns
    voteMatched += row.voted.matched
    voteFalse += row.voted.falseTurns
    expected += row.chords.expected
    console.log(`${row.name}  chords ${row.chords.matched}/${row.chords.expected} false ${row.chords.falseTurns}  chords+DTW ${row.voted.matched}/${row.voted.expected} false ${row.voted.falseTurns}`)
  }
  console.log(`total  chords ${chordMatched}/${expected} false ${chordFalse}  chords+DTW ${voteMatched}/${expected} false ${voteFalse}`)
  process.exit(0)
}

const dtw = process.argv.indexOf('--dtw')
const path = process.argv.find((arg) => arg !== '--dtw' && !arg.startsWith('-') && arg !== process.argv[0] && arg !== process.argv[1])
if (!path) {
  console.error('Usage: node --experimental-strip-types scripts/follow-replay.ts <session.json | chunk-dir>')
  console.error('       node --experimental-strip-types scripts/follow-replay.ts --dtw <session> <reference-dir>...')
  console.error('       node --experimental-strip-types scripts/follow-replay.ts --dtw-loo core/follow-fixtures')
  process.exit(1)
}
const session = loadSession(path)
if (dtw >= 0) {
  const refs = process.argv.slice(dtw + 1).filter((arg) => arg !== path).map((dir) => {
    const ref = referenceFromSession(loadSession(dir), dir)
    if (!ref) console.error(`skip ${dir}: fewer than 2 manual nexts`)
    return ref
  }).filter((ref): ref is NonNullable<typeof ref> => !!ref)
  printReport('chords', scoreSession(session))
  printReport('chords+DTW', replayChordsAndDtw(session, refs))
} else {
  printReport('chords', scoreSession(session))
}
