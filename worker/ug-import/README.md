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

Picking rules, in order: the song title matches after normalization (a `(ver N)` suffix is ignored), the artist matches the same way, the type is Chords, and among those the highest rating count wins.
