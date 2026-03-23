# CyperX.dev Full Rebuild — Build Brief

## Goal
Rebuild cyperx.dev with 3 pages (HOME, BLOG, PROJECTS), each with 3 theme variants (Dark, Light, Extreme). Theme switching via a toggle button visible on all pages. The Stitch-exported HTML files in `stitch-export/new/` are the source of truth — port them faithfully into Astro components.

## Stack
- Astro v6 (already set up)
- Tailwind CSS v4 with @tailwindcss/vite (already configured)
- Static output to `dist/`
- Deploy: Cloudflare Pages (`npx wrangler pages deploy dist --project-name cyperx-dev`)

## Stitch HTML → Theme Mapping

| Page | Dark | Light | Extreme |
|------|------|-------|---------|
| HOME | `home-dark-void.html` | `home-blinding-light.html` | `home-void-fracture-dark-extreme.html` |
| BLOG | `blog-shard-feed.html` | `blog-bleached-shards.html` | `blog-shard-breach-dark-extreme.html` |
| PROJECTS | `projects-neural-labs.html` | `projects-white-void.html` | `projects-neural-collapse-dark-extreme.html` |

All HTML files are in `stitch-export/new/`.

## Architecture

### Pages
- `src/pages/index.astro` — HOME
- `src/pages/blog.astro` — BLOG (or `src/pages/blog/index.astro`)
- `src/pages/projects.astro` — PROJECTS

### Theme Switching
- Store current theme in localStorage: `cyperx-theme` with values `dark`, `light`, `extreme`
- Default: `dark`
- Toggle button visible on every page (cycle: dark → light → extreme → dark)
- Apply theme via CSS class on `<html>`: `.theme-dark`, `.theme-light`, `.theme-extreme`
- Each page renders ALL THREE theme variants but only shows the active one via CSS display

### Shared Layout
Create a `BaseLayout.astro` that includes:
- Theme toggle button (positioned fixed, top-right)
- Theme switching script (localStorage + class toggle)
- Common nav sidebar (present on all Stitch designs — port the nav structure)
- Global CSS import

### CSS Strategy
- Extract ALL unique CSS from the 9 Stitch HTML files into `src/styles/global.css`
- The Stitch HTML uses CDN Tailwind with inline `<style>` blocks — extract those styles
- Translate Tailwind config (keyframes, animations, colors, fonts) into Tailwind v4 CSS theme variables
- Scope theme-specific styles with `.theme-dark`, `.theme-light`, `.theme-extreme`

### Design System (from Stitch project)
- **Primary**: `#e26cff` (Electric Purple)
- **Secondary**: `#00dbe9` (Cyber Cyan)
- **Tertiary**: `#bcff5f` (Acid Lime)
- **Background Dark**: `#0e0e13`
- **Surface**: `#0e0e13` → `#131319` → `#191920` → `#1f1f27` → `#25252f`
- **Fonts**: Space Grotesk (headlines), Inter (body)
- **Corners**: 0px everywhere (sharp/brutal)
- **No borders** — use tonal shifts for separation

## Key Rules

1. **Port the Stitch HTML faithfully** — don't reinterpret, don't simplify. The exported HTML IS the design.
2. **Mobile responsive** — add `sm:` and `lg:` breakpoints where the Stitch HTML is desktop-only
3. **Nav links**: HOME (`/`), BLOG (`/blog`), PROJECTS (`/projects`)
4. **Keep all image URLs** from the Stitch exports (they're Google hosted, publicly accessible)
5. **The theme toggle** should be obvious and fun — fits the chaotic aesthetic
6. **Build must pass** with 0 errors: `npx astro build`
7. After build, deploy: `npx wrangler pages deploy dist --project-name cyperx-dev`

## Build Order
1. Read ALL 9 Stitch HTML files to understand the full design
2. Create the shared CSS (extract + merge from all 9 files)
3. Build BaseLayout.astro with nav + theme toggle + theme script
4. Build index.astro (HOME — all 3 themes)
5. Build blog.astro (BLOG — all 3 themes)
6. Build projects.astro (PROJECTS — all 3 themes)
7. Test build: `npx astro build`
8. Deploy: `npx wrangler pages deploy dist --project-name cyperx-dev`

## What NOT to Do
- Don't use the old global.css — start fresh or heavily refactor
- Don't use CDN Tailwind — we have Tailwind v4 via vite plugin
- Don't skip any visual elements from the Stitch HTML
- Don't make the pages use different layouts — unified BaseLayout
