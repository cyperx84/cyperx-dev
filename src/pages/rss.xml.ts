import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = await getCollection('blog');

  const sorted = posts.sort((a, b) => {
    const dateA = a.data.date.replace(/\./g, '-');
    const dateB = b.data.date.replace(/\./g, '-');
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  return rss({
    title: 'CyperX.dev Blog',
    description: 'Dev blog by CyperX',
    site: context.site!.toString(),
    items: sorted.map((post) => ({
      title: post.data.title,
      description: post.data.excerpt,
      pubDate: new Date(post.data.date.replace(/\./g, '-')),
      link: `/blog/${post.data.slug}/`,
      categories: post.data.tags,
    })),
  });
}
