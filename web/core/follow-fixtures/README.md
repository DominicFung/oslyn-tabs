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
- A manual **prev** within 8 seconds after an automatic turn rejects that turn. It counts as a false, early turn.

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
