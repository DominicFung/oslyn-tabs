# Ultimate Guitar import worker

This runs on a machine that stays on. It does not log into Ultimate Guitar. It takes one pending chord-import request at a time, opens the public search page, picks a Chords result, and writes the chart back through AppSync.

## AWS

The same process can run as a Fargate Spot service in us-east-1 instead of on a machine that sleeps. The service is off until it is turned on from the profile page. Deploy order, the two SSM parameters to fill in, and the cost (about $0.01–$0.02 per hour while on, $0 while off) are in the root [README](../../README.md#ultimate-guitar-importer-fargate).

## Setup

```bash
cd worker/ug-import
npm install
npx playwright install chromium
```

Copy the AppSync endpoint and API key into the environment. They are the existing API, not a new one.

```bash
export APPSYNC_ENDPOINT="https://<api-id>.appsync-api.us-east-1.amazonaws.com/graphql"
export APPSYNC_API_KEY="<existing api key>"
```

## Run

```bash
npm start
```

`npm start` and `./start-worker.sh` run the Jest suite first and refuse to start the poller if a test fails. `./start-worker.sh` loads `.env` when that file is present, writes `worker.pid`, installs `node_modules` or Chromium when either is missing, then restarts the poller if the process exits or its heartbeat goes stale. A stop signal lets the current import finish, or puts that claim back to pending, before the process exits. `npm run worker` skips the tests.

## Regression tests

When an import fails, add one Jest test so the next deploy cannot repeat it.

1. Save the Ultimate Guitar search rows for that title as `src/fixtures/<song>.json`. The tests read this file and do not open the network.
2. Add a test in `src/__tests__/import-regressions.test.ts`. The title and artist are the Spotify strings. Assert the `tabUrl` that should have been chosen.
3. Put a one-line comment above the test naming the song and what broke.

`npm test` in this directory runs that file together with the other worker suites. From `aws/`, `npm run deploy -- oslynstudio-AppsyncStack --exclusively --profile a1` refuses a missing stack name and `--all`, then runs these tests and `aws/lambdas` Jest before CDK. There is no `amplify.yml` in this repo. Amplify codegen in the deploy script does not build the worker, so the Amplify hosting build is not where these tests run.

## Worker only

```bash
npm run worker
```

The process polls `listPendingImports` about every 5 seconds. It claims one request, waits a couple of seconds between the search page and the chart page, then calls `completeImport` or `failImport`. It does not open two charts at once.

## Dry run

This prints the chosen URL, rating count, and the first 20 lines. It does not call AppSync.

```bash
npm run worker -- --dry 'Friday' 'Rebecca Black'
```

Picking rules, in order: the song title matches after normalization. A `(ver N)` suffix is ignored, and so are repeated Spotify version and soundtrack suffixes such as `- Live`, `(Live)`, `- Live at …`, `- Remastered 2011`, `- 2011 Remaster`, `- Radio Edit`, `- Acoustic`, `- Single Version`, `- Mono`, `(feat. X)`, `[Live]`, `(Taylor's Version)`, `(From The Vault)`, `- from "X"`, `- from "X" Soundtrack`, `(From "X")`, `- From the Netflix Series`, and `- Original Motion Picture Soundtrack`. Search uses that base title, with apostrophes removed so `You're` and `Youre` are the same word, and with accents folded so `écrit` and `ecrit` are the same word. Ultimate Guitar leaves HTML entities such as `&Eacute;` in the search JSON; those are decoded before the title is compared. `(Taylor's Version)` and `(From The Vault)` are removed before search. A version note such as `(10 Minute Version)` is kept, and the bare title is searched only if that longer title does not match. `From The Vault` is not a `From "X"` work name. A `From "X"` title is also searched as `X - Title`. When the plain search has no artist match, it is searched again as `title soundtrack`, and a `Movie - Title` query is also searched as the song name. A Misc Soundtrack, Misc Cartoons, or Misc Television chart titled `Movie - Title` is preferred over an artist fallback with fewer ratings. Commas are ignored when the titles are compared, and a Misc Cartoons, Misc Soundtrack, or Misc Television credit counts when that work is in the UG title or the requested artist is in the credit. An exact title match comes first. Any credited artist matches (Spotify's comma-separated list against Ultimate Guitar's primary artist; case, accents, `feat.` / `ft.` / `&` / `and` / `x`, and a leading `The ` are ignored), the type is Chords, and among those the highest rating count wins. If nobody matches on artist, the highest-rated Chords result for that title is used and the log says it was a fallback. Only when nothing matches the exact title, a longer Chords title that contains the base title as whole words can match, which is how "Mon Soleil" finds "Emily In Paris - Mon Soleil". A one-word title such as "Home" is never used that way. A title-only search that comes back long, or with no artist match, is searched again as `base title + primary artist`. The song keeps the original Spotify title.
