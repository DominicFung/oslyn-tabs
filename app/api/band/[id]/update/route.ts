import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  console.log(`${request.method} ${request.url}`)

  console.log(`${request.method} ${request.url} .. complete`)
  return NextResponse.json({})
}