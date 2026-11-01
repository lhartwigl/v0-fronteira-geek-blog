import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire, Module } from 'node:module'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import * as security from '../lib/account-security.mjs'
import * as policy from '../lib/editorial-policy.mjs'
import { EditorialError } from '../lib/editorial-ai.ts'

const require = createRequire(import.meta.url)
function load(relative, overrides) {
  const filename = fileURLToPath(new URL(relative, import.meta.url))
  const module = new Module(filename)
  module.filename = filename
  module.require = id => Object.hasOwn(overrides, id) ? overrides[id] : require(id)
  module._compile(ts.transpileModule(readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, filename)
  return module.exports
}
function restore(name, value) { if (value === undefined) delete process.env[name]; else process.env[name] = value }

test('geração exige sessão e origem, aceita autores e informa chave ausente sem gastar API', async () => {
  let user = null
  let generated = 0
  const scopes = []
  const { authenticated } = load('../lib/access.ts', { './auth': { getSession: async () => user }, './account-security.mjs': security })
  const route = load('../app/api/ai/generate/route.ts', {
    '@/lib/access': { authenticated },
    '@/lib/auth-throttle': { consumePublicAttempt: async (_request, scope) => { scopes.push(scope); return true } },
    '@/lib/editorial-ai': { EditorialError, generateArticle: async () => { generated++; return { content: '<p>Rascunho</p>' } } },
  })
  const request = (origin = 'http://127.0.0.1:3001') => new Request('http://127.0.0.1:3001/api/ai/generate', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify({ title: 'Tema de teste' }) })
  const original = process.env.OPENAI_API_KEY
  try {
    delete process.env.OPENAI_API_KEY
    assert.equal((await route.POST(request())).status, 401)
    user = { userId: 42, role: 'AUTHOR' }
    assert.equal((await route.POST(request('https://other.example'))).status, 403)
    assert.equal((await route.POST(request())).status, 503)
    assert.equal(generated, 0)
    assert.deepEqual(scopes, [])
    process.env.OPENAI_API_KEY = 'fake-test-key'
    const result = await route.POST(request())
    assert.equal(result.status, 200)
    assert.equal((await result.json()).content, '<p>Rascunho</p>')
    assert.deepEqual(scopes, ['ai:42'])
  } finally { restore('OPENAI_API_KEY', original) }
})

test('agendamento exige segredo, ativação e produção; prévia nunca publica', async () => {
  const names = ['CRON_SECRET', 'AUTOMATION_ENABLED', 'VERCEL_ENV']
  const before = names.map(name => process.env[name])
  let published = 0
  const { GET } = load('../app/api/cron/publish/[slot]/route.ts', {
    '@/lib/editorial-policy.mjs': { ...policy, isSlotHour: () => true },
    '@/lib/editorial-run': { runEditorial: async () => { published++; return { status: 'published' } } },
  })
  const secret = 'x'.repeat(40)
  const request = token => new Request('http://127.0.0.1:3001/api/cron/publish/morning', { headers: token ? { authorization: `Bearer ${token}` } : {} })
  const context = { params: Promise.resolve({ slot: 'morning' }) }
  try {
    process.env.CRON_SECRET = secret
    assert.equal((await GET(request(), context)).status, 401)
    process.env.AUTOMATION_ENABLED = 'false'
    assert.equal((await (await GET(request(secret), context)).json()).status, 'disabled')
    process.env.AUTOMATION_ENABLED = 'true'
    delete process.env.VERCEL_ENV
    assert.equal((await GET(request(secret), context)).status, 403)
    process.env.VERCEL_ENV = 'preview'
    assert.equal((await GET(request(secret), context)).status, 403)
    assert.equal(published, 0)
    process.env.VERCEL_ENV = 'production'
    assert.equal((await GET(request(secret), context)).status, 200)
    assert.equal(published, 1)
  } finally { names.forEach((name, index) => restore(name, before[index])) }
})
