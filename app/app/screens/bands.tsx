import React, { useCallback, useEffect, useState } from 'react'
import { gql } from '../../src/graphql/client'
import * as d from '../../src/graphql/documents'
import { Account } from '../../src/session'
import { Body, Btn, Empty, NeedAccount, Notice, Row, Screen } from '../ui'

type BandRow = { bandId: string, name: string, description?: string | null, policy?: string | null }

export default function BandsScreen(p: {
  account: Account | null
  onSignIn: () => void
  onOpen: (bandId: string) => void
  onCreate: () => void
}) {
  const [bands, setBands] = useState<BandRow[]>([])
  const [shared, setShared] = useState<BandRow[]>([])
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!p.account) return
    const mine = await gql<{ listBands: BandRow[] | null }>(d.listBands, { userId: p.account.userId })
    const others = await gql<{ listSharedBands: Array<{ band?: BandRow | null } | null> | null }>(d.listSharedBands, { userId: p.account.userId })
    if (!mine.data && !others.data) setError(mine.error || others.error || 'Could not load bands.')
    setBands((mine.data?.listBands || []).filter(Boolean))
    setShared((others.data?.listSharedBands || []).flatMap((role) => role?.band ? [role.band] : []))
  }, [p.account])

  useEffect(() => { load() }, [load])

  if (!p.account) return <NeedAccount onSignIn={p.onSignIn} />

  return <Screen title="Bands" subtitle={`${p.account.username}'s bands`}>
    <Body>
      <Btn label="Create band" onPress={p.onCreate} />
      <Notice text={error} tone="error" />
      {bands.length === 0 ? <Empty title="You don't have any bands yet." body="Create a band to organize your friends and songs." /> : null}
      {bands.map((band) => <Row key={band.bandId} title={band.name} detail={band.description || ''} meta={band.policy || ''} onPress={() => p.onOpen(band.bandId)} />)}
      {shared.length > 0 && shared.map((band) => <Row key={`s-${band.bandId}`} title={band.name} detail="Shared with you" onPress={() => p.onOpen(band.bandId)} />)}
    </Body>
  </Screen>
}
