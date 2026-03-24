/**
 * bullet-holes.ts — Shoot the website
 *
 * Performance-first approach:
 * - Holes are pre-rendered to offscreen canvases (drawn once, composited each frame)
 * - Crack geometry is baked at creation time (no per-frame randomness)
 * - Animation loop auto-stops when idle (no particles, no fading holes)
 * - Swap-and-pop removal instead of splice
 * - Reduced particle count, shorter lifetimes, capped holes
 */

type Theme = 'dark' | 'light' | 'extreme';

interface BakedCrack {
  points: { x: number; y: number }[];
  branches: { startIdx: number; points: { x: number; y: number }[] }[];
}

interface BulletHole {
  x: number;        // screen-space (not DPR-scaled)
  y: number;
  bitmap: HTMLCanvasElement;  // pre-rendered hole
  bitmapSize: number;
  opacity: number;
  createdAt: number;
  fading: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  decay: number;    // life lost per frame
  gravity: number;
  rotation: number;
  rotSpeed: number;
  shape: 0 | 1 | 2; // circle, shard, spark
}

// ── State ──
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
const holes: BulletHole[] = [];
const particles: Particle[] = [];
let animId = 0;
let running = false;
let initialized = false;

// ── Config ──
const MAX_HOLES = 30;
const HOLE_PERSIST_S = 8;      // seconds before fade starts
const HOLE_FADE_S = 2;         // seconds to fade out
const HOLE_FADE_RATE = 1 / (HOLE_FADE_S * 60); // per frame at 60fps
const PARTICLE_COUNT = { normal: 14, extreme: 22 };
const SHAKE_PX = 6;
const SHAKE_MS = 120;

// ── Theme helpers ──
function getTheme(): Theme {
  const cls = document.documentElement.classList;
  if (cls.contains('theme-extreme')) return 'extreme';
  if (cls.contains('theme-light')) return 'light';
  return 'dark';
}

const PALETTES: Record<Theme, string[]> = {
  dark: ['#39FF14', '#2bcc10', '#1a8a0a', '#FF51FA', '#fff'],
  light: ['#FF51FA', '#AC89FF', '#39FF14', '#131313', '#888'],
  extreme: ['#8eff71', '#ff51fa', '#ac89ff', '#00f0ff', '#ff0', '#f30'],
};

const HOLE_STYLE: Record<Theme, { fill: string; stroke: string; crack: string; glow: number }> = {
  dark: { fill: '#0a0a0a', stroke: '#39FF14', crack: 'rgba(57,255,20,0.5)', glow: 8 },
  light: { fill: '#333', stroke: '#FF51FA', crack: 'rgba(255,81,250,0.4)', glow: 6 },
  extreme: { fill: '#000', stroke: '#8eff71', crack: 'rgba(255,81,250,0.55)', glow: 12 },
};

