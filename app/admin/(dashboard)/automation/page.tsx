import Link from 'next/link'
import { getDb } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

const labels: Record<string, string> = { running: 'Em andamento', published: 'Publicado', skipped: 'Sem notícia nova verificável', failed: 'Falhou' }

export default async function AutomationPage() {
  const session = await getSession()
  if (!session) redirect('/admin/login')
  if (session.role !== 'ADMIN') redirect('/admin/posts')
  let runs: { id: number; publication_day: string; slot: string; status: string; post_id: number | null; title: string | null }[] = []
  let available = true
  let authorName = ''
  try {
    const sql = getDb()
    const result = await sql`SELECT r.id, to_char(r.publication_day, 'DD/MM/YYYY') AS publication_day, r.slot, r.status, r.post_id, p.title
      FROM editorial_runs r LEFT JOIN posts p ON p.id = r.post_id ORDER BY r.started_at DESC LIMIT 20`
    runs = result as typeof runs
    const authorId = Number(process.env.AUTOMATION_AUTHOR_ID)
    if (Number.isSafeInteger(authorId) && authorId > 0) {
      const authors = await sql`SELECT name FROM users WHERE id = ${authorId} AND role = 'ADMIN'`
      authorName = authors[0]?.name || ''
    }
  } catch { available = false }
  const hasKey = Boolean(process.env.OPENAI_API_KEY?.trim())
  const ready = available && Boolean(hasKey && authorName && (process.env.CRON_SECRET?.length || 0) >= 32)
  const enabled = ready && process.env.VERCEL_ENV === 'production' && process.env.AUTOMATION_ENABLED === 'true'
  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="font-heading text-2xl font-bold">Automação editorial</h1>
        <p className="text-muted-foreground mt-2">Duas publicações por dia, alternando entre as categorias do blog.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[['Status', enabled ? 'Ativa' : ready ? 'Pausada' : 'Configuração pendente'], ['Horários de Brasília', '09h e 18h'], ['Autor', authorName || 'Ainda não definido']].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-border bg-card p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="font-semibold mt-2">{value}</p></div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">Os disparos dependem do agendamento da hospedagem e podem atrasar. Sem fontes suficientes, a publicação é ignorada e registrada abaixo. As matérias manuais continuam independentes.</p>
      {!hasKey && <p role="status" className="text-sm text-muted-foreground">A geração de textos aguarda a configuração da chave da OpenAI. Nenhuma publicação automática está ativa.</p>}
      {!available && <p role="alert" className="text-sm text-destructive">O histórico ainda não está disponível. Conclua a configuração da automação e confira a conexão com o banco.</p>}
      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="font-heading text-lg font-semibold mb-4">Últimas execuções</h2>
        {!runs.length ? <p className="text-sm text-muted-foreground">Nenhuma execução registrada.</p> : <ul className="divide-y divide-border">{runs.map((run) => (
          <li key={run.id} className="py-4 text-sm flex flex-col gap-1">
            <span>{run.publication_day} · {run.slot === 'morning' ? '09h' : '18h'} · {labels[run.status] || run.status}</span>
            {run.post_id && <Link href={`/admin/posts/${run.post_id}/edit`} className="text-primary hover:underline">{run.title || 'Abrir matéria'}</Link>}
          </li>
        ))}</ul>}
      </section>
      <Link href="/admin/posts/new" className="text-primary hover:underline text-sm">Criar matéria manualmente ou gerar com IA</Link>
    </div>
  )
}
