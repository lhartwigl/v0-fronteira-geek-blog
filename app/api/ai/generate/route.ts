import { createOpenAI } from '@ai-sdk/openai'
import { generateText, Output } from 'ai'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

// ChatGPT (OpenAI) configurado com a chave do usuario via variavel de ambiente.
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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

    const categoryContext = categoryName ? ` na categoria de ${categoryName}` : ''

    const result = await generateText({
      model: openai('gpt-4o'),
      output: Output.object({
        schema: z.object({
          content: z
            .string()
            .describe(
              'Conteudo completo do artigo em HTML, com paragrafos (<p>), subtitulos (<h2>, <h3>), listas e formatacao. Otimizado para SEO. 600-1000 palavras.',
            ),
          excerpt: z
            .string()
            .describe('Resumo atraente de 1-2 frases para o card do artigo. Maximo 160 caracteres.'),
          meta_description: z
            .string()
            .describe('Meta description otimizada para SEO, com palavra-chave principal. Maximo 155 caracteres.'),
          tags: z.array(z.string()).describe('5-8 tags/palavras-chave relevantes para SEO.'),
        }),
      }),
      prompt: `Voce e um redator profissional de SEO e cultura geek do portal "Fronteira Geek", que cobre animes, games, Marvel, DC, Star Wars, RPG e tecnologia.

Escreva um artigo completo e otimizado para SEO sobre o seguinte tema${categoryContext}:

Titulo: "${title}"

PROMPT PARA GERAR TEXTO PARA BLOG GEEK UTILIZANDO SEO:
- Identifique a palavra-chave principal a partir do titulo e use-a de forma natural ao longo do texto (incluindo no primeiro paragrafo e em pelo menos um subtitulo).
- Use palavras-chave secundarias e termos relacionados (LSI) para enriquecer o contexto semantico.
- Estruture o conteudo com escaneabilidade: paragrafos curtos, subtitulos hierarquicos (<h2>, <h3>), listas (<ul>/<ol>) quando fizer sentido e <strong> para destacar termos importantes.
- Escreva uma introducao que prenda o leitor nas primeiras linhas e responda a intencao de busca.
- Mantenha tom envolvente, informativo e profissional, voltado para fas de cultura geek.
- Inclua de 4 a 8 paragrafos e mantenha o conteudo factual e bem fundamentado.
- Finalize com uma conclusao que incentive engajamento (comentarios, leitura de artigos relacionados).
- NAO inclua o titulo principal dentro do campo content (o titulo ja existe na pagina).

Gere tambem:
- Um resumo (excerpt) atraente de no maximo 160 caracteres.
- Uma meta description otimizada para SEO de no maximo 155 caracteres, contendo a palavra-chave principal.
- De 5 a 8 tags relevantes para SEO.

Responda em portugues do Brasil.`,
    })

    return NextResponse.json(result.output)
  } catch (error) {
    console.error('AI generation error:', error)
    return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
  }
}
