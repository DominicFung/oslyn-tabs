import { NextResponse } from 'next/server'

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/core/auth"
import { Session } from "next-auth"

import secret from "@/secret.json"
import { ReplicateStableDiffusionResponse } from '../stablediffusion'

type _Session = Session & {
  userId: string
}

export async function GET(request: Request) {
  console.log(`${request.method} ${request.url}`)

  const session = await getServerSession(authOptions)
  if (!(session?.user as _Session)?.userId) { return NextResponse.json({ error: 'Unauthorized'}, { status: 401 }) }
  const userId = (session?.user as _Session)?.userId
  console.log(`${userId} is now generating from replicate.com ...`)

  const stableDiffusionId = request.url.split("band/generate/")[1]
  console.log(`stableDiffusionId: ${stableDiffusionId}`)

  const res0 = await (await fetch(`https://api.replicate.com/v1/predictions/${stableDiffusionId}`, {
    headers: {'Authorization': `TOKEN ${secret.replicate.token}`}
  })).json() as ReplicateStableDiffusionResponse

  console.log(res0)

  if (!res0 || !res0.status) {
    console.error(`replicate data is empty: ${JSON.stringify(res0)}`)
    return NextResponse.json({ error: 'Internal Server Error'}, { status: 500 })
  }

  console.log(`${request.method} ${request.url} .. complete`)
  if (res0.output) return NextResponse.json({output: res0.output[0]})
  return NextResponse.json({output: res0.status})
}