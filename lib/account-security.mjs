import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const derive = promisify(scrypt)
export const ROLES = ['ADMIN', 'AUTHOR']
export const PASSWORD_MIN = 12

export function accountWritesAllowed() {
  return process.env.VERCEL_ENV === 'production' || process.env.ALLOW_LOCAL_ACCOUNT_CHANGES === 'true'
}

export function validPassword(password) {
  return typeof password === 'string' && password.length >= PASSWORD_MIN && password.length <= 128
}

export async function hashPassword(password) {
  if (typeof password !== 'string' || !password.length || password.length > 128) throw new Error('PASSWORD_POLICY')
  const salt = randomBytes(16).toString('hex')
  const hash = await derive(password, salt, 64, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 })
  return `$scrypt$32768$8$3$${salt}$${hash.toString('hex')}`
}

export function isPasswordHash(value) { return typeof value === 'string' && value.startsWith('$scrypt$') }

export async function verifyPassword(password, stored) {
  if (typeof password !== 'string' || password.length > 128 || typeof stored !== 'string') return false
  if (!isPasswordHash(stored)) {
    return timingSafeEqual(createHash('sha256').update(password).digest(), createHash('sha256').update(stored).digest())
  }
  const parts = stored.split('$')
  if (parts.length !== 7 || parts.slice(1, 5).join('$') !== 'scrypt$32768$8$3' || !/^[a-f0-9]{32}$/.test(parts[5]) || !/^[a-f0-9]{128}$/.test(parts[6] || '')) return false
  const actual = await derive(password, parts[5], 64, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 })
  return timingSafeEqual(actual, Buffer.from(parts[6], 'hex'))
}

export function credentialVersion(user, secret) {
  return createHmac('sha256', secret).update(`${user.password}\0${user.role}\0${user.auth_version || ''}`).digest('base64url')
}

export function encodeSession(user, secret, now = Date.now()) {
  if (!secret || secret.length < 32) throw new Error('SESSION_SECRET_NOT_CONFIGURED')
  const token = Buffer.from(JSON.stringify({ userId: user.id, version: credentialVersion(user, secret), exp: now + 86400000 })).toString('base64url')
  return `${token}.${createHmac('sha256', secret).update(token).digest('base64url')}`
}

export function decodeSession(value, secret, now = Date.now()) {
  if (!secret || secret.length < 32 || typeof value !== 'string' || value.length > 4096) return null
  const [token, signature, extra] = value.split('.')
  if (!token || !signature || extra !== undefined) return null
  const expected = createHmac('sha256', secret).update(token).digest()
  const actual = Buffer.from(signature, 'base64url')
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null
  try {
    const data = JSON.parse(Buffer.from(token, 'base64url').toString())
    return Number.isSafeInteger(data.userId) && data.userId > 0 && typeof data.version === 'string'
      && Number.isFinite(data.exp) && data.exp > now && data.exp <= now + 86400000 ? data : null
  } catch { return null }
}

export function canEditPost(user, post) {
  return user?.role === 'ADMIN' || (user?.role === 'AUTHOR' && Number(post.author_id) === user.userId && post.status === 'draft')
}

export function sameOrigin(request) {
  if (request.headers.get('sec-fetch-site') === 'cross-site') return false
  const origin = request.headers.get('origin')
  if (!origin) return true
  try {
    // Next normalizes the local request URL to localhost even when the
    // browser uses 127.0.0.1. Host retains the browser's actual destination.
    const requestUrl = new URL(request.url)
    const destination = new URL(`${requestUrl.protocol}//${request.headers.get('host') || requestUrl.host}`)
    return origin === destination.origin
  } catch { return false }
}
