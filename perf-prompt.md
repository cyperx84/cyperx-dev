You are the lead engineer on a performance pass for cyperx.dev (Astro v6 + Tailwind v4 + Three.js + GSAP + Lenis). Repo: /Users/cyperx/github/cyperx-dev/

Current Lighthouse scores: Performance 39, TBT 2660ms, LCP 4.9s, FCP 3.1s, CLS 0.117.

YOUR JOB: Coordinate a parallel agent team using the Task tool to fix all perf issues simultaneously. Spin up one agent per concern, let them run in parallel, then verify and build.

TASKS FOR YOUR AGENT TEAM:

Task 1 — three-bg.ts bundle:
- File: src/scripts/three-bg.ts
- Remove imports of EffectComposer, UnrealBloomPass, RGBShiftShader from three-stdlib (this kills the huge bundle)
- Remove the post-processing pipeline (composer, bloomPass, chromaticPass)
- Replace with CSS filter: blur + brightness on the canvas element to approximate bloom visually
- Reduce particle count by 40% (dark scene: 200→120 desktop, 80→48 mobile)
- Reduce max connection lines by 40%
- Keep initThreeBg() export intact, keep theme switching working

Task 2 — Script loading:
- File: src/layouts/BaseLayout.astro
- cursor.ts and bullet-holes.ts are decorative — wrap their initialisation in requestIdleCallback (timeout: 2000ms) with setTimeout fallback
- Add /* @vite-ignore */ to the dynamic import('../scripts/three-bg') call
- three-bg idle callback fallback should be 3000ms (bump from current if lower)

Task 3 — CLS fix:
- File: src/pages/blog/[slug].astro
- Find the prose image CSS rules (.prose-dark img, .prose-light img, .prose-extreme img)
- Add aspect-ratio: 16 / 9 to each — this reserves space before images load, fixes CLS

Task 4 — Image compression:
- Files: public/images/blog/ai-agent-root-access.jpg, ai-agent-root-access-mid.jpg, ai-agent-root-access-end.jpg (~900KB each)
- Compress each to under 200KB using ffmpeg (ffmpeg -i input.jpg -q:v 4 output.jpg) or jpegoptim if available
- Overwrite in place

After all agents complete:
1. Run: npm run build
2. If build passes, run: openclaw system event --text "Perf pass complete — build passed, ready to deploy" --mode now
3. If build fails, fix the error and retry

Do not ask for confirmation. Start all 4 agents in parallel now.
