# CYPERX.DEV 💀

> Glitch Art Maximalist dev blog. Corrupted mainframe meets psychedelic skate video.

**Live:** [cyperx.dev](https://cyperx.dev)

Built with Astro + Tailwind v4. Deployed on Cloudflare Pages.

## Stack

- **Framework:** Astro v6
- **CSS:** Tailwind v4 + custom glitch keyframes
- **Fonts:** Rubik Glitch, Space Grotesk, VT323, Space Mono
- **Deploy:** Cloudflare Pages

## Pages

| Route | Name | Description |
|-------|------|-------------|
| `/` | INDEX | Homepage — terminal header, staggered post cards |
| `/blog/` | DATABLOCKS | Blog listing |
| `/blog/[slug]/` | DATABLOCK | Individual post |
| `/projects/` | PROJECTS | Project grid |
| `/manifesto/` | MANIFESTO | Terminal whoami / about |
| `/fragments/` | FRAGMENTS | Chaotic tag cloud + archive |
| `/404` | FATAL_ERROR | ASCII skull 404 |

## Dev

```sh
npm install
npm run dev       # localhost:4321
npm run build     # static output → dist/
```

## Deploy

```sh
npx astro build
npx wrangler pages deploy dist --project-name cyperx-dev
```

---

*REALITY_SYNC: DISCONNECTED*
