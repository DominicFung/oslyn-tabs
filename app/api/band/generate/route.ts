import { NextResponse } from 'next/server'

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/core/auth"
import { Session } from "next-auth"

import secret from "@/secret.json"
import { GenerateAIImageRequest, ReplicateStableDiffusionRequest, ReplicateStableDiffusionResponse, STABLEDIFF_MODEL_VERSION } from './stablediffusion'

type _Session = Session & {
  userId: string
}

export async function POST(request: Request) {
  console.log(`${request.method} ${request.url}`)
  const b = await request.json() as GenerateAIImageRequest

  const session = await getServerSession(authOptions)
  if (!(session?.user as _Session)?.userId) { return NextResponse.json({ error: 'Unauthorized'}, { status: 401 }) }
  const userId = (session?.user as _Session)?.userId
  console.log(`${userId} is now generating from replicate.com ...`)

  const res0 = await (await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {'Authorization': `TOKEN ${secret.replicate.token}`},
    body: JSON.stringify({
      version: STABLEDIFF_MODEL_VERSION,
      input: b.input
    } as ReplicateStableDiffusionRequest)
  })).json() as ReplicateStableDiffusionResponse
  console.log(res0)

  if (!res0 || !res0.id) {
    console.error(`replicate data is empty: ${JSON.stringify(res0)}`)
    return NextResponse.json({ error: 'Internal Server Error'}, { status: 500 })
  }

  console.log(`${request.method} ${request.url} .. complete`)
  return NextResponse.json({id: res0.id})
}