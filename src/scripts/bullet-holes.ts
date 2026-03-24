/**
 * bullet-holes.ts — Shoot the website
 * Click anywhere to leave bullet holes with cracks, debris particles, and screen shake.
 * Theme-aware: dark=green sparks, light=pink shards, extreme=rainbow chaos.
 */

type Theme = 'dark' | 'light' | 'extreme';

interface BulletHole {
  x: number;
  y: number;
  radius: number;
  cracks: { angle: number; length: number; branches: { at: number; angle: number; length: number }[] }[];
  opacity: number;
  theme: Theme;
  createdAt: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  gravity: number;
  rotation: number;
  rotSpeed: number;
  shape: 'circle' | 'shard' | 'spark';
}

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let holes: BulletHole[] = [];
let particles: Particle[] = [];
let animId = 0;
let isRunning = false;

// Theme detection
function getTheme(): Theme {
  const cls = document.documentElement.classList;
  if (cls.contains('theme-extreme')) return 'extreme';
  if (cls.contains('theme-light')) return 'light';
  return 'dark';
}

// Theme color palettes
function getColors(theme: Theme): string[] {
  switch (theme) {
    case 'dark': return ['#39FF14', '#2bcc10', '#1a8a0a', '#FF51FA', '#ffffff'];
    case 'light': return ['#FF51FA', '#AC89FF', '#39FF14', '#131313', '#888888'];
    case 'extreme': return ['#8eff71', '#ff51fa', '#ac89ff', '#00f0ff', '#ff0', '#ff3300'];
  }
}

function getHoleColor(theme: Theme): { fill: string; stroke: string; crackColor: string } {
  switch (theme) {
    case 'dark': return { fill: '#0a0a0a', stroke: '#39FF14', crackColor: '#39FF1480' };
    case 'light': return { fill: '#333333', stroke: '#FF51FA', crackColor: '#FF51FA60' };
    case 'extreme': return { fill: '#000000', stroke: '#8eff71', crackColor: '#ff51fa90' };
  }
}

// Screen shake
function screenShake(intensity: number = 1) {
  const el = document.documentElement;
  const dur = 150;
  const start = performance.now();
  const shakeAnim = (t: number) => {
    const elapsed = t - start;
    if (elapsed > dur) {
      el.style.transform = '';
      return;
    }
    const decay = 1 - elapsed / dur;
    const x = (Math.random() - 0.5) * 8 * intensity * decay;
    const y = (Math.random() - 0.5) * 8 * intensity * decay;
    el.style.transform = `translate(${x}px, ${y}px)`;
    requestAnimationFrame(shakeAnim);
  };
  requestAnimationFrame(shakeAnim);
}

// Generate crack pattern
function generateCracks(theme: Theme): BulletHole['cracks'] {
  const count = theme === 'extreme' ? 8 + Math.floor(Math.random() * 6) : 4 + Math.floor(Math.random() * 4);
  const cracks: BulletHole['cracks'] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.6;
    const length = 15 + Math.random() * (theme === 'extreme' ? 60 : 35);
    const branches: { at: number; angle: number; length: number }[] = [];
    // Add 0-2 branches per crack
    const branchCount = Math.floor(Math.random() * 3);
    for (let b = 0; b < branchCount; b++) {
      branches.push({
        at: 0.3 + Math.random() * 0.5,
        angle: angle + (Math.random() - 0.5) * 1.2,
        length: 8 + Math.random() * 15,
      });
    }
    cracks.push({ angle, length, branches });
  }
  return cracks;
}

// Spawn particles
function spawnDebris(x: number, y: number, theme: Theme) {
  const colors = getColors(theme);
  const count = theme === 'extreme' ? 30 : 18;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * (theme === 'extreme' ? 8 : 5);
    const shapes: Particle['shape'][] = ['circle', 'shard', 'spark'];
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2, // slight upward bias
      size: 1 + Math.random() * (theme === 'extreme' ? 5 : 3),
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1,
      maxLife: 0.4 + Math.random() * 0.6,
      gravity: 0.15,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.3,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
    });
  }
}

