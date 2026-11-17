import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb'
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager'

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''
const SECRET_ID = 'oslynstudio/secret'

const secrets = new SecretsManagerClient({})

type SpotifyTrack = {
  spotifyId: string
  title: string
  artist?: string
  album?: string
  albumCover?: string
}

type TokenCache = { accessToken: string, expiresAt: number }
let tokenCache: TokenCache | null = null

async function spotifyCredentials(): Promise<{ clientId: string, clientSecret: string }> {
  const res = await secrets.send(new GetSecretValueCommand({ SecretId: SECRET_ID }))
  if (!res.SecretString) throw new Error('spotify secret is empty')
  const parsed = JSON.parse(res.SecretString) as { spotify?: { clientId?: string, clientSecret?: string } }
  const clientId = parsed.spotify?.clientId
  const clientSecret = parsed.spotify?.clientSecret
  if (!clientId || !clientSecret) throw new Error('spotify credentials are missing')
  return { clientId, clientSecret }
}

async function accessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt - 30_000) return tokenCache.accessToken
  const creds = await spotifyCredentials()
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
  })
  if (res.status === 403) throw new Error('spotify_forbidden')
  if (!res.ok) throw new Error(`spotify_token_${res.status}`)
  const body = await res.json() as { access_token?: string, expires_in?: number }
  if (!body.access_token) throw new Error('spotify_token_missing')
  tokenCache = {
    accessToken: body.access_token,
    expiresAt: Date.now() + (body.expires_in || 3600) * 1000,
  }
  return body.access_token
}

function tracksFrom(body: any): SpotifyTrack[] {
  const items = body?.tracks?.items
  if (!Array.isArray(items)) return []
  return items.flatMap((item) => {
    const spotifyId = typeof item?.id === 'string' ? item.id : ''
    const title = typeof item?.name === 'string' ? item.name : ''
    if (!spotifyId || !title) return []
    const artists = Array.isArray(item.artists)
      ? item.artists.map((artist: { name?: string }) => artist?.name).filter((name: unknown): name is string => typeof name === 'string' && name.length > 0)
      : []
    const albumName = typeof item.album?.name === 'string' ? item.album.name : undefined
    const image = Array.isArray(item.album?.images) ? item.album.images.find((img: { url?: string }) => typeof img?.url === 'string') : undefined
    return [{
      spotifyId,
      title,
      ...(artists.length ? { artist: artists.join(', ') } : {}),
      ...(albumName ? { album: albumName } : {}),
      ...(image?.url ? { albumCover: image.url } : {}),
    }]
  })
}

export const handler = async (event: AppSyncResolverEvent<{
  userId: string, term: string, limit?: number | null
}, null>) => {
  const b = event.arguments
  const empty = { tracks: [] as SpotifyTrack[], error: null as string | null }
  if (!b?.userId || !b.term?.trim()) {
    console.error('userId and term are required')
    return { ...empty, error: 'bad_request' }
  }
  const term = b.term.trim()
  if (term.length > 200) return { ...empty, error: 'bad_request' }
  const limit = Math.min(10, Math.max(1, b.limit || 5))

  const dynamo = new DynamoDBClient({})
  const user = await dynamo.send(new GetItemCommand({
    TableName: USER_TABLE_NAME,
    Key: { userId: { S: b.userId } },
  }))
  if (!user.Item) return { ...empty, error: 'unauthorized' }

  try {
    const token = await accessToken()
    const url = new URL('https://api.spotify.com/v1/search')
    url.searchParams.set('type', 'track')
    url.searchParams.set('q', term)
    url.searchParams.set('limit', String(limit))
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (res.status === 403) {
      console.error('Spotify search is forbidden for this app')
      return { ...empty, error: 'spotify_forbidden' }
    }
    if (res.status === 401) {
      tokenCache = null
      console.error('Spotify token was rejected')
      return { ...empty, error: 'spotify_unauthorized' }
    }
    if (!res.ok) {
      console.error(`Spotify search failed: ${res.status}`)
      return { ...empty, error: 'spotify_unavailable' }
    }
    const body = await res.json()
    return { tracks: tracksFrom(body), error: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'spotify_unavailable'
    console.error('Spotify search failed', message === 'spotify_forbidden' ? message : 'spotify_unavailable')
    if (message === 'spotify_forbidden') return { ...empty, error: 'spotify_forbidden' }
    return { ...empty, error: 'spotify_unavailable' }
  }
}
