/**
 * bullet-holes.ts — Shoot the website (page-space edition)
 *
 * Holes are placed in document space (absolute positioned) so they scroll with content.
 * Pre-rendered to offscreen canvases. Auto-stopping animation loop.
 */

type Theme = 'dark' | 'light' | 'extreme';

interface BakedCrack {
  points: { x: number; y: number }[];
  branches: { startIdx: number; points: { x: number; y: number }[] }[];
}

interface BulletHole {
  x: number;        // page-space (includes scroll offset)
  y: number;
  bitmap: HTMLCanvasElement;
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
  decay: number;
  gravity: number;
  rotation: number;
  rotSpeed: number;
  shape: 0 | 1 | 2;
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
const HOLE_PERSIST_S = 6;
const HOLE_FADE_S = 1.5;
const HOLE_FADE_RATE = 1 / (HOLE_FADE_S * 60);
const PARTICLE_COUNT = { normal: 14, extreme: 22 };
const SHAKE_PX = 5;
const SHAKE_FRAMES = 6;

// ── Theme helpers ──
function getTheme(): Theme {
  const cls = document.documentElement.classList;
  if (cls.contains('theme-extreme')) return 'extreme';
  if (cls.contains('theme-light')) return 'light';
  return 'dark';
}

const PALETTES: Record<Theme, string[]> = {
  dark: ['#39FF14', '#2bcc10', '#1a8a0a', '#FF51FA', '#fff'],
  light: ['#FF51FA', '#D946EF', '#AC89FF', '#7C3AED', '#131313'],
  extreme: ['#8eff71', '#ff51fa', '#ac89ff', '#00f0ff', '#ff0', '#f30'],
};

const HOLE_STYLE: Record<Theme, { fill: string; stroke: string; crack: string; glow: number }> = {
  dark: { fill: '#0a0a0a', stroke: '#39FF14', crack: 'rgba(57,255,20,0.6)', glow: 12 },
  light: { fill: '#1a1a1a', stroke: '#FF51FA', crack: 'rgba(255,81,250,0.85)', glow: 16 },
  extreme: { fill: '#000', stroke: '#8eff71', crack: 'rgba(255,81,250,0.65)', glow: 16 },
};

// ── Screen shake — shake the canvas only, not <html> (avoids navbar flash) ──
let shakeRemaining = 0;
function screenShake(intensity: number) {
  shakeRemaining = Math.ceil(SHAKE_FRAMES * intensity);
}

function applyShake() {
  if (!canvas) return;
  if (shakeRemaining > 0) {
    const decay = shakeRemaining / SHAKE_FRAMES;
    const x = (Math.random() - 0.5) * SHAKE_PX * decay;
    const y = (Math.random() - 0.5) * SHAKE_PX * decay;
    canvas.style.transform = `translate(${x}px,${y}px)`;
    shakeRemaining--;
  } else {
    canvas.style.transform = '';
  }
}

// ── Bake crack geometry ──
function bakeCracks(theme: Theme): BakedCrack[] {
  const count = theme === 'extreme' ? 7 + (Math.random() * 5 | 0) : 4 + (Math.random() * 3 | 0);
  const cracks: BakedCrack[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.6;
    const length = 20 + Math.random() * (theme === 'extreme' ? 60 : 40);
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
  const radius = 5 + Math.random() * 3;

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
  c.scale(dpr, dpr);
  const cxs = maxR + padding;
  const cys = maxR + padding;

  c.shadowColor = style.stroke;
  c.shadowBlur = style.glow;

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

  c.shadowBlur = 0;
  c.beginPath();
  c.arc(cxs, cys, radius + 1.5, 0, Math.PI * 2);
  c.strokeStyle = style.stroke;
  c.lineWidth = 0.8;
  c.stroke();

  c.beginPath();
  c.arc(cxs, cys, radius, 0, Math.PI * 2);
  c.fillStyle = style.fill;
  c.fill();

  c.beginPath();
  c.arc(cxs, cys, radius - 0.8, 0, Math.PI * 2);
  c.strokeStyle = style.stroke;
  c.lineWidth = 0.4;
  c.globalAlpha = 0.5;
  c.stroke();
  c.globalAlpha = 1;

  return { bitmap: off, size };
}

// ── Spawn debris ──
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
      decay: 1 / ((0.3 + Math.random() * 0.5) * 60),
      gravity: 0.12,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.25,
      shape: (Math.random() * 3 | 0) as 0 | 1 | 2,
    });
  }
}

