import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { accountWritesAllowed } from '@/lib/account-security.mjs'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 })
  }
  return NextResponse.json({ user: session, accountChangesAllowed: accountWritesAllowed() })
}
