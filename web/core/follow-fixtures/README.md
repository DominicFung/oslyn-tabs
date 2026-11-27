# Follow me recordings

These fixtures replay saved chroma through the current score follower. Audio is not decoded. A fixture fails when its score drops below `baseline.json`.

## Record

1. Open a jam with the debug flag: `/jam/<jamSessionId>?followDebug=1`.
2. Turn on **Follow me (beta)** and allow the microphone.
3. In the debug panel, press **Record**.
4. Play the song. Press **Space** (or **Should turn now**) at each moment the page should turn. That mark does not turn the page.
5. Press **Stop**. The panel uploads `session.json` and `audio.webm` to the existing project bucket at `follow-recordings/<songId>/<timestamp>-<sessionId>/`. If the upload route cannot reach the bucket, it says so and **Download** saves the same files as a zip.

## Turn a recording into a fixture

From `web/`, with the same AWS credentials the site uses locally (or `OSLYN_BUCKET` plus the default credential chain):

```bash
node --experimental-strip-types scripts/follow-fetch-recording.ts \
  --prefix follow-recordings/<songId>/<timestamp>-<sessionId>/ \
  --name my-song \
  --write-baseline
```

That writes `core/follow-fixtures/my-song/session.json` (and `audio.webm` when it was uploaded). Expected turns are the Space marks already stored on the session. `--write-baseline` sets `baseline.json` to the replay score minus 0.05.

Check a file you already have:

```bash
node --experimental-strip-types scripts/follow-replay.ts core/follow-fixtures/my-song/session.json
```

Commit the fixture directory and the baseline change.
