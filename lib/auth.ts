import { cookies } from 'next/headers'
import { getDb } from './db'
import { credentialVersion, decodeSession, encodeSession, ROLES } from './account-security.mjs'

export type Role = 'ADMIN' | 'AUTHOR'
export type SessionUser = { userId: number; email: string; name: string; role: Role }
const SESSION_COOKIE = 'fg_session'

export async function createSession(user: { id: number; email: string; role: string; password: string; auth_version?: string }) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, encodeSession(user, process.env.SESSION_SECRET), {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 86400, path: '/',
  })
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies()
  const payload = decodeSession(store.get(SESSION_COOKIE)?.value, process.env.SESSION_SECRET)
  if (!payload) return null
  const sql = getDb()
  const rows = await sql`SELECT id, email, name, role, password, updated_at::text AS auth_version FROM users WHERE id = ${payload.userId}`
  const user = rows[0]
  if (!user || !ROLES.includes(user.role) || credentialVersion(user, process.env.SESSION_SECRET) !== payload.version) return null
  return { userId: user.id, email: user.email, name: user.name || '', role: user.role }
}

export async function destroySession() { (await cookies()).delete(SESSION_COOKIE) }
