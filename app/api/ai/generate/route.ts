import { NextResponse } from 'next/server'
import { authenticated } from '@/lib/access'
import { consumePublicAttempt } from '@/lib/auth-throttle'
import { EditorialError, generateArticle } from '@/lib/editorial-ai'
import { z } from 'zod'

export const maxDuration = 300

const inputSchema = z.object({ title: z.string().trim().min(1).max(300), categoryName: z.string().max(100).optional() })

export async function POST(request: Request) {
  const session = await authenticated(request, false)
  if (session instanceof Response) return session
  let input: z.infer<typeof inputSchema>
  try { input = inputSchema.parse(await request.json()) }
  catch { return NextResponse.json({ error: 'Informe um título de até 300 caracteres.' }, { status: 400 }) }
  try {
    if (!process.env.OPENAI_API_KEY?.trim()) throw new EditorialError('AI_NOT_CONFIGURED', 503)
    if (!await consumePublicAttempt(request, `ai:${session.userId}`, 10)) return NextResponse.json({ error: 'Limite temporário de geração. Aguarde alguns minutos.' }, { status: 429, headers: { 'Retry-After': '900' } })
    const article = await generateArticle({ title: input.title, categoryName: input.categoryName || 'Cultura geek' })
    return NextResponse.json(article)
  } catch (error) {
    const code = error instanceof EditorialError ? error.code : 'AI_UNAVAILABLE'
    const message = code === 'AI_NOT_CONFIGURED' ? 'A chave da OpenAI ainda não foi configurada.'
      : code === 'AI_LIMIT_REACHED' ? 'Limite da API atingido. Confira os créditos e tente novamente mais tarde.'
      : code.startsWith('NO_') ? 'Não encontrei fontes suficientes para produzir este texto. Tente um tema mais específico.'
      : 'Não foi possível gerar o texto agora. Tente novamente mais tarde.'
    return NextResponse.json({ error: message }, { status: error instanceof EditorialError ? error.status : 502 })
  }
}
