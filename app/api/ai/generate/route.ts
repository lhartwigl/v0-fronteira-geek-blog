import { generateText, Output } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'A chave OPENAI_API_KEY nao esta configurada no projeto.' },
      { status: 500 },
    )
  }

  try {
    const { title, categoryName } = await request.json()

    if (!title) {
      return NextResponse.json({ error: 'O titulo e obrigatorio' }, { status: 400 })
    }

    const categoriaContexto = categoryName ? ` na categoria ${categoryName}` : ''

    const result = await generateText({
      model: openai('gpt-4o'),
      output: Output.object({
        schema: z.object({
          content: z
            .string()
            .describe(
              'Conteudo completo do artigo em HTML, com paragrafos <p>, subtitulos <h2> e <h3>, listas e <strong> para enfase. Entre 600 e 1000 palavras, otimizado para SEO.',
            ),
          excerpt: z
            .string()
            .describe('Um resumo atrativo de 1-2 frases para o card do artigo. Maximo 160 caracteres.'),
          meta_description: z
            .string()
            .describe('Meta descricao otimizada para SEO com palavra-chave principal. Maximo 155 caracteres.'),
          tags: z
            .array(z.string())
            .describe('5 a 8 tags/palavras-chave relevantes para SEO.'),
        }),
      }),
      prompt: `Voce e um redator profissional de SEO e jornalista especializado em cultura geek, escrevendo para o "Fronteira Geek", um portal de noticias sobre anime, games, Marvel, DC, Star Wars, RPG e tecnologia.

Escreva um artigo completo, em portugues brasileiro, otimizado para SEO, sobre o seguinte tema${categoriaContexto}:

Titulo: "${title}"

Diretrizes de SEO e conteudo:
- Identifique a palavra-chave principal a partir do titulo e use-a naturalmente no primeiro paragrafo, em pelo menos um subtitulo <h2> e ao longo do texto (sem keyword stuffing).
- Use uma estrutura escaneavel: paragrafos curtos, subtitulos <h2> e <h3>, listas <ul>/<ol> quando fizer sentido e <strong> para destacar pontos importantes.
- Comece com uma introducao envolvente que prenda o leitor e contextualize o tema.
- Inclua no minimo 6 paragrafos com informacoes relevantes, precisas e atuais para fas de cultura geek.
- Escreva em tom jornalistico, empolgante e profissional.
- Finalize com uma conclusao que incentive o engajamento do leitor.
- Gere um resumo (excerpt) atrativo de no maximo 160 caracteres.
- Gere uma meta descricao otimizada para SEO contendo a palavra-chave principal, com no maximo 155 caracteres.
- Gere de 5 a 8 tags relevantes para SEO.`,
    })

    return NextResponse.json(result.output)
  } catch (error) {
    console.error('AI generation error:', error)
    return NextResponse.json({ error: 'Falha na geracao com IA' }, { status: 500 })
  }
}
