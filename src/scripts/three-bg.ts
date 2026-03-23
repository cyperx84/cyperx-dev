/**
 * three-bg.ts — CyperX.dev Three.js background scenes
 * One file handles all 3 themes with distinct visual personalities.
 * Dark: particle field | Light: wireframe grid | Extreme: morphing icosahedron
 */
import * as THREE from 'three';

// ── Types ──────────────────────────────────────────────────────────────────
type Theme = 'dark' | 'light' | 'extreme' | 'unknown';
interface SceneBundle {
  scene: THREE.Scene;
  camera: THREE.Camera;
  dispose: () => void;
  onMouse: (x: number, y: number) => void;
  tick: (t: number) => void;
}

// ── State ──────────────────────────────────────────────────────────────────
let renderer: THREE.WebGLRenderer | null = null;
let current: SceneBundle | null = null;
let animId: number = 0;
let canvas: HTMLCanvasElement | null = null;
let activeTheme: Theme = 'unknown';
let mouseX = 0;
let mouseY = 0;
let isVisible = true;

// ── Noise helper (simplex-like via sin) ────────────────────────────────────
function noise(x: number, y: number, z: number): number {
  return (
    Math.sin(x * 1.1 + y * 0.9) * 0.5 +
    Math.sin(y * 1.3 + z * 0.7) * 0.3 +
    Math.sin(z * 1.5 + x * 1.1) * 0.2
  );
}

// ── DARK: Particle Field ───────────────────────────────────────────────────
function buildDarkScene(w: number, h: number): SceneBundle {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000);
  camera.position.z = 60;

  const COUNT = 800;
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const velocities = new Float32Array(COUNT * 3);

  const green = new THREE.Color('#39FF14');
  const pink  = new THREE.Color('#FF51FA');

  for (let i = 0; i < COUNT; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 120;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 80;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
    velocities[i * 3]     = (Math.random() - 0.5) * 0.02;
    velocities[i * 3 + 1] = Math.random() * 0.04 + 0.01;
    velocities[i * 3 + 2] = 0;
    const c = Math.random() < 0.6 ? green : pink;
    colors[i * 3]     = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.35,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  let mx = 0, my = 0;
  const onMouse = (x: number, y: number) => { mx = x; my = y; };

  const tick = (_t: number) => {
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;

    for (let i = 0; i < COUNT; i++) {
      // Drift upward
      arr[i * 3 + 1] += velocities[i * 3 + 1];
      arr[i * 3]     += velocities[i * 3];

      // Slight mouse attraction
      const dx = mx * 60 - arr[i * 3];
      const dy = -my * 40 - arr[i * 3 + 1];
      arr[i * 3]     += dx * 0.0003;
      arr[i * 3 + 1] += dy * 0.0003;

      // Wrap when off screen
      if (arr[i * 3 + 1] > 45)  arr[i * 3 + 1] = -45;
      if (arr[i * 3]     > 65)  arr[i * 3]     = -65;
      if (arr[i * 3]     < -65) arr[i * 3]     =  65;
    }
    pos.needsUpdate = true;
  };

  const dispose = () => { geo.dispose(); mat.dispose(); };
  return { scene, camera, dispose, onMouse, tick };
}

