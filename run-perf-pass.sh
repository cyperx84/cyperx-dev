#!/bin/bash
cd /Users/cyperx/github/cyperx-dev

PROMPT='You are the lead engineer on a performance pass for cyperx.dev (Astro v6 + Tailwind v4 + Three.js). Repo: /Users/cyperx/github/cyperx-dev/

Current Lighthouse: Performance 39, TBT 2660ms, LCP 4.9s, FCP 3.1s, CLS 0.117.

YOUR JOB: Use the Task tool to spin up 4 parallel subagents simultaneously. Do not do the work yourself — delegate everything to agents and wait for results.

AGENT 1 — three-bg.ts bundle (BIGGEST WIN):
- Read src/scripts/three-bg.ts
- Remove EffectComposer, UnrealBloomPass, RGBShiftShader imports from three-stdlib entirely
- Remove the entire post-processing pipeline (composer, bloomPass, chromaticPass, setupComposer)
- Replace bloom with: canvas.style.filter set per theme via a CSS_BLOOM map (blur + brightness)
- Reduce particle count 40%: dark scene 200->120 desktop, 80->48 mobile
- Reduce max connection lines 40%: 120->72 desktop, 40->24 mobile
- Keep initThreeBg() export and theme switching intact

AGENT 2 — Script defer in BaseLayout:
- Read src/layouts/BaseLayout.astro
- Wrap cursor.ts and bullet-holes.ts initialisation in requestIdleCallback({ timeout: 2000 }) with setTimeout(fn, 500) fallback
- Add /* @vite-ignore */ comment to the dynamic import of three-bg
- Ensure three-bg idle callback fallback is 3000ms

AGENT 3 — CLS fix:
- Read src/pages/blog/[slug].astro
- Find .prose-dark img, .prose-light img, .prose-extreme img CSS rules
- Add aspect-ratio: 16 / 9 to each rule

AGENT 4 — Image compression:
- Compress public/images/blog/ai-agent-root-access.jpg, ai-agent-root-access-mid.jpg, ai-agent-root-access-end.jpg (each ~900KB)
- Use ffmpeg: ffmpeg -y -i input.jpg -q:v 5 /tmp/out.jpg && mv /tmp/out.jpg input.jpg
- Target under 200KB each, overwrite originals in place

After ALL 4 agents finish:
1. Run: npm run build
2. If build passes run: openclaw system event --text "Perf pass done build green ready to deploy" --mode now
3. If build fails fix the error and rebuild

Start all 4 agents NOW in parallel using Task tool.'

claude --permission-mode bypassPermissions --print "$PROMPT"
