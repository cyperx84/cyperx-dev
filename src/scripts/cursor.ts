// cursor.ts — Unified canvas: custom cursor + click sparkles + parallax
// Desktop only (matchMedia hover: hover).

// ─────────────── Types ───────────────

interface TrailDot {
  x: number;
  y: number;
  opacity: number;
  size: number;
  hue: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  shape: 'circle' | 'square';
  gravity: number;
  friction: number;
  trail: Array<{ x: number; y: number }>;
}

interface AmbientSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
}

// ─────────────── State ───────────────

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let animId: number | null = null;

let mouseX = -500;
let mouseY = -500;
let hueOffset = 0;

let ringSize = 14;
let targetRingSize = 14;

const trail: TrailDot[] = [];
const TRAIL_LENGTH = 15;

const particles: Particle[] = [];
const ambientSparks: AmbientSpark[] = [];
let sparkTimer = 0;

// Idle detection — pause rAF loop when nothing to draw (saves CPU/GPU)
let loopRunning = false;
let idleFrames = 0;
const IDLE_THRESHOLD = 90; // ~1.5s at 60fps before pausing
let lastMouseX = -500;
let lastMouseY = -500;

function wakeLoop() {
  idleFrames = 0;
  if (!loopRunning) {
    loopRunning = true;
    animId = requestAnimationFrame(loop);
  }
}

// ─────────────── Helpers ───────────────

function getTheme(): 'dark' | 'light' | 'extreme' {
  const html = document.documentElement;
  if (html.classList.contains('theme-light')) return 'light';
  if (html.classList.contains('theme-extreme')) return 'extreme';
  return 'dark';
}

function resize() {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

// ─────────────── Cursor Drawing ───────────────

function drawCursorDark() {
  if (!ctx) return;
  // Draw trail without per-dot shadowBlur (major perf win)
  ctx.save();
  ctx.fillStyle = '#39FF14';
  for (let i = 0; i < trail.length; i++) {
    const dot = trail[i];
    const t = (i + 1) / trail.length;
    ctx.globalAlpha = dot.opacity * t * 0.8;
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, Math.max(0.5, dot.size * (0.2 + t * 0.8)), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  // Main cursor dot with single shadowBlur
  ctx.save();
  ctx.shadowColor = '#39FF14';
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.arc(mouseX, mouseY, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#39FF14';
  ctx.fill();
  ctx.restore();
}

function drawCursorLight() {
  if (!ctx) return;
  const grey = '#222222';
  const len = 14;

  ctx.save();
  ctx.strokeStyle = grey;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.moveTo(mouseX - len, mouseY);
  ctx.lineTo(mouseX + len, mouseY);
  ctx.moveTo(mouseX, mouseY - len);
  ctx.lineTo(mouseX, mouseY + len);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(mouseX, mouseY, 2, 0, Math.PI * 2);
  ctx.fillStyle = grey;
  ctx.fill();
  ctx.restore();

  if (ringSize > 2) {
    const alpha = Math.max(0, 1 - Math.max(0, ringSize - 14) / 22);
    ctx.save();
    ctx.strokeStyle = '#FF51FA';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = alpha * 0.85;
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, ringSize, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawCursorExtreme() {
  if (!ctx) return;

  // Draw trail without per-dot shadowBlur (major compositing savings)
  ctx.save();
  for (let i = 0; i < trail.length; i++) {
    const dot = trail[i];
    const t = (i + 1) / trail.length;
    const hue = (dot.hue) % 360;
    ctx.globalAlpha = dot.opacity * t * 0.85;
    ctx.fillStyle = `hsl(${hue},100%,60%)`;
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, Math.max(0.5, dot.size * (0.2 + t * 0.8)), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Ambient sparks — batch without per-spark shadowBlur
  ctx.save();
  for (const s of ambientSparks) {
    const alpha = s.life / s.maxLife;
    ctx.globalAlpha = alpha * 0.9;
    ctx.fillStyle = `hsl(${s.hue},100%,70%)`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size * (0.3 + alpha * 0.7), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Main cursor dot — single shadowBlur
  const mainHue = hueOffset % 360;
  ctx.save();
  ctx.shadowColor = `hsl(${mainHue},100%,60%)`;
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(mouseX, mouseY, 6, 0, Math.PI * 2);
  ctx.fillStyle = `hsl(${mainHue},100%,60%)`;
  ctx.fill();
  ctx.restore();
}

// ─────────────── Click Particles ───────────────

export function spawnClickParticles(x: number, y: number) {
  const theme = getTheme();

  if (theme === 'dark') {
    const count = 12 + Math.floor(Math.random() * 7);
    const colors = ['#39FF14', '#FF51FA', '#39FF14', '#AC89FF'];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.6;
      const speed = 2 + Math.random() * 6;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 35 + Math.random() * 30,
        maxLife: 65,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2 + Math.random() * 3.5,
        shape: 'circle',
        gravity: 0.07,
        friction: 0.97,
        trail: [],
      });
    }
  } else if (theme === 'light') {
    const count = 14 + Math.floor(Math.random() * 7);
    const colors = ['#39FF14', '#FF51FA', '#AC89FF', '#FF51FA', '#131313'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed * (0.4 + Math.random() * 0.8),
        vy: Math.sin(angle) * speed * (0.4 + Math.random() * 0.8) - 2.5,
        life: 50 + Math.random() * 30,
        maxLife: 80,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 6,
        shape: 'square',
        gravity: 0.18,
        friction: 0.94,
        trail: [],
      });
    }
  } else {
    // Extreme
    const count = 18 + Math.floor(Math.random() * 5);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.4;
      const speed = 4 + Math.random() * 9;
      const hue = Math.random() * 360;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 55 + Math.random() * 35,
        maxLife: 90,
        color: `hsl(${hue},100%,65%)`,
        size: 2.5 + Math.random() * 4,
        shape: 'circle',
        gravity: 0.04,
        friction: 0.96,
        trail: [],
      });
    }
  }
}

