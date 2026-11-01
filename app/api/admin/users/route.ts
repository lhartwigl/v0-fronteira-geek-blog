import { NextResponse } from 'next/server'
import { authenticated } from '@/lib/access'
import { getDb } from '@/lib/db'
import { accountWritesAllowed, hashPassword } from '@/lib/account-security.mjs'
import { z } from 'zod'

const creation = z.object({ name: z.string().trim().min(1).max(255), email: z.string().trim().email().max(255).transform(value => value.toLowerCase()), password: z.string().min(12).max(128), role: z.enum(['ADMIN', 'AUTHOR']) })
const change = z.object({ id: z.number().int().positive(), role: z.enum(['ADMIN', 'AUTHOR', 'DISABLED']).optional(), password: z.string().min(12).max(128).optional() }).refine(value => value.role !== undefined || value.password !== undefined)

export async function GET(request: Request) {
  const actor = await authenticated(request, true)
  if (actor instanceof Response) return actor
  const sql = getDb()
  const users = await sql`SELECT id, name, email, role, created_at FROM users ORDER BY id`
  return NextResponse.json({ users, currentUserId: actor.userId, canManageAccounts: accountWritesAllowed() })
}

export async function POST(request: Request) {
  const actor = await authenticated(request, true)
  if (actor instanceof Response) return actor
  if (!accountWritesAllowed()) return NextResponse.json({ error: 'As contas estão em modo de revisão. Conclua a publicação antes de criar acessos.' }, { status: 409 })
  let body: z.infer<typeof creation>
  try { body = creation.parse(await request.json()) }
  catch { return NextResponse.json({ error: 'Preencha nome, email e uma senha com pelo menos 12 caracteres.' }, { status: 400 }) }
  try {
    const password = await hashPassword(body.password)
    const sql = getDb()
    const created = await sql`INSERT INTO users (name, email, password, role)
      SELECT ${body.name}, ${body.email}, ${password}, ${body.role}
      WHERE NOT EXISTS (SELECT 1 FROM users WHERE lower(email) = ${body.email})
        AND EXISTS (SELECT 1 FROM users WHERE id = ${actor.userId} AND role = 'ADMIN')
      ON CONFLICT (email) DO NOTHING RETURNING id, name, email, role`
    if (!created.length) return NextResponse.json({ error: 'Email já cadastrado ou acesso alterado. Atualize a página.' }, { status: 409 })
    return NextResponse.json({ user: created[0] }, { status: 201 })
  } catch { return NextResponse.json({ error: 'Não foi possível criar a conta.' }, { status: 503 }) }
}

export async function PUT(request: Request) {
  const actor = await authenticated(request, true)
  if (actor instanceof Response) return actor
  if (!accountWritesAllowed()) return NextResponse.json({ error: 'As contas estão em modo de revisão. Conclua a publicação antes de alterar acessos.' }, { status: 409 })
  let body: z.infer<typeof change>
  try { body = change.parse(await request.json()) }
  catch { return NextResponse.json({ error: 'Informe um perfil válido ou uma senha de pelo menos 12 caracteres.' }, { status: 400 }) }
  if (body.id === actor.userId) return NextResponse.json({ error: 'Altere sua senha em Meu perfil. Seu próprio acesso não pode ser removido nesta tela.' }, { status: 400 })
  try {
    const sql = getDb()
    const password = body.password ? await hashPassword(body.password) : null
    const result = await sql.transaction([
      sql`SELECT id FROM users WHERE role = 'ADMIN' ORDER BY id FOR UPDATE`,
      sql`UPDATE users AS target SET role = COALESCE(${body.role || null}, target.role),
        password = COALESCE(${password}, target.password), updated_at = NOW()
        WHERE target.id = ${body.id}
          AND EXISTS (SELECT 1 FROM users WHERE id = ${actor.userId} AND role = 'ADMIN')
          AND (target.role <> 'ADMIN' OR COALESCE(${body.role || null}, target.role) = 'ADMIN' OR (SELECT COUNT(*) FROM users WHERE role = 'ADMIN') > 1)
        RETURNING target.id, target.name, target.email, target.role`,
    ], { isolationLevel: 'Serializable' })
    if (!result[1].length) return NextResponse.json({ error: 'Conta não encontrada ou alteração bloqueada para preservar um administrador ativo.' }, { status: 409 })
    return NextResponse.json({ user: result[1][0] })
  } catch { return NextResponse.json({ error: 'A conta pode ter sido alterada por outra pessoa. Atualize a lista e tente novamente.' }, { status: 409 }) }
}
