import { randomUUID } from 'node:crypto'
import { getDb } from './db'
import { slugify } from './slugify'
import { readingTime } from './format'
import { EditorialError, generateArticle } from './editorial-ai'
import { categoryIndex, localDate, storyKey } from './editorial-policy.mjs'

export async function runEditorial(slot: 'morning' | 'evening') {
  const sql = getDb()
  const authorId = Number(process.env.AUTOMATION_AUTHOR_ID)
  if (!Number.isSafeInteger(authorId) || authorId < 1) throw new Error('AUTHOR_NOT_CONFIGURED')
  const authors = await sql`SELECT id FROM users WHERE id = ${authorId} AND role = 'ADMIN'`
  if (!authors.length) throw new Error('AUTHOR_NOT_FOUND')
  const categories = await sql`SELECT id, name FROM categories ORDER BY id`
  if (!categories.length) throw new Error('NO_CATEGORIES')
  const day = localDate()
  const category = categories[categoryIndex(day, slot, categories.length)]
  const lease = randomUUID()
  const claims = await sql`
    INSERT INTO editorial_runs (publication_day, slot, lease_token)
    VALUES (${day}, ${slot}, ${lease})
    ON CONFLICT (publication_day, slot) DO UPDATE
    SET status = 'running', lease_token = EXCLUDED.lease_token, started_at = NOW(),
        finished_at = NULL, error_code = NULL, attempts = editorial_runs.attempts + 1
    WHERE editorial_runs.attempts < 3 AND
      (editorial_runs.status = 'failed' OR (editorial_runs.status = 'running' AND editorial_runs.started_at < NOW() - INTERVAL '10 minutes'))
    RETURNING id
  `
  if (!claims.length) return { status: 'already_handled' }
  const runId = claims[0].id
  try {
    const recent = await sql`SELECT title FROM posts WHERE created_at > NOW() - INTERVAL '30 days' ORDER BY created_at DESC LIMIT 100`
    const article = await generateArticle({ categoryName: category.name, recentTitles: recent.map((post) => String(post.title)), automatic: true })
    const duplicate = await sql`SELECT id FROM posts WHERE lower(trim(title)) = lower(trim(${article.title})) LIMIT 1`
    if (duplicate.length) throw new EditorialError('NO_NEW_STORY', 422)
    const key = storyKey(article.title)
    const slug = `${slugify(article.title)}-${day}-${slot}`
    // Atomic insert/completion: a failed completion rolls back the post.
    // A timed-out worker cannot publish after another request acquires its lease.
    const published = await sql`
      WITH owned AS (
        SELECT id FROM editorial_runs WHERE id = ${runId} AND lease_token = ${lease} AND status = 'running' FOR UPDATE
      ), inserted AS (
        INSERT INTO posts (title, slug, content, excerpt, category_id, featured, status, reading_time, meta_description, tags, author_id)
        SELECT ${article.title}, ${slug}, ${article.content}, ${article.excerpt}, ${category.id}, false, 'published',
               ${readingTime(article.content)}, ${article.meta_description}, ${article.tags}, ${authorId}
        WHERE EXISTS (SELECT 1 FROM owned)
          AND EXISTS (SELECT 1 FROM users WHERE id = ${authorId} AND role = 'ADMIN')
        RETURNING id
      )
      UPDATE editorial_runs SET status = 'published', finished_at = NOW(), post_id = inserted.id,
        story_key = ${key}, source_url = ${article.sourceUrl}
      FROM inserted
      WHERE editorial_runs.id = ${runId} AND lease_token = ${lease} AND editorial_runs.status = 'running'
      RETURNING post_id
    `
    if (published.length) return { status: 'published', postId: published[0].post_id }
    await sql`UPDATE editorial_runs SET status = 'failed', finished_at = NOW(), error_code = 'AUTHOR_OR_LEASE_CHANGED'
      WHERE id = ${runId} AND lease_token = ${lease} AND status = 'running'`
    return { status: 'lease_expired' }
  } catch (error) {
    const code = error instanceof EditorialError ? error.code
      : typeof error === 'object' && error && 'code' in error && error.code === '23505' ? 'NO_NEW_STORY' : 'AUTOMATION_FAILED'
    const skipped = code.startsWith('NO_')
    await sql`UPDATE editorial_runs SET status = ${skipped ? 'skipped' : 'failed'}, error_code = ${code}, finished_at = NOW()
      WHERE id = ${runId} AND lease_token = ${lease} AND status = 'running'`
    return { status: skipped ? 'skipped' : 'failed', code }
  }
}
