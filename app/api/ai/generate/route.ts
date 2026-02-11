import { generateText, Output } from 'ai'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { title, categoryName } = await request.json()

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const categoryContext = categoryName ? ` in the ${categoryName} category` : ''

    const result = await generateText({
      model: 'openai/gpt-4o-mini',
      output: Output.object({
        schema: z.object({
          content: z.string().describe('Full HTML article content with paragraphs, headings (h2, h3), and formatting. 400-800 words.'),
          excerpt: z.string().describe('A compelling 1-2 sentence excerpt for the article card. Max 160 characters.'),
          meta_description: z.string().describe('SEO-optimized meta description. Max 155 characters.'),
          tags: z.array(z.string()).describe('5-8 relevant tags for the article.'),
        }),
      }),
      prompt: `You are a professional geek news writer for "Fronteira Geek", a news portal covering anime, games, Marvel, DC, Star Wars, RPG, and tech.

Write a complete article for the following topic${categoryContext}:

Title: "${title}"

Requirements:
- Write engaging, informative content in a professional journalism style
- Use HTML formatting: <p> for paragraphs, <h2> and <h3> for subheadings, <strong> for emphasis, <blockquote> for quotes
- Include 4-6 paragraphs minimum
- Make it exciting and relevant for geek culture fans
- The content should be factual and well-structured
- Generate a compelling excerpt (max 160 chars)
- Generate an SEO meta description (max 155 chars)
- Generate 5-8 relevant tags`,
    })

    return NextResponse.json(result.output)
  } catch (error) {
    console.error('AI generation error:', error)
    return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
  }
}
