'use client'

import { useState } from 'react'
import useSWR from 'swr'

type TeamUser = { id: number; name: string; email: string; role: 'ADMIN' | 'AUTHOR' | 'DISABLED' }
const labels = { ADMIN: 'Administrador', AUTHOR: 'Autor', DISABLED: 'Desativado' }
const fetcher = async (url: string) => {
  const response = await fetch(url)
  const body = await response.json()
  if (!response.ok) throw new Error(body.error || 'Não foi possível carregar a equipe.')
  return body
}
const fieldClass = 'min-w-0 w-full rounded-md border border-border bg-secondary px-3 py-2'

export default function TeamPage() {
  const { data, error, mutate } = useSWR('/api/admin/users', fetcher)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'AUTHOR' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  async function create(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setMessage('')
    try {
      const response = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error)
      setForm({ name: '', email: '', password: '', role: 'AUTHOR' })
      setMessage('Conta criada. Compartilhe o acesso com a pessoa por um canal privado. Ela poderá alterar a senha no perfil.')
      await mutate()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível criar a conta.') }
    finally { setSaving(false) }
  }
  if (error) return <p role="alert">{error.message}</p>
  if (!data) return <p className="text-muted-foreground">Carregando equipe...</p>
  return (
    <div className="max-w-4xl flex flex-col gap-8">
      <div><h1 className="font-heading text-2xl font-bold">Equipe</h1><p className="text-sm text-muted-foreground mt-2">Administradores gerenciam o site. Autores preparam seus rascunhos para aprovação.</p></div>
      {!data.canManageAccounts && <p className="rounded-md border border-border bg-secondary p-4 text-sm">Modo de revisão: confira as contas e permissões. A criação de contas e a alteração de acessos serão liberadas quando esta versão for publicada.</p>}
      <section className="rounded-lg border border-border bg-card p-4 sm:p-6">
        <h2 className="font-heading text-lg font-semibold mb-4">Criar conta</h2>
        <form onSubmit={create} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5 text-sm">Nome<input required maxLength={255} autoComplete="off" className={fieldClass} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label>
          <label className="flex flex-col gap-1.5 text-sm">Email<input required type="email" maxLength={255} autoComplete="off" className={fieldClass} value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} /></label>
          <label className="flex flex-col gap-1.5 text-sm">Senha inicial<input required type="password" minLength={12} maxLength={128} autoComplete="new-password" className={fieldClass} value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} /><span className="text-xs text-muted-foreground">Pelo menos 12 caracteres.</span></label>
          <label className="flex flex-col gap-1.5 text-sm">Perfil<select className={fieldClass} value={form.role} onChange={event => setForm({ ...form, role: event.target.value })}><option value="AUTHOR">Autor</option><option value="ADMIN">Administrador</option></select></label>
          <button type="submit" disabled={saving || !data.canManageAccounts} className="justify-self-start rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">{saving ? 'Criando...' : 'Criar conta'}</button>
        </form>
        {message && <p role="status" className="mt-4 text-sm">{message}</p>}
      </section>
      <section className="flex flex-col gap-4"><h2 className="font-heading text-lg font-semibold">Contas da equipe</h2>
        {(data.users as TeamUser[]).map(user => <Account key={user.id} user={user} self={user.id === data.currentUserId} editable={data.canManageAccounts} refresh={() => mutate()} />)}
      </section>
    </div>
  )
}

function Account({ user, self, editable, refresh }: { user: TeamUser; self: boolean; editable: boolean; refresh: () => Promise<unknown> }) {
  const [role, setRole] = useState(user.role)
  const [password, setPassword] = useState('')
  const [resetting, setResetting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  async function update(reset: boolean) {
    setSaving(true); setMessage('')
    try {
      const response = await fetch('/api/admin/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: user.id, ...(reset ? { password } : { role }) }) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error)
      setMessage(reset ? 'Senha redefinida; as sessões anteriores foram encerradas.' : 'Acesso atualizado; a pessoa precisará entrar novamente.')
      setPassword(''); setResetting(false); await refresh()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível atualizar a conta.') }
    finally { setSaving(false) }
  }
  return (
    <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3">
      <div className="min-w-0"><p className="font-semibold break-words">{user.name || user.email}{self ? ' (você)' : ''}</p><p className="text-sm text-muted-foreground break-all">{user.email}</p></div>
      {self || !editable ? <p className="text-sm text-muted-foreground">{labels[user.role]}{self ? ' · Altere sua senha em Meu perfil.' : ''}</p> : <>
        <div className="flex flex-col sm:flex-row gap-3">
          <select aria-label={`Perfil de ${user.name || user.email}`} value={role} onChange={event => setRole(event.target.value as TeamUser['role'])} className={`${fieldClass} sm:max-w-xs`}><option value="AUTHOR">Autor</option><option value="ADMIN">Administrador</option><option value="DISABLED">Desativado</option></select>
          <button type="button" disabled={saving || role === user.role} onClick={() => update(false)} className="rounded-md bg-secondary px-4 py-2 text-sm disabled:opacity-50">Salvar acesso</button>
          <button type="button" onClick={() => setResetting(!resetting)} className="rounded-md border border-border px-4 py-2 text-sm">Redefinir senha</button>
        </div>
        {resetting && <form className="flex flex-col sm:flex-row gap-3" onSubmit={event => { event.preventDefault(); update(true) }}><input type="password" aria-label={`Nova senha de ${user.name || user.email}`} required minLength={12} maxLength={128} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Nova senha: mínimo de 12 caracteres" className={fieldClass} /><button type="submit" disabled={saving} className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">Definir nova senha</button></form>}
      </>}
      {message && <p role="status" className="text-sm">{message}</p>}
    </div>
  )
}
