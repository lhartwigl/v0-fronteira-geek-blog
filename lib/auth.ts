import { cookies } from 'next/headers'

const SESSION_COOKIE = 'fg_session'
const SECRET = process.env.SESSION_SECRET || 'fronteira-geek-secret-key-change-in-production'

function encodeToken(payload: { userId: number; email: string; role: string }): string {
  const data = JSON.stringify({ ...payload, exp: Date.now() + 24 * 60 * 60 * 1000 })
  return Buffer.from(data).toString('base64url')
}

function decodeToken(token: string): { userId: number; email: string; role: string; exp: number } | null {
  try {
    const data = JSON.parse(Buffer.from(token, 'base64url').toString())
    if (data.exp < Date.now()) return null
    return data
  } catch {
    return null
  }
}

export async function createSession(userId: number, email: string, role: string) {
  const token = encodeToken({ userId, email, role })
  const signed = `${token}.${Buffer.from(SECRET).toString('base64url')}`
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  })
  return signed
}

export async function getSession() {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(SESSION_COOKIE)
  if (!cookie) return null

  const [token, sig] = cookie.value.split('.')
  if (sig !== Buffer.from(SECRET).toString('base64url')) return null

  return decodeToken(token)
}

export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}
