import { createHash, timingSafeEqual } from 'node:crypto'

export const TIME_ZONE = 'America/Sao_Paulo'
export const SLOTS = { morning: { hour: 9, label: '09h' }, evening: { hour: 18, label: '18h' } }

export function localDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

export function isSlotHour(slot, now = new Date()) {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, hour: '2-digit', hourCycle: 'h23' }).format(now))
  return Object.hasOwn(SLOTS, slot) && hour === SLOTS[slot].hour
}

export function categoryIndex(day, slot, count) {
  if (!count || !Object.hasOwn(SLOTS, slot)) throw new Error('INVALID_CATEGORY_ROTATION')
  return (Math.floor(Date.parse(`${day}T00:00:00Z`) / 86400000) * 2 + (slot === 'evening' ? 1 : 0)) % count
}

export function storyKey(title) {
  const normalized = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  return createHash('sha256').update(normalized).digest('hex')
}

export function bearerMatches(header, secret) {
  if (!secret || secret.length < 32 || !header) return false
  const actual = Buffer.from(header)
  const expected = Buffer.from(`Bearer ${secret}`)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])
}

export function safeSourceUrl(value) {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password) return null
    return url.href
  } catch { return null }
}

export function isRecentDate(value, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const timestamp = Date.parse(`${value}T00:00:00Z`)
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value
    && value <= localDate(now) && now.getTime() - timestamp <= 4 * 86400000
}

// Only plain model text is accepted. HTML and links are constructed here.
export function articleHtml(paragraphs, sources) {
  const body = paragraphs.map((paragraph) => {
    if (!paragraph.source_ids.length || paragraph.source_ids.some((id) => !sources[id])) throw new Error('INVALID_CITATIONS')
    const citations = [...new Set(paragraph.source_ids)].map((id) => `<a href="${escapeHtml(sources[id].url)}" target="_blank" rel="noopener noreferrer">[${id + 1}]</a>`).join(' ')
    return `${paragraph.heading ? `<h2>${escapeHtml(paragraph.heading)}</h2>` : ''}<p>${escapeHtml(paragraph.text)} ${citations}</p>`
  }).join('\n')
  const usedIds = [...new Set(paragraphs.flatMap((paragraph) => paragraph.source_ids))]
  const references = usedIds.map((id) => `<li><a href="${escapeHtml(sources[id].url)}" target="_blank" rel="noopener noreferrer">[${id + 1}] ${escapeHtml(sources[id].title)}</a></li>`).join('')
  return `${body}\n<h2>Fontes</h2><ul>${references}</ul>`
}
