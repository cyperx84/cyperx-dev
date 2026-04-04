# cyperx.dev — Content Conventions

> How to add new blog posts and projects so the jagged borders, animations, and themes all just work.

---

## Blog Posts

### Frontmatter

```yaml
---
title: "Your Post Title"
date: "2026-04-03"          # YYYY-MM-DD
description: "One-liner shown in cards and og:description"
tags: ["AI", "ENGINEERING"]  # uppercase, shown as pills
category: "DEEP DIVE"       # uppercase label (e.g. DEEP DIVE, TUTORIAL, ANALYSIS)
readingTime: 10              # minutes, shown in header
heroImage: "/images/blog/your-post-hero.webp"  # optional, OG image
---
```

### Images in Post Body

Just write standard markdown. The images get jagged clip-path automatically via CSS + JS:

```markdown
![Alt text describing the image](/images/blog/your-image.webp)
```

**Rules:**
- Store images in `public/images/blog/`
- Use `.webp` format (best perf)
- Recommended size: 1200×630px or wider, any height (CSS caps at 360px height)
- Don't add classes, wrappers, or inline styles — the CSS handles it
- Aim for 1–3 images per post (start, middle, end)

**Image style (LOCKED — generate all blog images with this):**
> Gangster graffiti spray paint digital art. Neon ASCII skull art, multicoloured psychedelic spray paint, dripping graffiti tags, wildstyle typography, concrete/brick wall textures, street art gangsta aesthetic. Colors: neon green, hot pink, electric blue, purple. Trippy psychedelic swirls. No real brand logos or trademarked characters. Bold raw urban style. Aspect ratio: 16:9.

Generate with model: `google/gemini-3.1-flash-image-preview`, aspectRatio: `16:9`.

### What You Get Automatically

- ✅ Jagged clip-path borders on all inline images (CSS, no JS required)
- ✅ Animated SVG neon border injected by JS around each image
- ✅ Scroll-reveal animations on paragraphs + glitch effect on h2s
- ✅ Reading progress bar
- ✅ Theme variants (dark/light/extreme) applied based on site theme
- ✅ Mobile-safe layout

---

## Projects

### Frontmatter

```yaml
---
title: "Project Name"
description: "What it does in one sentence"
status: "LIVE"              # LIVE | WIP | PAUSED | ARCHIVED
tags: ["AI", "TOOL"]
url: "https://yourproject.com"    # external link (optional)
github: "cyperx84/repo"          # GitHub repo (optional)
heroImage: "/images/projects/your-project.webp"
date: "2026-04-03"
---
```

### Hero Image

- Store in `public/images/projects/`
- Use `.webp`, recommended 1200×800px+
- Uses the same jagged `.jag-img-wrap` structure → gets clip-path + animated border automatically
- Same generated image style as blog posts (the locked style above)

### What You Get Automatically

- ✅ Jagged hero image with animated SVG border
- ✅ Hover effects on project cards (globally applied)
- ✅ Theme-aware rendering

---

## Themes

The site has three themes: **dark** (default), **light**, and **extreme**.

You don't need to do anything — all content renders correctly across all three. The CSS handles it via `.prose-dark`, `.prose-light`, `.prose-extreme` on the article wrapper.

---

## File Checklist for a New Blog Post

```
public/images/blog/
  your-post-1.webp    ← start of post
  your-post-2.webp    ← middle
  your-post-3.webp    ← ~75% through (optional)

src/content/blog/
  your-post-slug.md   ← the post itself
```

---

## File Checklist for a New Project

```
public/images/projects/
  your-project.webp   ← hero image

src/content/projects/
  your-project.md     ← the project itself
```

---

## Don't Do

- ❌ Don't wrap images in custom HTML/divs in markdown
- ❌ Don't add inline styles to images
- ❌ Don't use `.jpg` or `.png` if you can avoid it (use `.webp`)
- ❌ Don't change the clip-path polygon — it's locked across all pages
- ❌ Don't skip alt text (accessibility + SEO)
