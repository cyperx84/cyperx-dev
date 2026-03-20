import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    description: z.string(),
    date: z.string(),
    tags: z.array(z.string()),
    fragId: z.string().optional(),
    featured: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    url: z.string().optional(),
    github: z.string().optional(),
    tags: z.array(z.string()),
    status: z.enum(['ACTIVE', 'ARCHIVED', 'EXPERIMENTAL']).default('ACTIVE'),
  }),
});

export const collections = { blog, projects };
