import { NextResponse } from 'next/server'
import { getSession } from './auth'
import { sameOrigin } from './account-security.mjs'

export async function authenticated(request?: Request, adminOnly = false) {
  if (request && !['GET', 'HEAD'].includes(request.method) && !sameOrigin(request)) return NextResponse.json({ error: 'Origem não autorizada.' }, { status: 403 })
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Entre novamente para continuar.' }, { status: 401 })
  if (adminOnly && user.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso exclusivo do administrador.' }, { status: 403 })
  return user
}
