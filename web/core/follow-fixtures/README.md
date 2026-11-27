# Follow me recordings

These fixtures replay saved chroma through the current score follower. Audio is not decoded. A fixture fails when its score drops below `baseline.json`.

## Record

1. Open a jam with the debug flag: `/jam/<jamSessionId>?followDebug=1`.
2. Turn on **Follow me (beta)** and allow the microphone. That starts the recording. There is no separate Record button. The debug panel shows **Recording…**.
3. Play the song.
   - **Space** or **Should turn now** marks where the page should turn. The page stays put.
   - **Left/Right arrow keys** and the on-screen side tap zones still turn the page. Each one is saved as a correction: time, prev or next, key or button, the page before and after, and the follower's estimated position.
4. Turn **Follow me** off, change songs, or leave the page. The session uploads to the existing project bucket at `follow-recordings/<songId>/<timestamp>-<sessionId>/` (`session.json` and `audio.webm`). A song change uploads the song you just left and starts a new recording for the next one. If the upload fails, the panel says so and **Download** saves a zip.

Without `?followDebug=1`, Follow me does not record.

Closing the tab sends `session.json` with `navigator.sendBeacon`, or a `keepalive` fetch if the beacon is refused. Audio is included in that last request only when `session.json` plus `audio.webm` are at most 60KB (browsers drop beacon and keepalive bodies around 64KB). A real recording is larger than that, so the mic audio from a tab close is usually not uploaded. Turning Follow me off is the reliable upload, and it includes the audio.

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

That writes `core/follow-fixtures/my-song/session.json` (and `audio.webm` when it was uploaded). Expected turns are the Space marks and manual nexts already stored on the session. `--write-baseline` sets `baseline.json` to the replay score minus 0.05.

Check a file you already have:

```bash
node --experimental-strip-types scripts/follow-replay.ts core/follow-fixtures/my-song/session.json
```

Commit the fixture directory and the baseline change.
