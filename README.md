<div align="center">

# [Oslyn Tabs](https://tabs.oslyn.io)

3 words: **Synchronized chord sheets**.

<img src="https://github.com/DominicFung/oslyn-studio-v3/blob/main/screenshots/Desktop%20-%20Controls%20Open%20-%202023-08-02.jpeg?raw=true" align="center"
     alt="Screenshot of Logistical.ly" width="830" height="504">
</p>

<img src="https://github.com/DominicFung/oslyn-studio-v3/blob/main/screenshots/Desktop%20-%20Dark%20Mode%20-%202023-08-02.jpeg?raw=true" align="center"
     alt="Screenshot of Logistical.ly" width="830" height="504">
</p>

</div>

## Why?

I love how music brings people together. Most chord sheet apps focus on the individual, but I wanted something different. This app lets people join jam sessions and sync their chord sheets. It doesn't matter if someone is not very familiar with a song; they can still participate. Music is all about connecting, and that's what I wanted to encourage with this app.

## Web App: [tabs.oslyn.io](https://tabs.oslyn.io)

<img src="https://github.com/DominicFung/oslyn-studio-v3/blob/main/screenshots/iPhone%20SE%202023-08-02.jpeg?raw=true" align="center"
     alt="Screenshot of Logistical.ly" width="830" height="466">
</p>

**Features**:

 - Responsive, optimized for smaller screens (iPhone SE)
 - Page and key changes will update everyone in the session.
 - Capo, Text size, dark mode, etc. will only affect the current user.
 - "Heads Up" feature! Instrument players (those who're not tasked with turning the page) will be able to see the next line coming up.
 - Full Screen
 - QR Code to enter the jam session
 - Oauth Login (Facebook, Google) .. Apple help wanted!

### Installable app (PWA)

Production builds of `web/` register a service worker ([Serwist](https://serwist.pages.dev/docs/next)) that precaches the static shell and shows `web/public/offline.html` when a page can't be loaded. Login (`/api/auth/*`), other `/api` responses, and AppSync calls always go to the network. `next dev` does not register the worker.

To check installability with Lighthouse:

```
cd web && npm run build && npm start
```

Open the site in Chrome, then run DevTools → Lighthouse → Progressive Web App (or Application → Manifest). You should get an install prompt. In Application → Service workers, set Offline and reload: the offline page should appear.

`web/customHttp.yml` tells Amplify Hosting to serve `/sw.js` with `Cache-Control: no-cache`. After deploy, `curl -I https://tabs.oslyn.io/sw.js` should show that header and `Content-Type: application/javascript`.

## Getting started - Developers

I would really appreciate help :) 

### Setting Up an AWS account

1. Create an AWS account
2. Set up your AWS CLI
3. profile name should be `a1`

### Creating your OAUTH connections

1. Follow this for Facebook
2. Follow this for Google

### Creating your Replicate account (for image generation)

1. Login here: https://replicate.com/
2. Copy the access key

### deploying your backend

```
cd aws && npm i
npm run deploy -- oslynstudio-AppsyncStack --exclusively --profile a1
```

`npm run deploy` with no stack name, or with `--all`, stops before the tests and before CDK.

### Ultimate Guitar importer (Fargate)

`worker/ug-import` can run as one Fargate Spot task in us-east-1 (`oslynstudio-ImporterStack`). The template does not set a desired count, so a later deploy leaves the live count alone. A brand-new service starts at 1, and the profile control scales it to 0 when the importer is off. Only `mission.possibleforsure@gmail.com` sees the Importer card on https://tabs.oslyn.io/profile, and the Next route and the AppSync Lambda both reject every other caller. This repo change does not deploy or merge anything.

**Cost.** Off is $0 for compute (no NAT gateway, no task). On is one task at 0.25 vCPU and 1 GB, about **$0.01–$0.02 per hour** on demand and usually less on Spot, plus a small amount for the image in the CDK bootstrap ECR repository and for CloudWatch logs kept for 14 days. Spot may stop the task; the process handles that signal, and ECS starts another task while the service is left on.

**Parameters.** The stack creates these. They start as `REPLACE_ME`. Set the real values after the first deploy, before turning the importer on. Do not commit them. A later deploy does not overwrite the values.

| Name | Type | Value |
| --- | --- | --- |
| `/oslynstudio/importer/APPSYNC_ENDPOINT` | String | Existing AppSync GraphQL URL (`GraphQLAPIURL` on `oslynstudio-AppsyncStack`) |
| `/oslynstudio/importer/APPSYNC_API_KEY` | SecureString | Existing AppSync API key (`GraphQLAPIKey` on that stack) |

The on/off check uses `nextauth.NEXTAUTH_SECRET` from `web/secret.json`. The Lambda reads that same JSON from Secrets Manager secret `oslynstudio/secret`, which `scripts/update-secret.sh` already updates. No new secret.

**Deploy order.** From `aws/`, one stack at a time. Never `--all`. ImporterStack first, because AppsyncStack imports its control Lambda. Docker is required for the worker image. The account must already be CDK-bootstrapped, and profile `a1` must target us-east-1.

```bash
cd aws
npm run deploy -- oslynstudio-ImporterStack --exclusively --profile a1
npm run deploy -- oslynstudio-AppsyncStack --exclusively --profile a1
```

Then:

```bash
aws ssm put-parameter --region us-east-1 --profile a1 --overwrite \
  --name /oslynstudio/importer/APPSYNC_ENDPOINT --type String \
  --value 'https://<api-id>.appsync-api.us-east-1.amazonaws.com/graphql'

aws ssm put-parameter --region us-east-1 --profile a1 --overwrite \
  --name /oslynstudio/importer/APPSYNC_API_KEY --type SecureString \
  --value '<existing api key>'
```

The profile card ships with the Next app. Deploy that the way the site is usually deployed; it is not part of the two CDK commands above.

maximum statement depth is **4**

### Running the frontend

```
cd .. && npm i
npm run dev
```