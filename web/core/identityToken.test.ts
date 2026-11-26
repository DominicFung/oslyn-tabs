import assert from 'node:assert/strict'
import { createSign, generateKeyPairSync } from 'crypto'
import { describe, it } from 'node:test'
import { appleIdentityFromClaims, googleIdentityFromTokenInfo, verifyAppleIdentityToken } from './identityToken.ts'

describe('googleIdentityFromTokenInfo', () => {
  const audiences = ['ios-client.apps.googleusercontent.com']
  const ok = {
    aud: audiences[0],
    iss: 'https://accounts.google.com',
    email: 'Person@Example.com',
    email_verified: 'true',
    sub: 'google-sub',
    name: 'Person Example',
  }

  it('accepts a verified token for a configured client id', () => {
    const identity = googleIdentityFromTokenInfo(ok, audiences)
    assert.equal('email' in identity && identity.email, 'person@example.com')
    assert.equal('provider' in identity && identity.provider, 'google')
  })

  it('rejects a token for another app, an unverified email, or a typed email with no subject', () => {
    assert.equal('error' in googleIdentityFromTokenInfo({ ...ok, aud: 'other' }, audiences), true)
    assert.equal('error' in googleIdentityFromTokenInfo({ ...ok, email_verified: 'false' }, audiences), true)
    assert.equal('error' in googleIdentityFromTokenInfo({ ...ok, email: 'not-an-email' }, audiences), true)
    assert.equal('error' in googleIdentityFromTokenInfo(ok, []), true)
  })
})

describe('apple identity token', () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'test-key' }
  const bundle = 'TJR9Q2Q4KU.com.oslyn.tabs'

  function token(payload: Record<string, unknown>) {
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', kid: 'test-key' })).toString('base64url')
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
    const input = `${header}.${body}`
    const signature = createSign('RSA-SHA256').update(input).sign(privateKey).toString('base64url')
    return `${input}.${signature}`
  }

  const claims = {
    iss: 'https://appleid.apple.com',
    aud: bundle,
    exp: 2_000_000_000,
    sub: 'apple-sub',
    email: 'Person@Example.com',
    email_verified: 'true',
  }

  it('accepts a signed token for the app bundle id', () => {
    const identity = verifyAppleIdentityToken(token(claims), [jwk], [bundle], 1_700_000_000_000)
    assert.equal('email' in identity && identity.email, 'person@example.com')
    assert.equal('subject' in identity && identity.subject, 'apple-sub')
  })

  it('rejects a bad signature, the wrong app, and a missing email', () => {
    const forged = token(claims).slice(0, -2) + 'aa'
    assert.equal('error' in verifyAppleIdentityToken(forged, [jwk], [bundle], 1_700_000_000_000), true)
    assert.equal('error' in verifyAppleIdentityToken(token({ ...claims, aud: 'com.other.app' }), [jwk], [bundle]), true)
    const missing = appleIdentityFromClaims({ ...claims, email: '' }, [bundle])
    assert.match('error' in missing ? missing.error : '', /email/i)
  })
})
