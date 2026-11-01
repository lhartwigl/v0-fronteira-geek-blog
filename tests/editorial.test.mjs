import test from 'node:test'
import assert from 'node:assert/strict'
import { articleHtml, bearerMatches, categoryIndex, isRecentDate, isSlotHour, localDate, safeSourceUrl, storyKey } from '../lib/editorial-policy.mjs'
import { generateArticle } from '../lib/editorial-ai.ts'
import { readFileSync } from 'node:fs'

test('dois disparos diários correspondem a 09h e 18h de Brasília', () => {
  const { crons } = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url)))
  assert.deepEqual(crons.map((cron) => cron.schedule), ['0 12 * * *', '0 21 * * *'])
  assert.ok(isSlotHour('morning', new Date('2026-11-01T12:59:00Z')))
  assert.ok(isSlotHour('evening', new Date('2026-11-01T21:30:00Z')))
  assert.equal(isSlotHour('morning', new Date('2026-11-01T21:30:00Z')), false)
  assert.equal(isSlotHour('constructor', new Date()), false)
  assert.equal(localDate(new Date('2026-11-02T02:00:00Z')), '2026-11-01')
})

test('rotação cobre todas as categorias e separa manhã e noite', () => {
  const categories = new Set()
  for (let day = 1; day <= 8; day++) for (const slot of ['morning', 'evening']) categories.add(categoryIndex(`2026-11-0${day}`, slot, 8))
  assert.equal(categories.size, 8)
  assert.notEqual(categoryIndex('2026-11-01', 'morning', 8), categoryIndex('2026-11-01', 'evening', 8))
})

test('cron rejeita segredo ausente, curto ou incorreto', () => {
  const secret = 'x'.repeat(40)
  assert.equal(bearerMatches(`Bearer ${secret}`, secret), true)
  assert.equal(bearerMatches(`Bearer ${'y'.repeat(40)}`, secret), false)
  assert.equal(bearerMatches('Bearer tiny', 'tiny'), false)
  assert.equal(bearerMatches(null, secret), false)
})

test('HTML de saída escapa texto e só usa links HTTPS de fontes pesquisadas', () => {
  const html = articleHtml([{ heading: '<img src=x onerror=alert(1)>', text: '<script>bad()</script>', source_ids: [0] }], [{ url: 'https://example.com/?a=1&b=2', title: '<b>Fonte</b>' }])
  assert.equal(html.includes('<script>'), false)
  assert.ok(html.includes('&lt;script&gt;'))
  assert.ok(html.includes('https://example.com/?a=1&amp;b=2'))
  assert.throws(() => articleHtml([{ heading: '', text: 'x', source_ids: [7] }], []))
  assert.equal(safeSourceUrl('javascript:alert(1)'), null)
  assert.equal(safeSourceUrl('https://user:password@example.com'), null)
})

test('deduplicação normaliza acentos e pontuação; datas futuras e impossíveis são rejeitadas', () => {
  assert.equal(storyKey('Anúncio: Novo GAME!'), storyKey('anuncio novo game'))
  assert.equal(isRecentDate('2026-11-02', new Date('2026-11-01T12:00:00Z')), false)
  assert.equal(isRecentDate('2026-02-30', new Date('2026-03-01T12:00:00Z')), false)
  assert.equal(isRecentDate('2025-11-01', new Date('2026-11-01T12:00:00Z')), false)
})

function response(text, sources = []) {
  return new Response(JSON.stringify({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text, annotations: sources.map((source) => ({ type: 'url_citation', ...source })) }] }] }), { status: 200 })
}

function draft(overrides = {}) {
  return { publishable: true, reason: '', title: 'Uma notícia confirmada', news_date: localDate(), source_id: 0,
    excerpt: 'Resumo', meta_description: 'Descrição', tags: ['Games'],
    paragraphs: Array.from({ length: 4 }, () => ({ heading: '', text: 'palavra '.repeat(100).trim(), source_ids: [0] })), ...overrides }
}

test('geração pesquisa antes de escrever, mantém citações e não publica no banco', async (t) => {
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    const body = JSON.parse(options.body)
    if (body.tools) return response('Anúncio oficial de hoje.', [{ url: 'https://example.com/anuncio', title: 'Fonte oficial' }])
    return response(JSON.stringify(draft()))
  })
  const previous = process.env.OPENAI_API_KEY
  process.env.OPENAI_API_KEY = 'test-key-not-real'
  try {
    const article = await generateArticle({ title: 'Teste', categoryName: 'Games', automatic: true })
    assert.ok(article.content.includes('https://example.com/anuncio'))
    assert.equal(article.sourceUrl, 'https://example.com/anuncio')
    assert.equal(globalThis.fetch.mock.calls.length, 2)
    assert.equal(JSON.parse(globalThis.fetch.mock.calls[0].arguments[1].body).tool_choice, 'required')
  } finally { if (previous === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previous }
})

test('sem fontes, sem crédito ou notícia recusada não produz artigo', async (t) => {
  const previous = process.env.OPENAI_API_KEY
  process.env.OPENAI_API_KEY = 'test-key-not-real'
  try {
    t.mock.method(globalThis, 'fetch', async () => response('Texto sem fontes.'))
    await assert.rejects(generateArticle({ categoryName: 'Games' }), { code: 'NO_VERIFIED_SOURCES' })
    globalThis.fetch.mock.restore()
    t.mock.method(globalThis, 'fetch', async () => new Response('corpo privado do provedor', { status: 429 }))
    await assert.rejects(generateArticle({ categoryName: 'Games' }), { code: 'AI_LIMIT_REACHED' })
    globalThis.fetch.mock.restore()
    let count = 0
    t.mock.method(globalThis, 'fetch', async () => ++count === 1 ? response('Sem notícia.', [{ url: 'https://example.com/source', title: 'Fonte' }]) : response(JSON.stringify(draft({ publishable: false, paragraphs: [] }))))
    await assert.rejects(generateArticle({ categoryName: 'Games', automatic: true }), { code: 'NO_VERIFIED_STORY' })
  } finally { if (previous === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previous }
})
