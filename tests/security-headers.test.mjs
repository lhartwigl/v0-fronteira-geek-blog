import test from 'node:test'
import assert from 'node:assert/strict'
import { contentSecurityPolicy } from '../lib/security-headers.mjs'
import config from '../next.config.mjs'

test('CSP de produção só autoriza scripts com nonce e bloqueia enquadramento e objetos', () => {
  const policy = contentSecurityPolicy('test-random-nonce')
  assert.ok(policy.includes("'nonce-test-random-nonce' 'strict-dynamic'"))
  assert.ok(policy.includes("script-src-attr 'none'"))
  assert.ok(policy.includes("frame-ancestors 'none'"))
  assert.ok(policy.includes("object-src 'none'"))
  assert.ok(policy.includes('upgrade-insecure-requests'))
  assert.equal(policy.includes('unsafe-eval'), false)
  assert.throws(() => contentSecurityPolicy("x'; script-src *"))
  assert.notEqual(contentSecurityPolicy('nonce-one'), contentSecurityPolicy('nonce-two'))
})

test('modo de desenvolvimento permite HMR sem exigir HTTPS local', () => {
  const policy = contentSecurityPolicy('dev-nonce', true)
  assert.ok(policy.includes('unsafe-eval'))
  assert.ok(policy.includes('ws:'))
  assert.equal(policy.includes('upgrade-insecure-requests'), false)
})

test('APIs privadas não podem ser armazenadas em cache; imagens ficam limitadas ao armazenamento usado', async () => {
  const headers = await config.headers()
  const common = headers.find(value => value.source === '/:path*').headers
  assert.ok(common.some(value => value.key === 'X-Content-Type-Options' && value.value === 'nosniff'))
  assert.ok(common.some(value => value.key === 'X-Frame-Options' && value.value === 'DENY'))
  assert.ok(headers.find(value => value.source === '/api/:path*').headers.some(value => value.key === 'Cache-Control' && value.value.includes('no-store')))
  assert.equal(config.images.dangerouslyAllowLocalIP, false)
  assert.equal(config.images.dangerouslyAllowSVG, false)
  assert.equal(config.images.maximumRedirects, 0)
  assert.equal(config.images.remotePatterns.some(value => value.hostname === '**'), false)
  assert.notEqual(config.typescript?.ignoreBuildErrors, true)
})