// ── Screen shake (CSS transform, no reflow) ──
let shaking = false;
function screenShake(intensity: number) {
  if (shaking) return;
  shaking = true;
  const el = document.documentElement;
  const start = performance.now();
  const tick = (t: number) => {
    const elapsed = t - start;
    if (elapsed > SHAKE_MS) {
      el.style.transform = '';
      shaking = false;
      return;
    }
    const decay = 1 - elapsed / SHAKE_MS;
    const x = (Math.random() - 0.5) * SHAKE_PX * intensity * decay;
    const y = (Math.random() - 0.5) * SHAKE_PX * intensity * decay;
    el.style.transform = `translate(${x}px,${y}px)`;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// ── Bake crack geometry (deterministic after creation) ──
function bakeCracks(theme: Theme): BakedCrack[] {
  const count = theme === 'extreme' ? 7 + (Math.random() * 5 | 0) : 4 + (Math.random() * 3 | 0);
  const cracks: BakedCrack[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.6;
    const length = 12 + Math.random() * (theme === 'extreme' ? 45 : 28);
    const steps = 3 + (Math.random() * 2 | 0);
    const points: { x: number; y: number }[] = [{ x: 0, y: 0 }];
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const jitter = (1 - t) * 2.5;
      points.push({
        x: Math.cos(angle) * length * t + (Math.random() - 0.5) * jitter,
        y: Math.sin(angle) * length * t + (Math.random() - 0.5) * jitter,
      });
    }
    const branches: BakedCrack['branches'] = [];
    const branchCount = Math.random() * 2 | 0;
    for (let b = 0; b < branchCount; b++) {
      const startIdx = 1 + (Math.random() * (points.length - 2) | 0);
      const bAngle = angle + (Math.random() - 0.5) * 1.2;
      const bLen = 6 + Math.random() * 12;
      branches.push({
        startIdx,
        points: [
          { x: 0, y: 0 },
          { x: Math.cos(bAngle) * bLen, y: Math.sin(bAngle) * bLen },
        ],
      });
    }
    cracks.push({ points, branches });
  }
  return cracks;
}

// ── Pre-render a hole to an offscreen canvas ──
function renderHoleBitmap(theme: Theme): { bitmap: HTMLCanvasElement; size: number } {
  const style = HOLE_STYLE[theme];
  const cracks = bakeCracks(theme);
  const radius = 3 + Math.random() * 2;

  // Determine bounds
  let maxR = radius + 4;
  for (const c of cracks) {
    for (const p of c.points) {
      const d = Math.sqrt(p.x * p.x + p.y * p.y);
      if (d + 4 > maxR) maxR = d + 4;
    }
    for (const b of c.branches) {
      const sp = c.points[b.startIdx];
      for (const bp of b.points) {
        const d = Math.sqrt((sp.x + bp.x) ** 2 + (sp.y + bp.y) ** 2);
        if (d + 4 > maxR) maxR = d + 4;
      }
    }
  }

  const dpr = window.devicePixelRatio || 1;
  const padding = style.glow + 2;
  const size = Math.ceil((maxR + padding) * 2 * dpr);
  const off = document.createElement('canvas');
  off.width = size;
  off.height = size;
  const c = off.getContext('2d')!;
  const cx = size / 2;
  const cy = size / 2;
  c.scale(dpr, dpr);
  const cxs = (maxR + padding);
  const cys = (maxR + padding);

  // Glow (drawn once, not per frame)
  c.shadowColor = style.stroke;
  c.shadowBlur = style.glow;

  // Cracks
  c.strokeStyle = style.crack;
  c.lineWidth = theme === 'extreme' ? 1.8 : 1.2;
  c.lineCap = 'round';
  for (const crack of cracks) {
    c.beginPath();
    for (let i = 0; i < crack.points.length; i++) {
      const p = crack.points[i];
      if (i === 0) c.moveTo(cxs + p.x, cys + p.y);
      else c.lineTo(cxs + p.x, cys + p.y);
    }
    c.stroke();
    for (const branch of crack.branches) {
      const sp = crack.points[branch.startIdx];
      c.beginPath();
      for (let i = 0; i < branch.points.length; i++) {
        const bp = branch.points[i];
        if (i === 0) c.moveTo(cxs + sp.x + bp.x, cys + sp.y + bp.y);
        else c.lineTo(cxs + sp.x + bp.x, cys + sp.y + bp.y);
      }
      c.stroke();
    }
  }

  // Outer ring
  c.shadowBlur = 0;
  c.beginPath();
  c.arc(cxs, cys, radius + 1.5, 0, Math.PI * 2);
  c.strokeStyle = style.stroke;
  c.lineWidth = 0.8;
  c.stroke();

  // Inner hole
  c.beginPath();
  c.arc(cxs, cys, radius, 0, Math.PI * 2);
  c.fillStyle = style.fill;
  c.fill();

  // Inner glow ring
  c.beginPath();
  c.arc(cxs, cys, radius - 0.8, 0, Math.PI * 2);
  c.strokeStyle = style.stroke;
  c.lineWidth = 0.4;
  c.globalAlpha = 0.5;
  c.stroke();
  c.globalAlpha = 1;

  return { bitmap: off, size };
}

// ── Spawn debris particles ──
function spawnDebris(x: number, y: number, theme: Theme) {
  const colors = PALETTES[theme];
  const count = theme === 'extreme' ? PARTICLE_COUNT.extreme : PARTICLE_COUNT.normal;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * (theme === 'extreme' ? 6 : 4);
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      size: 0.8 + Math.random() * (theme === 'extreme' ? 3.5 : 2.5),
      color: colors[Math.random() * colors.length | 0],
      life: 1,
      decay: 1 / ((0.3 + Math.random() * 0.5) * 60), // frames to die
      gravity: 0.12,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.25,
      shape: (Math.random() * 3 | 0) as 0 | 1 | 2,
    });
  }
}

// ── Draw particle (inline, no save/restore for perf) ──
function drawParticle(c: CanvasRenderingContext2D, p: Particle) {
  c.globalAlpha = p.life;
  c.fillStyle = p.color;

  if (p.shape === 0) {
    // circle
    c.beginPath();
    c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    c.fill();
  } else if (p.shape === 1) {
    // shard
    c.save();
    c.translate(p.x, p.y);
    c.rotate(p.rotation);
    c.beginPath();
    c.moveTo(-p.size, 0);
    c.lineTo(0, -p.size * 1.8);
    c.lineTo(p.size, 0);
    c.lineTo(0, p.size * 0.4);
    c.closePath();
    c.fill();
    c.restore();
  } else {
    // spark line
    c.save();
    c.translate(p.x, p.y);
    c.rotate(p.rotation);
    c.strokeStyle = p.color;
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(-p.size * 1.5, 0);
    c.lineTo(p.size * 1.5, 0);
    c.stroke();
    c.restore();
  }
}

