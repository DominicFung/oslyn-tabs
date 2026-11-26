import React, { useCallback, useEffect, useState } from 'react'
import { gql } from '../../src/graphql/client'
import * as d from '../../src/graphql/documents'
import { Account } from '../../src/session'
import { Body, Btn, Empty, NeedAccount, Notice, Row, Screen } from '../ui'

type SetRow = {
  setListId: string
  description: string
  creator?: { firstName?: string | null, lastName?: string | null } | null
  songs?: Array<{ song?: { albumCover?: string | null } | null } | null> | null
}

export default function SetsScreen(p: {
  account: Account | null
  onSignIn: () => void
  onOpen: (setListId: string) => void
  onCreate: () => void
}) {
  const [sets, setSets] = useState<SetRow[]>([])
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!p.account) return
    const res = await gql<{ listSets: SetRow[] | null }>(d.listSets, { userId: p.account.userId })
    if (!res.data) setError(res.error || 'Could not load sets.')
    setSets((res.data?.listSets || []).filter(Boolean))
  }, [p.account])

  useEffect(() => { load() }, [load])

  if (!p.account) return <NeedAccount onSignIn={p.onSignIn} />

  return <Screen title="Sets" subtitle={`${p.account.username}'s sets`}>
    <Body>
      <Btn label="Create set" onPress={p.onCreate} />
      <Notice text={error} tone="error" />
      {sets.length === 0 ? <Empty title="You don't have any sets yet." /> : null}
      {sets.map((set, index) => {
        const who = `${set.creator?.firstName || ''} ${set.creator?.lastName || ''}`.trim()
        return <Row key={set.setListId} title={set.description} detail={who || `${set.songs?.length || 0} songs`} meta={`${index + 1}`} onPress={() => p.onOpen(set.setListId)} />
      })}
    </Body>
  </Screen>
}
