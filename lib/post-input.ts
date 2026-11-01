import { z } from 'zod'

const imageUrl = z.string().max(2048).refine(value => !value || (/^https:\/\//.test(value) && URL.canParse(value)) || (value.startsWith('/') && !value.startsWith('//')))
export const postInput = z.object({
  title: z.string().trim().min(1).max(500), content: z.string().max(500000).default(''),
  excerpt: z.string().max(2000).default(''), thumbnail_url: imageUrl.optional().default(''), hero_image_url: imageUrl.optional().default(''),
  category_id: z.number().int().positive().nullable().optional(), featured: z.boolean().default(false),
  status: z.enum(['draft', 'published']).default('draft'), meta_description: z.string().max(1000).default(''), tags: z.array(z.string().max(100)).max(50).default([]),
})