function drawParticle(c: CanvasRenderingContext2D, p: Particle) {
  c.globalAlpha = p.life;
  c.fillStyle = p.color;
  if (p.shape === 0) {
    c.beginPath();
    c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    c.fill();
  } else if (p.shape === 1) {
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

// ── Resize canvas to cover full document ──
function resizeCanvas() {
  if (!canvas) return;
  // Temporarily collapse canvas so it doesn't inflate scrollHeight measurement
  const prevH = canvas.style.height;
  canvas.style.height = '0px';
  const w = Math.max(document.documentElement.scrollWidth, window.innerWidth);
  const h = Math.max(document.documentElement.scrollHeight, window.innerHeight);
  canvas.style.height = prevH;
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
  }
}

// ── Animation loop ──
function animate() {
  if (!ctx || !canvas) { running = false; return; }

  const now = Date.now();
  let hasFading = false;

  // Resize to match document (content might have changed height)
  resizeCanvas();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  applyShake();

  const dpr = window.devicePixelRatio || 1;

  // Draw holes (compositing pre-rendered bitmaps in page space)
  let writeIdx = 0;
  for (let i = 0; i < holes.length; i++) {
    const h = holes[i];
    const age = (now - h.createdAt) / 1000;

    if (age > HOLE_PERSIST_S) {
      h.fading = true;
      h.opacity -= HOLE_FADE_RATE;
      if (h.opacity <= 0) continue;
      hasFading = true;
    }

    ctx.globalAlpha = h.opacity;
    const drawSize = h.bitmapSize / dpr;
    ctx.drawImage(h.bitmap, h.x - drawSize / 2, h.y - drawSize / 2, drawSize, drawSize);

    if (writeIdx !== i) holes[writeIdx] = h;
    writeIdx++;
  }
  holes.length = writeIdx;

  // Update + draw particles (also in page space)
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

  if (particles.length === 0 && !hasFading && shakeRemaining <= 0) {
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

// ── Handle click/tap — convert to page-space coords ──
function onShoot(e: MouseEvent | TouchEvent) {
  const target = e.target as HTMLElement;
  if (target.closest('a, button, input, select, textarea, [role="button"], .site-header, #mobile-menu')) return;

  let clientX: number, clientY: number;
  if ('touches' in e) {
    const t = e.touches[0];
    if (!t) return;
    clientX = t.clientX;
    clientY = t.clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  // Convert viewport coords to page-space coords
  const x = clientX + window.scrollX;
  const y = clientY + window.scrollY;

  const theme = getTheme();

  const resetBtn = document.getElementById('reset-bullets-btn');
  if (resetBtn) {
    resetBtn.style.opacity = '1';
    resetBtn.style.pointerEvents = 'auto';
  }

  // Ensure canvas covers the full page (may have grown due to dynamic content)
  resizeCanvas();

  const { bitmap, size } = renderHoleBitmap(theme);

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

// ── Public API ──
export function clearBulletHoles() {
  holes.length = 0;
  particles.length = 0;
  if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
  running = false;
  cancelAnimationFrame(animId);
}

export function initBulletHoles() {
  if (initialized) {
    if (!document.getElementById('bullet-canvas') && canvas) {
      document.body.appendChild(canvas);
    }
    resizeCanvas();
    return;
  }
  initialized = true;

  canvas = document.createElement('canvas');
  canvas.id = 'bullet-canvas';
  // position:absolute so it lives in document flow and scrolls with content
  canvas.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;z-index:40;';
  document.body.appendChild(canvas);

  ctx = canvas.getContext('2d');
  if (!ctx) return;

  resizeCanvas();

  document.addEventListener('click', onShoot, { passive: true });
  document.addEventListener('touchstart', onShoot, { passive: true });
  window.addEventListener('resize', () => resizeCanvas(), { passive: true });

  // On page swap: clear holes (fresh page = fresh canvas) and re-attach
  document.addEventListener('astro:after-swap', () => {
    clearBulletHoles();
    if (canvas && !document.getElementById('bullet-canvas')) {
      document.body.appendChild(canvas);
    }
    resizeCanvas();
  });
}