// Draw a single bullet hole
function drawHole(hole: BulletHole) {
  if (!ctx) return;
  const { fill, stroke, crackColor } = getHoleColor(hole.theme);

  ctx.save();
  ctx.globalAlpha = hole.opacity;

  // Glow
  ctx.shadowColor = stroke;
  ctx.shadowBlur = hole.theme === 'extreme' ? 15 : 8;

  // Cracks
  ctx.strokeStyle = crackColor;
  ctx.lineWidth = hole.theme === 'extreme' ? 2 : 1.5;
  ctx.lineCap = 'round';
  for (const crack of hole.cracks) {
    ctx.beginPath();
    ctx.moveTo(hole.x, hole.y);
    const endX = hole.x + Math.cos(crack.angle) * crack.length;
    const endY = hole.y + Math.sin(crack.angle) * crack.length;
    // Jagged path
    const steps = 4;
    let px = hole.x, py = hole.y;
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const jitter = (1 - t) * 3;
      const nx = hole.x + (endX - hole.x) * t + (Math.random() - 0.5) * jitter;
      const ny = hole.y + (endY - hole.y) * t + (Math.random() - 0.5) * jitter;
      ctx.lineTo(nx, ny);
      px = nx; py = ny;
    }
    ctx.stroke();

    // Branches
    for (const branch of crack.branches) {
      const bx = hole.x + (endX - hole.x) * branch.at;
      const by = hole.y + (endY - hole.y) * branch.at;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(
        bx + Math.cos(branch.angle) * branch.length,
        by + Math.sin(branch.angle) * branch.length,
      );
      ctx.stroke();
    }
  }

  // Outer ring (impact crater)
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(hole.x, hole.y, hole.radius + 2, 0, Math.PI * 2);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Inner hole
  ctx.beginPath();
  ctx.arc(hole.x, hole.y, hole.radius, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();

  // Inner ring glow
  ctx.beginPath();
  ctx.arc(hole.x, hole.y, hole.radius - 1, 0, Math.PI * 2);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = hole.opacity * 0.6;
  ctx.stroke();

  ctx.restore();
}

// Draw a particle
function drawParticle(p: Particle) {
  if (!ctx) return;
  ctx.save();
  ctx.globalAlpha = p.life;
  ctx.fillStyle = p.color;
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);

  switch (p.shape) {
    case 'circle':
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'shard':
      ctx.beginPath();
      ctx.moveTo(-p.size, 0);
      ctx.lineTo(0, -p.size * 2);
      ctx.lineTo(p.size, 0);
      ctx.lineTo(0, p.size * 0.5);
      ctx.closePath();
      ctx.fill();
      break;
    case 'spark':
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(-p.size * 2, 0);
      ctx.lineTo(p.size * 2, 0);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1;
      ctx.stroke();
      break;
  }
  ctx.restore();
}

// Main animation loop
function animate() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw all holes
  for (const hole of holes) {
    drawHole(hole);
  }

  // Update + draw particles
  const dt = 1 / 60;
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.vx *= 0.98;
    p.rotation += p.rotSpeed;
    p.life -= dt / p.maxLife;
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    drawParticle(p);
  }

  // Fade old holes slowly
  const now = Date.now();
  for (let i = holes.length - 1; i >= 0; i--) {
    const age = (now - holes[i].createdAt) / 1000;
    if (age > 30) {
      holes[i].opacity -= 0.005;
      if (holes[i].opacity <= 0) holes.splice(i, 1);
    }
  }

  // Cap at 50 holes
  while (holes.length > 50) holes.shift();

  animId = requestAnimationFrame(animate);
}

// Handle click
function onShoot(e: MouseEvent | TouchEvent) {
  // Don't shoot on interactive elements
  const target = e.target as HTMLElement;
  if (target.closest('a, button, input, select, textarea, [role="button"]')) return;

  let x: number, y: number;
  if ('touches' in e) {
    x = e.touches[0].clientX;
    y = e.touches[0].clientY;
  } else {
    x = e.clientX;
    y = e.clientY;
  }

  const theme = getTheme();

  // Create hole
  const hole: BulletHole = {
    x: x * window.devicePixelRatio,
    y: y * window.devicePixelRatio,
    radius: 3 + Math.random() * 2,
    cracks: generateCracks(theme),
    opacity: 1,
    theme,
    createdAt: Date.now(),
  };
  holes.push(hole);

  // Debris particles
  spawnDebris(hole.x, hole.y, theme);

  // Screen shake
  const intensity = theme === 'extreme' ? 1.5 : 0.8;
  screenShake(intensity);
}

// Resize handler
function onResize() {
  if (!canvas) return;
  canvas.width = window.innerWidth * window.devicePixelRatio;
  canvas.height = window.innerHeight * window.devicePixelRatio;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
}

// Init
export function initBulletHoles() {
  // Create overlay canvas
  canvas = document.createElement('canvas');
  canvas.id = 'bullet-canvas';
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
  document.body.appendChild(canvas);

  ctx = canvas.getContext('2d');
  if (!ctx) return;

  onResize();

  // Listen for clicks/taps on the document (canvas is pointer-events:none)
  document.addEventListener('click', onShoot, { passive: true });
  document.addEventListener('touchstart', onShoot, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });

  // Start loop
  if (!isRunning) {
    isRunning = true;
    animId = requestAnimationFrame(animate);
  }
}