// ── Animation loop — auto-stops when idle ──
function animate() {
  if (!ctx || !canvas) { running = false; return; }

  const now = Date.now();
  const hasParticles = particles.length > 0;
  let hasFading = false;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const dpr = window.devicePixelRatio || 1;

  // Draw holes (just compositing pre-rendered bitmaps)
  let writeIdx = 0;
  for (let i = 0; i < holes.length; i++) {
    const h = holes[i];
    const age = (now - h.createdAt) / 1000;

    if (age > HOLE_PERSIST_S) {
      h.fading = true;
      h.opacity -= HOLE_FADE_RATE;
      if (h.opacity <= 0) continue; // skip dead hole (don't copy to writeIdx)
      hasFading = true;
    }

    ctx.globalAlpha = h.opacity;
    const drawSize = h.bitmapSize / dpr;
    ctx.drawImage(h.bitmap, h.x - drawSize / 2, h.y - drawSize / 2, drawSize, drawSize);

    if (writeIdx !== i) holes[writeIdx] = h;
    writeIdx++;
  }
  holes.length = writeIdx;

  // Update + draw particles
  let pWrite = 0;
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.vx *= 0.97;
    p.rotation += p.rotSpeed;
    p.life -= p.decay;
    if (p.life <= 0) continue;
    drawParticle(ctx, p);
    if (pWrite !== i) particles[pWrite] = p;
    pWrite++;
  }
  particles.length = pWrite;

  ctx.globalAlpha = 1;

  // Stop loop if nothing to animate
  if (particles.length === 0 && !hasFading) {
    // Still need to redraw static holes if any exist, but can stop the loop
    // Re-draw one final static frame
    running = false;
    return;
  }

  animId = requestAnimationFrame(animate);
}

function ensureRunning() {
  if (!running) {
    running = true;
    animId = requestAnimationFrame(animate);
  }
}

// ── Handle click/tap ──
function onShoot(e: MouseEvent | TouchEvent) {
  const target = e.target as HTMLElement;
  if (target.closest('a, button, input, select, textarea, [role="button"]')) return;

  let x: number, y: number;
  if ('touches' in e) {
    const t = e.touches[0];
    if (!t) return;
    x = t.clientX;
    y = t.clientY;
  } else {
    x = e.clientX;
    y = e.clientY;
  }

  const theme = getTheme();

  // Show reset button
  const resetBtn = document.getElementById('reset-bullets-btn');
  if (resetBtn) {
    resetBtn.style.opacity = '1';
    resetBtn.style.pointerEvents = 'auto';
  }

  // Pre-render hole bitmap
  const { bitmap, size } = renderHoleBitmap(theme);

  // Evict oldest if at cap
  if (holes.length >= MAX_HOLES) holes.shift();

  holes.push({
    x, y,
    bitmap,
    bitmapSize: size,
    opacity: 1,
    createdAt: Date.now(),
    fading: false,
  });

  spawnDebris(x, y, theme);
  screenShake(theme === 'extreme' ? 1.3 : 0.7);
  ensureRunning();
}

// ── Resize ──
function onResize() {
  if (!canvas) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w;
  canvas.height = h;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  // Redraw static holes after resize
  if (holes.length > 0) ensureRunning();
}

// ── Public API ──
export function clearBulletHoles() {
  holes.length = 0;
  particles.length = 0;
  if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
  running = false;
  cancelAnimationFrame(animId);
}

export function initBulletHoles() {
  // Prevent double-init (View Transitions re-run scripts)
  if (initialized) {
    // Re-attach to new DOM if canvas was removed by page swap
    if (!document.getElementById('bullet-canvas') && canvas) {
      document.body.appendChild(canvas);
    }
    return;
  }
  initialized = true;

  canvas = document.createElement('canvas');
  canvas.id = 'bullet-canvas';
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
  document.body.appendChild(canvas);

  ctx = canvas.getContext('2d');
  if (!ctx) return;

  onResize();

  document.addEventListener('click', onShoot, { passive: true });
  document.addEventListener('touchstart', onShoot, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });

  // Re-attach canvas after Astro View Transition swaps
  document.addEventListener('astro:after-swap', () => {
    if (canvas && !document.getElementById('bullet-canvas')) {
      document.body.appendChild(canvas);
    }
  });
}
