import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    date: z.string(),
    excerpt: z.string(),
    tags: z.array(z.string()),
    readTime: z.string(),
    category: z.string(),
    signal: z.number(),
    heroImage: z.string().optional(),
  }),
});

export const collections = { blog };