function drawParticles() {
  if (!ctx) return;
  const theme = getTheme();

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.vy += p.gravity;
    p.vx *= p.friction;
    p.vy *= p.friction;
    p.x += p.vx;
    p.y += p.vy;
    p.life--;

    if (theme === 'extreme' && p.trail !== undefined) {
      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > 7) p.trail.shift();
    }

    if (p.life <= 0) { particles.splice(i, 1); continue; }

    const alpha = Math.pow(p.life / p.maxLife, 0.5);

    // Extreme particle trail
    if (theme === 'extreme' && p.trail.length > 1) {
      for (let t = 1; t < p.trail.length; t++) {
        const ta = t / p.trail.length;
        ctx.save();
        ctx.globalAlpha = alpha * ta * 0.35;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size * ta * 0.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.trail[t - 1].x, p.trail[t - 1].y);
        ctx.lineTo(p.trail[t].x, p.trail[t].y);
        ctx.stroke();
        ctx.restore();
      }
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    if (p.shape === 'square') {
      const s = p.size * (0.5 + alpha * 0.5);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.life * 0.09);
      ctx.fillStyle = p.color;
      ctx.fillRect(-s / 2, -s / 2, s, s);
    } else {
      if (theme !== 'light') {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.3, p.size * alpha), 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }
    ctx.restore();
  }
}

// ─────────────── Main Loop ───────────────

function loop() {
  if (!ctx || !canvas) {
    animId = requestAnimationFrame(loop);
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (document.hidden) {
    // Pause loop when tab is hidden — wakeLoop() restarts on visibility change
    loopRunning = false;
    return;
  }

  const theme = getTheme();
  hueOffset += 1.2;

  // Check if mouse moved
  const mouseMoved = mouseX !== lastMouseX || mouseY !== lastMouseY;
  lastMouseX = mouseX;
  lastMouseY = mouseY;

  const hasActivity = mouseMoved || particles.length > 0 || ambientSparks.length > 0;

  if (hasActivity) {
    idleFrames = 0;
  } else {
    idleFrames++;
    if (idleFrames > IDLE_THRESHOLD) {
      // Nothing to draw — pause the loop to save CPU/GPU
      loopRunning = false;
      return;
    }
  }

  // Update trail
  trail.unshift({ x: mouseX, y: mouseY, opacity: 0.9, size: 5, hue: hueOffset });
  if (trail.length > TRAIL_LENGTH) trail.pop();
  for (let i = 0; i < trail.length; i++) {
    trail[i].opacity = Math.max(0, trail[i].opacity * 0.93);
  }

  // Light ring lerp
  ringSize += (targetRingSize - ringSize) * 0.14;

  // Extreme ambient sparks
  if (theme === 'extreme') {
    sparkTimer++;
    if (sparkTimer % 5 === 0) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 2.8;
      ambientSparks.push({
        x: mouseX, y: mouseY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 28 + Math.random() * 18,
        maxLife: 46,
        size: 1.2 + Math.random() * 1.8,
        hue: Math.random() * 360,
      });
    }
    for (let i = ambientSparks.length - 1; i >= 0; i--) {
      const s = ambientSparks[i];
      s.x += s.vx; s.y += s.vy;
      s.vx *= 0.96; s.vy *= 0.96;
      s.life--;
      if (s.life <= 0) ambientSparks.splice(i, 1);
    }
  }

  // Draw cursor
  if (theme === 'dark') drawCursorDark();
  else if (theme === 'light') drawCursorLight();
  else drawCursorExtreme();

  // Draw click particles on top
  drawParticles();

  animId = requestAnimationFrame(loop);
}

// ─────────────── Init ───────────────

export function initCursor() {
  const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  canvas = document.getElementById('cursor-canvas') as HTMLCanvasElement;
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize);

  // MutationObserver for theme changes
  new MutationObserver(() => {
    trail.length = 0;
    ambientSparks.length = 0;
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  // Wake loop on visibility change
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) wakeLoop();
  });

  if (isTouch) {
    // Touch devices: sparkle bursts on tap only (no custom cursor/trail)
    document.addEventListener('touchstart', (e) => {
      if (document.hidden) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        spawnClickParticles(touch.clientX, touch.clientY);
      }
      wakeLoop();
    }, { passive: true });

    // Don't start loop — it will wake on first touch
    return;
  }

  // Desktop: full cursor + trail + click sparkles
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    wakeLoop();
  });

  // Interactive element hover detection for light ring
  document.addEventListener('mouseover', (e) => {
    const el = e.target as Element;
    if (el?.matches?.('a, button, [role="button"], input, select, textarea, label, [tabindex]')) {
      targetRingSize = 26;
    }
  });
  document.addEventListener('mouseout', (e) => {
    const el = e.target as Element;
    if (el?.matches?.('a, button, [role="button"], input, select, textarea, label, [tabindex]')) {
      targetRingSize = 14;
    }
  });

  // Click sparkles
  document.addEventListener('click', (e) => {
    if (!document.hidden) {
      spawnClickParticles(e.clientX, e.clientY);
      wakeLoop();
    }
  });

  wakeLoop();
}
