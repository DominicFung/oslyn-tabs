# Follow me recordings

These fixtures replay saved chroma through the current score follower. Audio is not decoded. A fixture fails when its score drops below `baseline.json`.

## Record

1. Open a jam with the debug flag: `/jam/<jamSessionId>?followDebug=1`.
2. Turn on **Follow me (beta)** and allow the microphone. That starts the recording. There is no separate Record button. The debug panel shows **Recording…**, the chart key, the sounding jam key, and the capo. Templates follow the jam key. The capo only changes the shapes on screen.
3. Play the song.
   - **Space** or **Should turn now** marks where the page should turn. The page stays put.
   - **Left/Right arrow keys** and the on-screen side tap zones still turn the page. Each one is saved as a correction: time, prev or next, key or button, the page before and after, and the follower's estimated position.
4. Turn **Follow me** off, change songs, or leave the page. While it is on, about every two minutes the browser PUTs a chunk straight to S3 (a presigned URL from `/api/follow/recording`): `part-0001.webm`, `part-0001.json`, and an updated `manifest.json` under `follow-recordings/<songId>/<timestamp>-<sessionId>/`. Each webm is its own MediaRecorder session, so each part plays on its own. Parts are not concatenated into one audio file. `manifest.json` holds the song, chart key, jam key, capo, and chart once, and lists the parts. A song change finishes that take and starts a new prefix. A chunk that still fails after retries can be downloaded as a zip. Other chunks keep uploading.

Without `?followDebug=1`, Follow me does not record.

Switching away from the tab flushes the open chunk with a normal request. Closing the page also tries a `keepalive` PUT, but browsers drop keepalive bodies around 64KB, so that last partial chunk often does not land. Turning Follow me off, or leaving the tab in the background, is the reliable flush.

## Scoring

- **Space** marks and manual **next** corrections are expected turns. A follower turn near that time is on time. No follower turn within 5 seconds is a miss (the follower was late or never moved).
- A manual **prev** within 8 seconds after an automatic turn rejects that turn. It counts as a false, early turn. When the log says which page that turn left, only the replayed turn off the same page, before the prev, is rejected.
- A recorded automatic turn that nobody took back within 8 seconds is an expected turn too.
- A manual **next** taken back by a **prev** within 3 seconds is a slip, not an expected turn.
- Replay starts on the page the take started on (the first logged page change's `pageBefore`), not always page 0.

## Page length gate

Most Build My Life pages repeat one progression (D G D/F# G), so the chord match can't tell the top of a page from its end. The follower also times pages: a page is expected to take its chord count times the time per chord. It learns that pace from your own next-page taps (median of the last five, default 3.5 s per chord). An automatic turn waits for 90% of that, and past 100% being on the page's last line is enough. Tapping back right after an automatic turn keeps the page's original start time and resumes listening from its last line.

## Turn a recording into a fixture

From `web/`, with the same AWS credentials the site uses locally (or `OSLYN_BUCKET` plus the default credential chain):

```bash
node --experimental-strip-types scripts/follow-fetch-recording.ts \
  --prefix follow-recordings/<songId>/<timestamp>-<sessionId>/ \
  --name my-song \
  --write-baseline
```

That writes `core/follow-fixtures/my-song/session.json`. A chunked take is stitched from `manifest.json` and `part-NNNN.json` into that one session. A single-file take also saves `audio.webm` when it was uploaded. Expected turns are the Space marks and manual nexts already stored on the session. `--write-baseline` sets `baseline.json` to the replay score minus 0.05.

Replay a stitched directory the same way as a session file:

```bash
node --experimental-strip-types scripts/follow-replay.ts core/follow-fixtures/my-song
```

Check a file you already have:

```bash
node --experimental-strip-types scripts/follow-replay.ts core/follow-fixtures/my-song/session.json
```

Commit the fixture directory and the baseline change.

## Chords and past takes

`--dtw-loo` replays every `build-my-life-*` fixture twice: chords alone, then chords plus a page-local alignment against the other takes. Lyrics are not in that replay. Smarter listening is off unless the player turns it on.

```bash
node --experimental-strip-types scripts/follow-replay.ts --dtw-loo core/follow-fixtures
```

## Page order check

Besides the page length gate, the follower tracks which of the current page's chords it has heard, in order. A chord counts once it holds a few frames and scores close to the best chord on the page. It may skip up to three chords at a time (a skipped chord still has to have had time, 1.2 s each). The page turns only after the last chord is heard and at least half of the page's chords were heard in order. Set `orderMode: 'off'` to ignore the check, or `'only'` to turn on the last chord without the next page's opening.
