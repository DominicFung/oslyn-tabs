import { NextResponse } from 'next/server'

import { Amplify } from 'aws-amplify'
import { GraphQLResult, generateClient } from 'aws-amplify/api'
import amplifyconfig from '@/../src/amplifyconfiguration.json'

import { fetchAppleKeys, verifyAppleIdentityToken, verifyGoogleIdToken, type VerifiedIdentity } from '@/core/identityToken'
import { mobileAuthConfig } from '@/core/mobileAuthConfig'
import { issueMobileSession } from '@/core/mobileSession'

export const dynamic = 'force-dynamic'

const CREATE_USER = /* GraphQL */ `mutation CreateUserFromVerifiedIdentity(
  $username: String!
  $email: String!
  $provider: provider!
  $firstName: String
  $lastName: String
  $imageUrl: String
) {
  createUser(
    username: $username
    email: $email
    provider: $provider
    firstName: $firstName
    lastName: $lastName
    imageUrl: $imageUrl
  ) {
    userId
    username
    email
    firstName
    lastName
    imageUrl
  }
}`

type CreatedUser = {
  userId: string
  username: string
  email: string
  firstName?: string | null
  lastName?: string | null
  imageUrl?: string | null
}

/**
 * The phone sends a Google ID token or an Apple identity token.
 * This route checks the signature and audience, then uses the email inside the token.
 * A typed email or user id is ignored.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { provider?: unknown, idToken?: unknown, name?: unknown } | null
  const provider = body?.provider === 'google' || body?.provider === 'apple' ? body.provider : ''
  const idToken = typeof body?.idToken === 'string' ? body.idToken.trim() : ''
  const nameHint = typeof body?.name === 'string' ? body.name.trim().slice(0, 80) : ''
  if (!provider || !idToken) {
    return NextResponse.json({ error: 'provider and idToken are required' }, { status: 400 })
  }

  const config = mobileAuthConfig()
  if (provider === 'google' && config.googleAudiences.length === 0) {
    return NextResponse.json({ error: 'Google client ids are not configured on the server' }, { status: 500 })
  }
  const identity = provider === 'google'
    ? await verifyGoogleIdToken(idToken, config.googleAudiences)
    : await verifyApple(idToken, config.appleAudiences)
  if ('error' in identity) return NextResponse.json({ error: identity.error }, { status: 401 })

  if (!config.nextAuthSecret) {
    return NextResponse.json({ error: 'Sign-in is not configured' }, { status: 500 })
  }

  const username = identity.name || nameHint || identity.email.split('@')[0] || 'Oslyn'
  Amplify.configure(amplifyconfig, { ssr: true })
  let created: CreatedUser | null = null
  try {
    const result = await generateClient().graphql({
      query: CREATE_USER,
      variables: {
        username,
        email: identity.email,
        provider: identity.provider,
        firstName: identity.givenName,
        lastName: identity.familyName,
        imageUrl: identity.picture,
      },
    }) as GraphQLResult<{ createUser: CreatedUser | null }>
    created = result.data?.createUser || null
  } catch (error) {
    console.error(error)
    const message = error instanceof Error ? error.message : ''
    if (identity.provider === 'apple' && /apple|enum|provider/i.test(message)) {
      return NextResponse.json({ error: 'Apple sign-in needs the Appsync stack deployed with the apple provider.' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Could not open the Oslyn account' }, { status: 502 })
  }
  if (!created?.userId) return NextResponse.json({ error: 'Could not open the Oslyn account' }, { status: 502 })

  const sessionToken = issueMobileSession(config.nextAuthSecret, {
    userId: created.userId,
    email: identity.email,
    username: created.username || username,
    firstName: created.firstName || identity.givenName,
    lastName: created.lastName || identity.familyName,
    imageUrl: created.imageUrl || identity.picture,
  })
  return NextResponse.json({
    sessionToken,
    userId: created.userId,
    email: identity.email,
    username: created.username || username,
    firstName: created.firstName || identity.givenName || null,
    lastName: created.lastName || identity.familyName || null,
    imageUrl: created.imageUrl || identity.picture || null,
  })
}

async function verifyApple(idToken: string, audiences: string[]): Promise<VerifiedIdentity | { error: string }> {
  const keys = await fetchAppleKeys()
  if ('error' in keys) return keys
  return verifyAppleIdentityToken(idToken, keys, audiences)
}
