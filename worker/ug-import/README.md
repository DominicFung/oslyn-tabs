# Ultimate Guitar import worker

This runs on a machine that stays on. It does not log into Ultimate Guitar. It takes one pending chord-import request at a time, opens the public search page, picks a Chords result, and writes the chart back through AppSync.

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
npm run worker
```

The process polls `listPendingImports` about every 5 seconds. It claims one request, waits a couple of seconds between the search page and the chart page, then calls `completeImport` or `failImport`. It does not open two charts at once.

## Dry run

This prints the chosen URL, rating count, and the first 20 lines. It does not call AppSync.

```bash
npm run worker -- --dry 'Friday' 'Rebecca Black'
```

Picking rules, in order: the song title matches after normalization (a `(ver N)` suffix is ignored, and so are Spotify version suffixes such as `- Live`, `(Live)`, `- Live at …`, `- Remastered 2011`, `- Radio Edit`, `- Acoustic`, `(feat. X)`, and `[Live]`). Search uses that base title. Any credited artist matches (Spotify's comma-separated list against Ultimate Guitar's primary artist; case, accents, `feat.` / `ft.` / `&` / `and` / `x`, and a leading `The ` are ignored), the type is Chords, and among those the highest rating count wins. If nobody matches on artist, the highest-rated Chords result for that title is used and the log says it was a fallback. A title-only search that comes back long, or with no artist match, is searched again as `base title + primary artist`. The song keeps the original Spotify title.
