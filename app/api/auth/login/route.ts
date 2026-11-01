import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { createSession } from '@/lib/auth'
import { hashPassword, isPasswordHash, ROLES, sameOrigin, verifyPassword } from '@/lib/account-security.mjs'
import { consumeLoginAttempt } from '@/lib/auth-throttle'
import { z } from 'zod'

const input = z.object({ email: z.string().trim().email().max(255).transform(value => value.toLowerCase()), password: z.string().min(1).max(128) })

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Origem não autorizada.' }, { status: 403 })
  let body: z.infer<typeof input>
  try { body = input.parse(await request.json()) }
  catch { return NextResponse.json({ error: 'Informe um email e senha válidos.' }, { status: 400 }) }
  try {
    // The platform-provided client IP is used in production; the email bucket
    // is independent of headers and remains enforced for every request.
    const ip = (request.headers.get('x-vercel-forwarded-for') || request.headers.get('x-forwarded-for') || 'local').split(',')[0].trim().slice(0, 100)
    if (!await consumeLoginAttempt(body.email, ip)) return NextResponse.json({ error: 'Muitas tentativas. Aguarde 15 minutos para tentar novamente.' }, { status: 429, headers: { 'Retry-After': '900' } })
    const sql = getDb()
    const rows = await sql`SELECT id, email, password, role, updated_at::text AS auth_version FROM users WHERE lower(email) = ${body.email}`
    const user = rows.length === 1 ? rows[0] : null
    const valid = user ? await verifyPassword(body.password, user.password) : (await hashPassword('invalid-account-dummy-password'), false)
    if (!valid || !user || !ROLES.includes(user.role)) return NextResponse.json({ error: 'Email ou senha inválidos.' }, { status: 401 })
    // Local previews must not upgrade a live password while the deployed
    // legacy login still compares plain text. Upgrade only after deployment.
    if (!isPasswordHash(user.password) && process.env.VERCEL_ENV === 'production') {
      const upgraded = await hashPassword(body.password)
      const changed = await sql`UPDATE users SET password = ${upgraded}, updated_at = NOW() WHERE id = ${user.id} AND password = ${user.password} RETURNING password, updated_at::text AS auth_version`
      if (!changed.length) return NextResponse.json({ error: 'Tente entrar novamente.' }, { status: 409 })
      user.password = changed[0].password
      user.auth_version = changed[0].auth_version
    }
    await createSession(user as { id: number; email: string; password: string; role: string })
    return NextResponse.json({ user: { userId: user.id, email: user.email, role: user.role } })
  } catch {
    return NextResponse.json({ error: 'Login indisponível. Confira a configuração do servidor e tente novamente.' }, { status: 503 })
  }
}
