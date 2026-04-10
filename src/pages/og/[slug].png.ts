import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getCollection('blog');
  return posts.map((post) => ({
    params: { slug: post.data.slug },
    props: { post },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const { post } = props as { post: any };
  const { title, excerpt, date, tags } = post.data;

  const fontPath = path.resolve('public/fonts/SpaceGrotesk-Bold.ttf');
  const fontData = fs.readFileSync(fontPath);

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: '#0a0a0a',
          padding: '60px',
          fontFamily: 'Space Grotesk',
          position: 'relative',
          overflow: 'hidden',
        },
        children: [
          // Accent line top
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                height: '4px',
                background: 'linear-gradient(90deg, #39FF14, #39FF1400)',
              },
            },
          },
          // Accent line left
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                top: '0',
                left: '0',
                bottom: '0',
                width: '4px',
                background: 'linear-gradient(180deg, #39FF14, #39FF1400)',
              },
            },
          },
          // Date
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                color: '#39FF14',
                fontSize: '20px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                marginBottom: '24px',
                opacity: 0.9,
              },
              children: formattedDate,
            },
          },
          // Title
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                fontSize: title.length > 50 ? '48px' : '56px',
                fontWeight: 700,
                color: '#ffffff',
                lineHeight: 1.2,
                marginBottom: '24px',
                maxWidth: '900px',
              },
              children: title,
            },
          },
          // Description
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                fontSize: '22px',
                color: '#a0a0a0',
                lineHeight: 1.5,
                marginBottom: 'auto',
                maxWidth: '800px',
              },
              children: excerpt.length > 140 ? excerpt.slice(0, 140) + '...' : excerpt,
            },
          },
          // Bottom row: tags + branding
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                width: '100%',
              },
              children: [
                // Tags
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      gap: '10px',
                      flexWrap: 'wrap',
                    },
                    children: (tags as string[]).slice(0, 4).map((tag: string) => ({
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          padding: '6px 14px',
                          borderRadius: '4px',
                          border: '1px solid #39FF1466',
                          backgroundColor: '#39FF140D',
                          color: '#39FF14',
                          fontSize: '16px',
                          letterSpacing: '1px',
                        },
                        children: tag,
                      },
                    })),
                  },
                },
                // Branding
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      color: '#39FF14',
                      fontSize: '24px',
                      fontWeight: 700,
                      letterSpacing: '3px',
                      opacity: 0.8,
                    },
                    children: 'CYPERX.DEV',
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Space Grotesk',
          data: fontData,
          weight: 700,
          style: 'normal' as const,
        },
      ],
    },
  );

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  return new Response(pngBuffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
