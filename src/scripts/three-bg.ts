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

// ── DARK: Network Constellation ────────────────────────────────────────────
function buildDarkScene(w: number, h: number): SceneBundle {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000);
  camera.position.z = 60;

  const COUNT = 1400;
  const LINK_DIST = 12;
  const MAX_LINKS = 2400;
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const sizes = new Float32Array(COUNT);
  const velocities = new Float32Array(COUNT * 3);
  const phases = new Float32Array(COUNT); // per-particle phase for pulsing

  const green  = new THREE.Color('#39FF14');
  const pink   = new THREE.Color('#FF51FA');
  const purple = new THREE.Color('#AC89FF');
  const palette = [green, pink, purple];

  for (let i = 0; i < COUNT; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 140;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 90;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 50;
    velocities[i * 3]     = (Math.random() - 0.5) * 0.03;
    velocities[i * 3 + 1] = Math.random() * 0.05 + 0.01;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.015;
    sizes[i] = 0.6 + Math.random() * 2.0;
    phases[i] = Math.random() * Math.PI * 2;
    const c = palette[Math.floor(Math.random() * palette.length)];
    colors[i * 3]     = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.PointsMaterial({
    size: 1.2,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  // Connecting lines between nearby particles
  const linePositions = new Float32Array(MAX_LINKS * 6);
  const lineColors = new Float32Array(MAX_LINKS * 6);
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  lineGeo.setAttribute('color',    new THREE.BufferAttribute(lineColors, 3));
  lineGeo.setDrawRange(0, 0);

  const lineMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.25,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const lines = new THREE.LineSegments(lineGeo, lineMat);
  scene.add(lines);

  // Hub nodes — larger glowing points
  const HUB_COUNT = 8;
  const hubGeo = new THREE.BufferGeometry();
  const hubPos = new Float32Array(HUB_COUNT * 3);
  const hubCol = new Float32Array(HUB_COUNT * 3);
  for (let i = 0; i < HUB_COUNT; i++) {
    hubPos[i * 3]     = (Math.random() - 0.5) * 100;
    hubPos[i * 3 + 1] = (Math.random() - 0.5) * 60;
    hubPos[i * 3 + 2] = (Math.random() - 0.5) * 30;
    const c = palette[i % palette.length];
    hubCol[i * 3] = c.r; hubCol[i * 3 + 1] = c.g; hubCol[i * 3 + 2] = c.b;
  }
  hubGeo.setAttribute('position', new THREE.BufferAttribute(hubPos, 3));
  hubGeo.setAttribute('color',    new THREE.BufferAttribute(hubCol, 3));
  const hubMat = new THREE.PointsMaterial({
    size: 4,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const hubs = new THREE.Points(hubGeo, hubMat);
  scene.add(hubs);

  let mx = 0, my = 0;
  const onMouse = (x: number, y: number) => { mx = x; my = y; };

  const tick = (t: number) => {
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;

    // Pulse hub sizes
    hubMat.size = 3.5 + Math.sin(t * 2) * 1.5;

    // Pulse particle opacity
    mat.opacity = 0.55 + Math.sin(t * 1.5) * 0.15;

    for (let i = 0; i < COUNT; i++) {
      arr[i * 3]     += velocities[i * 3];
      arr[i * 3 + 1] += velocities[i * 3 + 1];
      arr[i * 3 + 2] += velocities[i * 3 + 2];

      // Mouse repulsion (push away from cursor for organic feel)
      const worldMx = mx * 70;
      const worldMy = -my * 45;
      const dx = arr[i * 3] - worldMx;
      const dy = arr[i * 3 + 1] - worldMy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 20 && dist > 0.1) {
        const force = (20 - dist) * 0.003;
        arr[i * 3]     += (dx / dist) * force;
        arr[i * 3 + 1] += (dy / dist) * force;
      }

      // Gentle sine drift on z
      arr[i * 3 + 2] += Math.sin(t + phases[i]) * 0.01;

      // Wrap
      if (arr[i * 3 + 1] > 50)   arr[i * 3 + 1] = -50;
      if (arr[i * 3 + 1] < -50)  arr[i * 3 + 1] = 50;
      if (arr[i * 3]     > 75)   arr[i * 3]     = -75;
      if (arr[i * 3]     < -75)  arr[i * 3]     = 75;
      if (arr[i * 3 + 2] > 30)   arr[i * 3 + 2] = -30;
      if (arr[i * 3 + 2] < -30)  arr[i * 3 + 2] = 30;
    }
    pos.needsUpdate = true;

    // Update connecting lines (spatial proximity)
    let lineIdx = 0;
    const lp = lineGeo.attributes.position as THREE.BufferAttribute;
    const lc = lineGeo.attributes.color as THREE.BufferAttribute;
    const lpArr = lp.array as Float32Array;
    const lcArr = lc.array as Float32Array;

    // Only check a subset each frame for performance
    const step = Math.max(1, Math.floor(COUNT / 600));
    for (let i = 0; i < COUNT && lineIdx < MAX_LINKS; i += step) {
      for (let j = i + 1; j < COUNT && lineIdx < MAX_LINKS; j += step) {
        const dx = arr[i * 3] - arr[j * 3];
        const dy = arr[i * 3 + 1] - arr[j * 3 + 1];
        const dz = arr[i * 3 + 2] - arr[j * 3 + 2];
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < LINK_DIST * LINK_DIST) {
          const base = lineIdx * 6;
          lpArr[base]     = arr[i * 3];
          lpArr[base + 1] = arr[i * 3 + 1];
          lpArr[base + 2] = arr[i * 3 + 2];
          lpArr[base + 3] = arr[j * 3];
          lpArr[base + 4] = arr[j * 3 + 1];
          lpArr[base + 5] = arr[j * 3 + 2];
          // Fade by distance
          const alpha = 1 - Math.sqrt(d2) / LINK_DIST;
          lcArr[base]     = colors[i * 3] * alpha;
          lcArr[base + 1] = colors[i * 3 + 1] * alpha;
          lcArr[base + 2] = colors[i * 3 + 2] * alpha;
          lcArr[base + 3] = colors[j * 3] * alpha;
          lcArr[base + 4] = colors[j * 3 + 1] * alpha;
          lcArr[base + 5] = colors[j * 3 + 2] * alpha;
          lineIdx++;
        }
      }
    }
    lineGeo.setDrawRange(0, lineIdx * 2);
    lp.needsUpdate = true;
    lc.needsUpdate = true;
  };

  const dispose = () => {
    geo.dispose(); mat.dispose();
    lineGeo.dispose(); lineMat.dispose();
    hubGeo.dispose(); hubMat.dispose();
  };
  return { scene, camera, dispose, onMouse, tick };
}

// ── LIGHT: Geometric Landscape ─────────────────────────────────────────────
function buildLightScene(w: number, h: number): SceneBundle {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 1000);
  camera.position.set(0, 25, 70);
  camera.lookAt(0, -5, 0);

  // Ground grid — more visible, colored
  const SEGS = 40;
  const gridGeo = new THREE.PlaneGeometry(160, 120, SEGS, SEGS);
  gridGeo.rotateX(-Math.PI / 2.5);

  // Vertex colors for the grid — gradient from pink to purple
  const gridVertCount = (SEGS + 1) * (SEGS + 1);
  const gridColors = new Float32Array(gridVertCount * 3);
  const pinkC  = new THREE.Color('#FF51FA');
  const purpC  = new THREE.Color('#AC89FF');
  const greenC = new THREE.Color('#39FF14');
  for (let i = 0; i < gridVertCount; i++) {
    const t = i / gridVertCount;
    const c = new THREE.Color().lerpColors(pinkC, purpC, t);
    gridColors[i * 3] = c.r; gridColors[i * 3 + 1] = c.g; gridColors[i * 3 + 2] = c.b;
  }
  gridGeo.setAttribute('color', new THREE.BufferAttribute(gridColors, 3));

  const gridMat = new THREE.MeshBasicMaterial({
    wireframe: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.12,
  });

  const gridMesh = new THREE.Mesh(gridGeo, gridMat);
  gridMesh.position.y = -15;
  scene.add(gridMesh);

  const origPos = new Float32Array((gridGeo.attributes.position as THREE.BufferAttribute).array);

  // Floating geometric shapes
  interface FloatingShape {
    mesh: THREE.Mesh;
    baseY: number;
    phase: number;
    rotSpeed: THREE.Vector3;
    floatSpeed: number;
    floatAmp: number;
  }
  const shapes: FloatingShape[] = [];
  const shapeColors = [0xFF51FA, 0xAC89FF, 0x39FF14, 0xFF51FA, 0xAC89FF, 0x39FF14, 0xFF51FA];
  const geometries = [
    () => new THREE.OctahedronGeometry(2.5, 0),
    () => new THREE.TetrahedronGeometry(2.2, 0),
    () => new THREE.IcosahedronGeometry(2, 0),
    () => new THREE.BoxGeometry(2.5, 2.5, 2.5),
    () => new THREE.OctahedronGeometry(1.8, 1),
    () => new THREE.TorusGeometry(2, 0.6, 6, 8),
    () => new THREE.DodecahedronGeometry(2, 0),
  ];

  for (let i = 0; i < 7; i++) {
    const g = geometries[i]();
    const m = new THREE.MeshBasicMaterial({
      color: shapeColors[i],
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    const mesh = new THREE.Mesh(g, m);
    const x = (Math.random() - 0.5) * 80;
    const y = Math.random() * 20 + 5;
    const z = (Math.random() - 0.5) * 40 - 10;
    mesh.position.set(x, y, z);
    scene.add(mesh);
    shapes.push({
      mesh,
      baseY: y,
      phase: Math.random() * Math.PI * 2,
      rotSpeed: new THREE.Vector3(
        (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * 0.6,
        (Math.random() - 0.5) * 0.3,
      ),
      floatSpeed: 0.3 + Math.random() * 0.6,
      floatAmp: 2 + Math.random() * 4,
    });
  }

  // Vertical accent lines
  const accentLines: THREE.Line[] = [];
  for (let i = 0; i < 5; i++) {
    const lg = new THREE.BufferGeometry();
    const x = (Math.random() - 0.5) * 100;
    const z = -20 - Math.random() * 30;
    const pts = [new THREE.Vector3(x, -20, z), new THREE.Vector3(x, 40, z)];
    lg.setFromPoints(pts);
    const lm = new THREE.LineBasicMaterial({
      color: i % 2 === 0 ? 0xFF51FA : 0x39FF14,
      transparent: true,
      opacity: 0.06,
    });
    const line = new THREE.Line(lg, lm);
    scene.add(line);
    accentLines.push(line);
  }

  let rippleX = 0, rippleY = 0, rippleStrength = 0;

  const onMouse = (x: number, y: number) => {
    rippleX = x * 80;
    rippleY = y * 60;
    rippleStrength = 1;
  };

  const tick = (t: number) => {
    // Grid undulation — stronger waves
    const pos = gridGeo.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;

    for (let i = 0; i < arr.length / 3; i++) {
      const ox = origPos[i * 3];
      const oz = origPos[i * 3 + 2];
      let y = Math.sin(ox * 0.06 + t * 0.6) * 3.5
            + Math.cos(oz * 0.08 + t * 0.4) * 2.5
            + Math.sin((ox + oz) * 0.04 + t * 0.25) * 1.5;
      // Mouse ripple
      if (rippleStrength > 0.01) {
        const dist = Math.sqrt((ox - rippleX) ** 2 + (oz - rippleY) ** 2);
        y += Math.sin(dist * 0.2 - t * 5) * Math.exp(-dist * 0.02) * 5 * rippleStrength;
      }
      arr[i * 3 + 1] = y;
    }
    pos.needsUpdate = true;
    rippleStrength *= 0.995; // slow decay

    // Grid opacity pulse
    gridMat.opacity = 0.1 + Math.sin(t * 0.5) * 0.04;

    // Float + rotate shapes
    for (const s of shapes) {
      s.mesh.position.y = s.baseY + Math.sin(t * s.floatSpeed + s.phase) * s.floatAmp;
      s.mesh.rotation.x += s.rotSpeed.x * 0.01;
      s.mesh.rotation.y += s.rotSpeed.y * 0.01;
      s.mesh.rotation.z += s.rotSpeed.z * 0.01;
      // Pulse opacity
      const m = s.mesh.material as THREE.MeshBasicMaterial;
      m.opacity = 0.2 + Math.sin(t * 0.8 + s.phase) * 0.12;
    }

    // Accent line opacity shimmer
    for (let i = 0; i < accentLines.length; i++) {
      const m = accentLines[i].material as THREE.LineBasicMaterial;
      m.opacity = 0.04 + Math.sin(t * 0.3 + i * 1.5) * 0.03;
    }
  };

  const dispose = () => {
    gridGeo.dispose(); gridMat.dispose();
    for (const s of shapes) { s.mesh.geometry.dispose(); (s.mesh.material as THREE.Material).dispose(); }
    for (const l of accentLines) { l.geometry.dispose(); (l.material as THREE.Material).dispose(); }
  };
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
