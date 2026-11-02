import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { redirect } from 'next/navigation'

export default async function TrafficPage() {
  const user = await getSession()
  if (!user) redirect('/admin/login')
  if (user.role !== 'ADMIN') redirect('/admin/posts')
  let rows: { source: string; views: number }[] = []
  let available = true
  try {
    const sql = getDb()
    rows = await sql`SELECT source, SUM(views)::int AS views FROM traffic_daily
      WHERE day >= (NOW() AT TIME ZONE 'America/Sao_Paulo')::date - 29
      GROUP BY source ORDER BY views DESC, source` as typeof rows
  } catch { available = false }
  const total = rows.reduce((sum, row) => sum + row.views, 0)
  return <div className="max-w-4xl space-y-6">
    <div><h1 className="font-heading text-2xl font-bold">Origem do tráfego</h1><p className="text-muted-foreground mt-2">Visualizações das páginas públicas nos últimos 30 dias, no horário de Brasília.</p></div>
    <div className="rounded-lg border border-border bg-card p-5"><p className="text-sm text-muted-foreground">Visualizações registradas</p><p className="text-3xl font-bold mt-2">{total.toLocaleString('pt-BR')}</p></div>
    <section className="rounded-lg border border-border bg-card p-5 space-y-5">
      <h2 className="font-semibold">De onde vêm os leitores</h2>
      {!available ? <p role="status">A coleta aguarda a configuração do histórico de tráfego.</p> : !rows.length ? <p className="text-muted-foreground">Nenhuma visita registrada neste período. Os dados começam a aparecer após a publicação desta atualização.</p> : rows.map(row => <div key={row.source} className="space-y-2"><div className="flex justify-between gap-4 text-sm"><span className="break-all">{row.source}</span><span className="shrink-0">{row.views.toLocaleString('pt-BR')} · {Math.round(row.views / total * 100)}%</span></div><div className="h-2 rounded bg-secondary"><div className="h-2 rounded bg-primary" style={{ width: `${row.views / total * 100}%` }} /></div></div>)}
    </section>
    <p className="text-sm text-muted-foreground">Acessos de membros da equipe conectados ao painel e acessos à prévia não entram neste relatório. Visualizações não representam pessoas únicas. Algumas redes sociais e aplicativos não informam a origem; nesses casos aparece “Direto / não identificado”. O histórico anterior à atualização não pode ser recuperado.</p>
  </div>
}