// ── LIGHT: Wireframe Grid ──────────────────────────────────────────────────
function buildLightScene(w: number, h: number): SceneBundle {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 1000);
  camera.position.set(0, 30, 80);
  camera.lookAt(0, 0, 0);

  const SEGS = 30;
  const geo = new THREE.PlaneGeometry(120, 100, SEGS, SEGS);
  geo.rotateX(-Math.PI / 2.8);

  const mat = new THREE.MeshBasicMaterial({
    color: 0xdddddd,
    wireframe: true,
    transparent: true,
    opacity: 0.15,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = -10;
  scene.add(mesh);

  // Store original positions for undulation
  const origPos = new Float32Array((geo.attributes.position as THREE.BufferAttribute).array);

  let rippleX = 0, rippleY = 0, rippleActive = false;

  const onMouse = (x: number, y: number) => {
    rippleX = x * 60;
    rippleY = y * 50;
    rippleActive = true;
    setTimeout(() => { rippleActive = false; }, 2000);
  };

  const tick = (t: number) => {
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;

    for (let i = 0; i < arr.length / 3; i++) {
      const ox = origPos[i * 3];
      const oz = origPos[i * 3 + 2];
      // Base undulation
      let y = Math.sin(ox * 0.08 + t * 0.5) * 2 + Math.cos(oz * 0.1 + t * 0.3) * 1.5;
      // Ripple from mouse
      if (rippleActive) {
        const dist = Math.sqrt((ox - rippleX) ** 2 + (oz - rippleY) ** 2);
        y += Math.sin(dist * 0.3 - t * 4) * Math.exp(-dist * 0.03) * 3;
      }
      arr[i * 3 + 1] = y;
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  };

  const dispose = () => { geo.dispose(); mat.dispose(); };
  return { scene, camera, dispose, onMouse, tick };
}

// ── EXTREME: Morphing Icosahedron ──────────────────────────────────────────
function buildExtremeScene(w: number, h: number): SceneBundle {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000);
  camera.position.z = 40;

  const geo = new THREE.IcosahedronGeometry(12, 3);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x8eff71,
    wireframe: true,
    transparent: true,
    opacity: 0.4,
  });

  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);

  // Store original vertices
  const origPos = new Float32Array((geo.attributes.position as THREE.BufferAttribute).array);

  // Color targets
  const colors = [
    new THREE.Color('#8eff71'),
    new THREE.Color('#ff51fa'),
    new THREE.Color('#ac89ff'),
  ];

  let mx = 0, my = 0;
  const onMouse = (x: number, y: number) => { mx = x; my = y; };

  const tick = (t: number) => {
    // Morph vertices
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < arr.length / 3; i++) {
      const ox = origPos[i * 3];
      const oy = origPos[i * 3 + 1];
      const oz = origPos[i * 3 + 2];
      const n = noise(ox * 0.1 + t * 0.3, oy * 0.1, oz * 0.1);
      const pulse = 1 + n * 0.25 + Math.sin(t * 1.5) * 0.08;
      arr[i * 3]     = ox * pulse;
      arr[i * 3 + 1] = oy * pulse;
      arr[i * 3 + 2] = oz * pulse;
    }
    pos.needsUpdate = true;

    // Rotate — slight mouse influence
    mesh.rotation.y = t * 0.15 + mx * 0.3;
    mesh.rotation.x = t * 0.07 + my * 0.2;
    mesh.rotation.z = t * 0.05;

    // Cycle colors every ~5 seconds
    const ci  = Math.floor((t / 5) % colors.length);
    const ci2 = (ci + 1) % colors.length;
    const f   = (t / 5) % 1;
    mat.color.lerpColors(colors[ci], colors[ci2], f);
  };

  const dispose = () => { geo.dispose(); mat.dispose(); };
  return { scene, camera, dispose, onMouse, tick };
}

// ── Build scene from theme ─────────────────────────────────────────────────
function buildScene(theme: Theme): SceneBundle | null {
  if (!renderer) return null;
  const w = window.innerWidth;
  const h = window.innerHeight;
  switch (theme) {
    case 'dark':    return buildDarkScene(w, h);
    case 'light':   return buildLightScene(w, h);
    case 'extreme': return buildExtremeScene(w, h);
    default:        return buildDarkScene(w, h);
  }
}

// ── Animation loop ─────────────────────────────────────────────────────────
function animate(t: number) {
  if (!isVisible || !renderer || !current) {
    animId = requestAnimationFrame(animate);
    return;
  }
  const ts = t * 0.001; // seconds
  current.tick(ts);
  renderer.render(current.scene, current.camera);
  animId = requestAnimationFrame(animate);
}

// ── Swap scene on theme change ─────────────────────────────────────────────
function swapScene(theme: Theme) {
  if (theme === activeTheme) return;
  activeTheme = theme;
  if (current) { current.dispose(); current = null; }
  current = buildScene(theme);
}

// ── Detect current theme ───────────────────────────────────────────────────
function detectTheme(): Theme {
  const cls = document.documentElement.classList;
  if (cls.contains('theme-extreme')) return 'extreme';
  if (cls.contains('theme-dark'))    return 'dark';
  if (cls.contains('theme-light'))   return 'light';
  return 'dark';
}

// ── Resize handler ─────────────────────────────────────────────────────────
function onResize() {
  if (!renderer || !canvas) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  // Rebuild scene so camera aspect updates correctly
  if (current) {
    current.dispose();
    current = null;
  }
  current = buildScene(activeTheme);
}

// ── Init ───────────────────────────────────────────────────────────────────
export function initThreeBg() {
  canvas = document.getElementById('three-bg') as HTMLCanvasElement;
  if (!canvas) return;

  renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  // Build initial scene
  activeTheme = 'unknown';
  swapScene(detectTheme());

  // Kick off render loop
  cancelAnimationFrame(animId);
  animId = requestAnimationFrame(animate);

  // Mouse
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth)  * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    current?.onMouse(mouseX, mouseY);
  }, { passive: true });

  // Resize
  window.addEventListener('resize', onResize, { passive: true });

  // Visibility
  document.addEventListener('visibilitychange', () => {
    isVisible = document.visibilityState === 'visible';
    if (isVisible) animId = requestAnimationFrame(animate);
  });

  // Theme changes — watch HTML class mutations
  const observer = new MutationObserver(() => {
    swapScene(detectTheme());
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
}
