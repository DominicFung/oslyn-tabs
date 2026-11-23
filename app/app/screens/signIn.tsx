import React, { useState } from 'react'
import { gql } from '../../src/graphql/client'
import * as d from '../../src/graphql/documents'
import { signInKind } from '../../src/jamList'
import { Account } from '../../src/session'
import { Body, Btn, Field, Notice, Screen } from '../ui'

type Found = { userId: string, username?: string | null, email?: string | null, firstName?: string | null, lastName?: string | null, imageUrl?: string | null }

export default function SignInScreen(p: { onDone: (account: Account) => void, onBack?: () => void }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    const kind = signInKind(value)
    if (kind === 'invalid') {
      setError('Enter the email on your Oslyn account, or your user id.')
      return
    }
    setBusy(true)
    setError('')
    if (kind === 'email') {
      const res = await gql<{ getUserByEmail: Found | null }>(d.getUserByEmail, { email: value.trim() })
      const found = res.data?.getUserByEmail
      if (!found?.userId) {
        setError('No account came back for that email. The getUserByEmail resolver is not on the live API yet, so paste your user id instead. It ends with _usr.')
        setBusy(false)
        return
      }
      await finish(found)
      return
    }
    const res = await gql<{ getUserById: Found | null }>(d.getUserById, { userId: value.trim() })
    const found = res.data?.getUserById
    if (!found?.userId) {
      setError(res.error || 'No account with that user id.')
      setBusy(false)
      return
    }
    await finish(found)
  }

  const finish = async (found: Found) => {
    p.onDone({
      userId: found.userId,
      email: found.email || value.trim(),
      username: found.username || 'Oslyn',
      firstName: found.firstName,
      lastName: found.lastName,
      imageUrl: found.imageUrl,
    })
    setBusy(false)
  }

  return <Screen title="Sign in" subtitle="Same account as tabs.oslyn.io" onBack={p.onBack}>
    <Body>
      <Field label="Email or user id" value={value} onChangeText={setValue} autoCapitalize="none" placeholder="you@example.com" />
      <Notice text={error} tone="error" />
      <Btn label="Continue" onPress={submit} busy={busy} />
    </Body>
  </Screen>
}
