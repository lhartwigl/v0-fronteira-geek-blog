import { createOpenAI } from '@ai-sdk/openai'
import { generateText, Output } from 'ai'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY nao configurada. Adicione a chave nas variaveis de ambiente do projeto.' },
      { status: 500 },
    )
  }

  try {
    const { title, categoryName } = await request.json()

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // ChatGPT (OpenAI) usando a chave do usuario via variavel de ambiente
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const categoryContext = categoryName ? ` na categoria "${categoryName}"` : ''

    const result = await generateText({
      model: openai('gpt-4o'),
      experimental_output: Output.object({
        schema: z.object({
          content: z.string().describe('Conteudo completo do artigo em HTML com paragrafos, headings (h2, h3) e formatacao. 600-1000 palavras, otimizado para SEO.'),
          excerpt: z.string().describe('Resumo atraente de 1-2 frases para o card do artigo. Maximo 160 caracteres.'),
          meta_description: z.string().describe('Meta description otimizada para SEO, com palavra-chave principal. Maximo 155 caracteres.'),
          tags: z.array(z.string()).describe('5-8 tags/palavras-chave relevantes para SEO.'),
        }),
      }),
      prompt: `PROMPT PARA GERAR TEXTO PARA BLOG GEEK UTILIZANDO SEO

Voce e um redator profissional de conteudo geek e especialista em SEO do portal "Fronteira Geek", que cobre anime, games, Marvel, DC, Star Wars, RPG e tecnologia.

Escreva um artigo completo, original e otimizado para mecanismos de busca sobre o seguinte tema${categoryContext}:

Titulo: "${title}"

Diretrizes de SEO e redacao:
- Escreva em portugues do Brasil, com tom jornalistico, envolvente e informativo.
- Defina uma palavra-chave principal a partir do titulo e use-a de forma natural no primeiro paragrafo, em pelo menos um subtitulo (h2/h3) e ao longo do texto, sem keyword stuffing.
- Use palavras-chave secundarias e termos relacionados (LSI) para enriquecer o conteudo.
- Estruture o texto com escaneabilidade: introducao com gancho, subtitulos descritivos (<h2> e <h3>), paragrafos curtos (2-4 frases) e listas quando fizer sentido.
- Use formatacao HTML: <p> para paragrafos, <h2> e <h3> para subtitulos, <strong> para enfase e <ul>/<li> para listas.
- Minimo de 600 palavras, conteudo factual, bem estruturado e relevante para fas da cultura geek.
- Inclua uma conclusao com chamada para acao (engajamento, comentarios ou leitura relacionada).
- Gere um resumo (excerpt) atraente de ate 160 caracteres.
- Gere uma meta description de ate 155 caracteres contendo a palavra-chave principal.
- Gere de 5 a 8 tags/palavras-chave relevantes para SEO.`,
    })

    return NextResponse.json(result.experimental_output)
  } catch (error) {
    console.error('AI generation error:', error)
    return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
  }
}
