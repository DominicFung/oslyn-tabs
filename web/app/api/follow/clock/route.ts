import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/** Shared clock for Train me takes in one jam. No AWS resources. */
export function GET() {
  return NextResponse.json({ now: Date.now() })
}
