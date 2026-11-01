import test from 'node:test'
import assert from 'node:assert/strict'
import { hashPassword, verifyPassword, encodeSession, decodeSession, credentialVersion, canEditPost, sameOrigin, validPassword, accountWritesAllowed } from '../lib/account-security.mjs'
import { cleanContent } from '../lib/content-security.ts'

test('prévia bloqueia alterações de contas por padrão', () => {
  const production = process.env.VERCEL_ENV
  const local = process.env.ALLOW_LOCAL_ACCOUNT_CHANGES
  try {
    delete process.env.VERCEL_ENV; delete process.env.ALLOW_LOCAL_ACCOUNT_CHANGES
    assert.equal(accountWritesAllowed(), false)
    process.env.VERCEL_ENV = 'production'
    assert.equal(accountWritesAllowed(), true)
  } finally {
    if (production === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = production
    if (local === undefined) delete process.env.ALLOW_LOCAL_ACCOUNT_CHANGES; else process.env.ALLOW_LOCAL_ACCOUNT_CHANGES = local
  }
})

test('senhas recebem sal diferente e validação rejeita senha errada', async () => {
  const password = 'uma-senha-de-teste-exclusiva'
  const first = await hashPassword(password)
  const second = await hashPassword(password)
  assert.notEqual(first, second)
  assert.ok(first.startsWith('$scrypt$'))
  assert.equal(await verifyPassword(password, first), true)
  assert.equal(await verifyPassword('errada', first), false)
  assert.equal(await verifyPassword(password, first+'$extra'), false)
  assert.equal(validPassword('curta'), false)
  assert.equal(validPassword(password), true)
})

test('migração preserva o valor exato da senha antiga, inclusive senhas curtas', async () => {
  assert.equal(await verifyPassword('antiga', 'antiga'), true)
  assert.equal(await verifyPassword('errada', 'antiga'), false)
  const migrated = await hashPassword('antiga')
  assert.equal(await verifyPassword('antiga', migrated), true)
})

test('sessão rejeita adulteração, assinatura legada e expiração', () => {
  const secret = 's'.repeat(48)
  const user = { id: 3, password: 'hash-exclusivo', role: 'ADMIN' }
  const now = Date.now()
  const cookie = encodeSession(user, secret, now)
  const payload = decodeSession(cookie, secret, now)
  assert.equal(payload.userId, 3)
  const changed = { ...payload, userId: 8 }
  assert.equal(decodeSession(`${Buffer.from(JSON.stringify(changed)).toString('base64url')}.${cookie.split('.')[1]}`, secret, now), null)
  assert.equal(decodeSession(`${cookie.split('.')[0]}.${Buffer.from(secret).toString('base64url')}`, secret, now), null)
  assert.equal(decodeSession(cookie, secret, now+86400000), null)
  assert.equal(decodeSession(cookie, 'outro-segredo'.repeat(4), now), null)
  assert.throws(() => encodeSession(user, ''), /SESSION_SECRET/)
  assert.notEqual(credentialVersion({ ...user, password: 'novo-hash' }, secret), payload.version)
  assert.notEqual(credentialVersion({ ...user, role: 'DISABLED' }, secret), payload.version)
  assert.notEqual(credentialVersion({ ...user, auth_version: 'new-account-version' }, secret), payload.version)
})

test('autores só editam seus próprios rascunhos; administradores têm acesso editorial completo', () => {
  const author = { userId: 5, role: 'AUTHOR' }
  assert.equal(canEditPost(author, { author_id: 5, status: 'draft' }), true)
  assert.equal(canEditPost(author, { author_id: 9, status: 'draft' }), false)
  assert.equal(canEditPost(author, { author_id: 5, status: 'published' }), false)
  assert.equal(canEditPost({ role: 'ADMIN' }, { author_id: 9, status: 'published' }), true)
  assert.equal(canEditPost({ role: 'DISABLED' }, { author_id: 5, status: 'draft' }), false)
})

test('requisições vindas de outro site são rejeitadas', () => {
  assert.equal(sameOrigin(new Request('https://blog.example/api', { headers: { Origin:'https://outro.example' } })), false)
  assert.equal(sameOrigin(new Request('https://blog.example/api', { headers: { Origin:'https://blog.example' } })), true)
  assert.equal(sameOrigin(new Request('https://blog.example/api', { headers: { 'Sec-Fetch-Site':'cross-site' } })), false)
  assert.equal(sameOrigin(new Request('http://localhost:3001/api', { headers: { Host:'127.0.0.1:3001', Origin:'http://127.0.0.1:3001', 'Sec-Fetch-Site':'same-origin' } })), true)
  assert.equal(sameOrigin(new Request('http://localhost:3001/api', { headers: { Host:'127.0.0.1:3001', Origin:'http://outro.example', 'Sec-Fetch-Site':'same-origin' } })), false)
})

test('conteúdo mantém formatação e vídeos permitidos, mas remove scripts e atributos executáveis', () => {
  const html = cleanContent('<h2>Título</h2><p style="text-align:center;color:red" onclick="alert(1)">Texto <strong>forte</strong></p><script>alert(1)</script><img src="https://example.com/img.jpg" onerror="alert(1)"><a href="javascript:alert(1)">link</a><iframe src="https://evil.example"></iframe><iframe src="https://www.youtube.com/embed/123"></iframe>')
  assert.ok(html.includes('<h2>Título</h2>'))
  assert.ok(html.includes('text-align:center'))
  assert.ok(html.includes('https://www.youtube.com/embed/123'))
  assert.ok(html.includes('https://example.com/img.jpg'))
  for (const value of ['<script', 'onclick', 'onerror', 'javascript:', 'evil.example', 'color:red']) assert.equal(html.includes(value), false)
})
