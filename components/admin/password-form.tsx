'use client'

import { useState } from 'react'
import useSWR from 'swr'

export function PasswordForm() {
  const { data } = useSWR('/api/auth/session', (url: string) => fetch(url).then(response => response.json()))
  const [currentPassword, setCurrent] = useState('')
  const [newPassword, setNew] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setMessage('')
    if (newPassword !== confirmation) { setMessage('As novas senhas não coincidem.'); return }
    setSaving(true)
    try {
      const response = await fetch('/api/auth/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword, newPassword }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Não foi possível alterar a senha.')
      setCurrent(''); setNew(''); setConfirmation('')
      setMessage('Senha alterada. As outras sessões da conta foram encerradas.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível alterar a senha.') }
    finally { setSaving(false) }
  }
  return (
    <section className="mt-10 border-t border-border pt-8">
      <h2 className="font-heading text-xl font-bold mb-2">Alterar senha</h2>
      <p className="text-sm text-muted-foreground mb-5">Use uma senha exclusiva de pelo menos 12 caracteres.</p>
      {!data?.accountChangesAllowed ? <p className="text-sm text-muted-foreground">A troca de senha ficará disponível após publicarmos esta versão. A prévia está em modo de revisão.</p> : <form onSubmit={submit} className="flex flex-col gap-4">
        {[['Senha atual', currentPassword, setCurrent, 'current-password'], ['Nova senha', newPassword, setNew, 'new-password'], ['Confirmar nova senha', confirmation, setConfirmation, 'new-password']].map(([label, value, setter, autoComplete], index) => (
          <div key={index} className="flex flex-col gap-1.5">
            <label htmlFor={`password-${index}`} className="text-sm font-medium">{label as string}</label>
            <input id={`password-${index}`} type="password" autoComplete={autoComplete as string} value={value as string} onChange={event => (setter as (value: string) => void)(event.target.value)} required minLength={index ? 12 : 1} maxLength={128} className="min-w-0 rounded-md border border-border bg-secondary px-3 py-2" />
          </div>
        ))}
        <button disabled={saving} type="submit" className="self-start rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">{saving ? 'Alterando...' : 'Alterar minha senha'}</button>
        {message && <p role="status" className="text-sm">{message}</p>}
      </form>}
    </section>
  )
}
