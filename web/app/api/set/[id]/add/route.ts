import { NextResponse } from 'next/server'

import { Amplify, API, graphqlOperation } from 'aws-amplify'
import { GraphQLResult } from "@aws-amplify/api"
import awsConfig from '@/../src/aws-exports'

import * as m from '@/../src/graphql/mutations'
import { SetList } from '@/../src/API'

// TODO Remove
const _generalUserId = "3d7fbd91-14fa-41da-935f-704ef74d7488"

export interface AddToSetRequest {
  key: string, songId: string
}

export async function POST(request: Request) {
  console.log(`${request.method} ${request.url}`)
  const b = await request.json() as AddToSetRequest
  // const cookies = req.cookies?.token
  // console.log(cookies)

  // TODO Authenticate User
  //console.log(b)
  Amplify.configure(awsConfig)

  const setListId = request.url.split("set/")[1].split("/add")[0]
  console.log(`setListId: ${setListId}`)

  const d = await API.graphql(graphqlOperation(
    m.addSongToSet, { ...b, setListId }
  )) as GraphQLResult<{ addSongToSet: SetList }>

  if (!d.data?.addSongToSet) {
    console.error(`addSongToSet data is empty: ${JSON.stringify(d.data)}`)
    return NextResponse.json({ error: 'Internal Server Error'}, { status: 500 })
  }

  console.log(`${request.method} ${request.url} .. complete`)
  return NextResponse.json(d.data.addSongToSet)
}