import { createHmac } from 'node:crypto'
import { getDb } from './db'

export async function consumeLoginAttempt(email: string, ip: string) {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) throw new Error('SESSION_SECRET_NOT_CONFIGURED')
  const sql = getDb()
  const buckets = [
    { key: `email:${email}`, limit: 8 },
    { key: `ip:${ip}`, limit: 30 },
  ]
  for (const item of buckets) {
    const key = createHmac('sha256', secret).update(item.key).digest('hex')
    const rows = await sql`
      INSERT INTO auth_rate_limits (bucket, attempts, resets_at) VALUES (${key}, 1, NOW() + INTERVAL '15 minutes')
      ON CONFLICT (bucket) DO UPDATE SET
        attempts = CASE WHEN auth_rate_limits.resets_at <= NOW() THEN 1 ELSE auth_rate_limits.attempts + 1 END,
        resets_at = CASE WHEN auth_rate_limits.resets_at <= NOW() THEN NOW() + INTERVAL '15 minutes' ELSE auth_rate_limits.resets_at END
      RETURNING attempts
    `
    if (rows[0].attempts > item.limit) return false
  }
  await sql`DELETE FROM auth_rate_limits WHERE resets_at < NOW() - INTERVAL '1 day'`
  return true
}
