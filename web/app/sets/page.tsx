
import { headers } from 'next/headers'

import { Amplify, graphqlOperation, withSSRContext } from 'aws-amplify'
import { GraphQLResult } from "@aws-amplify/api"
import awsConfig from '@/../src/aws-exports'

import * as q from '@/../src/graphql/queries'
import { SetList, User } from '@/../src/API'

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/core/auth"
import { Session } from "next-auth"
import Unauth from "@/app/unauthorized"
import Sets from './sets'

Amplify.configure({...awsConfig, ssr: true })

type _Session = Session & {
  userId: string
}

export default async function _Sets() {
  const session = await getServerSession(authOptions)

  if (!(session?.user as _Session)?.userId) { return <Unauth /> }
  const name = session?.user?.name?.split(" ")[0]
  const userId = (session?.user as _Session)?.userId

  const req = { headers: { cookie: headers().get('cookie') }}
  const SSR = withSSRContext({ req })
  let d = [] as SetList[]

  try {
    const { data } = await SSR.API.graphql(graphqlOperation(
      q.listSets, { userId }
    )) as GraphQLResult<{ listSets: SetList[] }>

    console.log(JSON.stringify(data, null, 2))
    if (data?.listSets) d = data?.listSets
    else throw new Error("data.listSets is empty.")
  } catch (e) {
    console.log(JSON.stringify(e, null, 2))
  }

  return <>
    <Sets user={ { userId: userId, username: name } as unknown as User } sets={d} />
  </>
}