import { NextResponse } from 'next/server'
import { authenticated } from '@/lib/access'
import { createSession } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { accountWritesAllowed, hashPassword, verifyPassword } from '@/lib/account-security.mjs'
import { z } from 'zod'
import { consumeLoginAttempt } from '@/lib/auth-throttle'

const input = z.object({ currentPassword: z.string().min(1).max(128), newPassword: z.string().min(12).max(128) })

export async function POST(request: Request) {
  const actor = await authenticated(request)
  if (actor instanceof Response) return actor
  if (!accountWritesAllowed()) return NextResponse.json({ error: 'Troca de senha disponível após a publicação desta versão.' }, { status: 409 })
  let body: z.infer<typeof input>
  try { body = input.parse(await request.json()) }
  catch { return NextResponse.json({ error: 'A nova senha deve ter entre 12 e 128 caracteres.' }, { status: 400 }) }
  if (body.currentPassword === body.newPassword) return NextResponse.json({ error: 'Escolha uma senha diferente da atual.' }, { status: 400 })
  try {
    if (!await consumeLoginAttempt(actor.email, `password:${actor.userId}`)) return NextResponse.json({ error: 'Muitas tentativas. Aguarde 15 minutos.' }, { status: 429 })
    const sql = getDb()
    const rows = await sql`SELECT id, email, password, role, updated_at::text AS auth_version FROM users WHERE id = ${actor.userId}`
    const user = rows[0]
    if (!user || !await verifyPassword(body.currentPassword, user.password)) return NextResponse.json({ error: 'A senha atual está incorreta.' }, { status: 400 })
    const password = await hashPassword(body.newPassword)
    const changed = await sql`UPDATE users SET password = ${password}, updated_at = NOW() WHERE id = ${actor.userId} AND password = ${user.password} RETURNING id, email, role, password, updated_at::text AS auth_version`
    if (!changed.length) return NextResponse.json({ error: 'A conta foi atualizada. Entre novamente.' }, { status: 409 })
    await createSession(changed[0] as { id: number; email: string; role: string; password: string })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Não foi possível alterar a senha.' }, { status: 503 }) }
}
