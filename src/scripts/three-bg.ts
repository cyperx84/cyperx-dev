/**
 * three-bg.ts — CyperX.dev Three.js background scenes
 * One file handles all 3 themes with distinct visual personalities.
 * Dark: wireframe grid (glowing) | Light: wireframe grid (soft) | Extreme: wireframe grid (rainbow chaos)
 */
import * as THREE from 'three';

// Reusable Color object — avoids GC pressure in hot loops
const tmpColor = new THREE.Color();

// Mobile detection for reduced geometry
const isMobileGeo = typeof window !== 'undefined' && window.innerWidth < 768;

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

// ── DARK: Wireframe Grid (dark variant of light mesh) ──────────────────────
function buildDarkScene(w: number, h: number): SceneBundle {
  const scene = new THREE.Scene();

  // Orthographic camera — no perspective distortion, no scroll-reactive movement
  const aspect = w / h;
  const frustum = 60;
  const camera = new THREE.OrthographicCamera(
    -frustum * aspect, frustum * aspect, frustum, -frustum, 0.1, 500
  );
  camera.position.set(0, 0, 100);
  camera.lookAt(0, 0, 0);

  // ── Particle field — drifting embers ──
  const COUNT = isMobileGeo ? 36 : 80;
  const positions = new Float32Array(COUNT * 3);
  const colors    = new Float32Array(COUNT * 3);
  const sizes     = new Float32Array(COUNT);
  const velocities: { vx: number; vy: number; phase: number }[] = [];

  const palette = [
    new THREE.Color('#39FF14'),
    new THREE.Color('#FF51FA'),
    new THREE.Color('#AC89FF'),
  ];

  const spread = frustum * aspect;
  const spreadY = frustum;

  for (let i = 0; i < COUNT; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * spread * 2;
    positions[i * 3 + 1] = (Math.random() - 0.5) * spreadY * 2;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 40;

    const c = palette[Math.floor(Math.random() * palette.length)];
    colors[i * 3]     = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;

    sizes[i] = 1.5 + Math.random() * 3.0;

    velocities.push({
      vx: (Math.random() - 0.5) * 0.3,
      vy: 0.05 + Math.random() * 0.15,   // slow upward drift
      phase: Math.random() * Math.PI * 2,
    });
  }

  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  particleGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const particleMat = new THREE.PointsMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
    size: 2.5,
  });

  const points = new THREE.Points(particleGeo, particleMat);
  scene.add(points);

  // ── Connection lines between nearby particles ──
  const MAX_LINES = isMobileGeo ? 18 : 48;
  const CONNECT_DIST = 25;
  const linePositions = new Float32Array(MAX_LINES * 6); // 2 verts × 3 comps
  const lineColors    = new Float32Array(MAX_LINES * 6);
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  lineGeo.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));
  lineGeo.setDrawRange(0, 0);

  const lineMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.12,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const lineSegments = new THREE.LineSegments(lineGeo, lineMat);
  scene.add(lineSegments);

  let mouseX = 0, mouseY = 0;

  const onMouse = (nx: number, ny: number) => {
    mouseX = nx * spread;
    mouseY = ny * spreadY;
  };

  const tick = (t: number) => {
    const pos = particleGeo.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;

    // Drift particles
    for (let i = 0; i < COUNT; i++) {
      const v = velocities[i];
      // Gentle lateral sway + upward drift
      arr[i * 3]     += v.vx + Math.sin(t * 0.3 + v.phase) * 0.04;
      arr[i * 3 + 1] += v.vy;

      // Wrap around edges
      if (arr[i * 3 + 1] > spreadY + 5)  arr[i * 3 + 1] = -spreadY - 5;
      if (arr[i * 3]     > spread + 5)    arr[i * 3]     = -spread - 5;
      if (arr[i * 3]     < -spread - 5)   arr[i * 3]     = spread + 5;

      // Mouse repulsion — gentle push away
      const dx = arr[i * 3] - mouseX;
      const dy = arr[i * 3 + 1] - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 20 && dist > 0.1) {
        const force = (20 - dist) * 0.003;
        arr[i * 3]     += (dx / dist) * force;
        arr[i * 3 + 1] += (dy / dist) * force;
      }
    }
    pos.needsUpdate = true;

    // Breathing opacity
    particleMat.opacity = 0.25 + Math.sin(t * 0.2) * 0.1;

    // Update connection lines (nearest-neighbour pairs)
    const lp = lineGeo.attributes.position as THREE.BufferAttribute;
    const la = lp.array as Float32Array;
    const lc = lineGeo.attributes.color as THREE.BufferAttribute;
    const lcArr = lc.array as Float32Array;
    let lineIdx = 0;

    for (let i = 0; i < COUNT && lineIdx < MAX_LINES; i++) {
      for (let j = i + 1; j < COUNT && lineIdx < MAX_LINES; j++) {
        const dx = arr[i * 3] - arr[j * 3];
        const dy = arr[i * 3 + 1] - arr[j * 3 + 1];
        const dz = arr[i * 3 + 2] - arr[j * 3 + 2];
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < CONNECT_DIST * CONNECT_DIST) {
          const base = lineIdx * 6;
          la[base]     = arr[i * 3];     la[base + 1] = arr[i * 3 + 1]; la[base + 2] = arr[i * 3 + 2];
          la[base + 3] = arr[j * 3];     la[base + 4] = arr[j * 3 + 1]; la[base + 5] = arr[j * 3 + 2];
          // Fade line by distance
          const alpha = 1 - Math.sqrt(d2) / CONNECT_DIST;
          lcArr[base] = colors[i * 3] * alpha;     lcArr[base + 1] = colors[i * 3 + 1] * alpha; lcArr[base + 2] = colors[i * 3 + 2] * alpha;
          lcArr[base + 3] = colors[j * 3] * alpha; lcArr[base + 4] = colors[j * 3 + 1] * alpha; lcArr[base + 5] = colors[j * 3 + 2] * alpha;
          lineIdx++;
        }
      }
    }
    lineGeo.setDrawRange(0, lineIdx * 2);
    lp.needsUpdate = true;
    lc.needsUpdate = true;
    lineMat.opacity = 0.08 + Math.sin(t * 0.15) * 0.04;
  };

  const dispose = () => {
    particleGeo.dispose(); particleMat.dispose();
    lineGeo.dispose(); lineMat.dispose();
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
  const SEGS = isMobileGeo ? 20 : 40;
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
    opacity: 0.35,
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
      opacity: 0.45,
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
    rippleStrength = 0.5;
  };

  const tick = (t: number) => {
    // Scroll-reactive boost
    const sv = Math.min(Math.abs(scrollVelocity) * 0.3, 1.0);
    const waveBoost = 1.0 + sv * 1.5;
    const opacityBoost = sv * 0.08;

    // Camera tilt reacts to scroll
    camera.position.y = 25 + scrollVelocity * 0.006;
    camera.rotation.x = -0.35 + scrollVelocity * 0.0002;

    // Grid undulation — gentle waves, boosted by scroll
    const pos = gridGeo.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;

    for (let i = 0; i < arr.length / 3; i++) {
      const ox = origPos[i * 3];
      const oz = origPos[i * 3 + 2];
      let y = (Math.sin(ox * 0.06 + t * 0.3) * 2.5
            + Math.cos(oz * 0.08 + t * 0.2) * 1.8
            + Math.sin((ox + oz) * 0.04 + t * 0.12) * 1.0) * waveBoost;
      // Mouse ripple — smooth
      if (rippleStrength > 0.01) {
        const dist = Math.sqrt((ox - rippleX) ** 2 + (oz - rippleY) ** 2);
        y += Math.sin(dist * 0.15 - t * 2) * Math.exp(-dist * 0.025) * 3 * rippleStrength;
      }
      arr[i * 3 + 1] = y;
    }
    pos.needsUpdate = true;
    rippleStrength *= 0.985;

    // Grid opacity pulse + scroll boost
    gridMat.opacity = 0.3 + Math.sin(t * 0.2) * 0.08 + opacityBoost;

    // Float + rotate shapes — scroll makes them spin faster
    const rotBoost = 1.0 + sv * 2.5;
    for (const s of shapes) {
      s.mesh.position.y = s.baseY + Math.sin(t * s.floatSpeed * 0.6 + s.phase) * s.floatAmp;
      s.mesh.rotation.x += s.rotSpeed.x * 0.005 * rotBoost;
      s.mesh.rotation.y += s.rotSpeed.y * 0.005 * rotBoost;
      s.mesh.rotation.z += s.rotSpeed.z * 0.01 * rotBoost;
      const m = s.mesh.material as THREE.MeshBasicMaterial;
      m.opacity = 0.2 + Math.sin(t * 0.8 + s.phase) * 0.12 + opacityBoost;
    }

    // Accent line opacity shimmer
    for (let i = 0; i < accentLines.length; i++) {
      const m = accentLines[i].material as THREE.LineBasicMaterial;
      m.opacity = 0.04 + Math.sin(t * 0.3 + i * 1.5) * 0.03 + opacityBoost * 0.5;
    }
  };

  const dispose = () => {
    gridGeo.dispose(); gridMat.dispose();
    for (const s of shapes) { s.mesh.geometry.dispose(); (s.mesh.material as THREE.Material).dispose(); }
    for (const l of accentLines) { l.geometry.dispose(); (l.material as THREE.Material).dispose(); }
  };
  return { scene, camera, dispose, onMouse, tick };
}

// ── EXTREME: Chaotic Rainbow Wireframe Grid ────────────────────────────────
function buildExtremeScene(w: number, h: number): SceneBundle {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 1000);
  camera.position.set(0, 30, 65);
  camera.lookAt(0, -5, 0);

  // Rainbow cycling grid — denser, wilder
  const SEGS = isMobileGeo ? 30 : 60;
  const gridGeo = new THREE.PlaneGeometry(200, 160, SEGS, SEGS);
  gridGeo.rotateX(-Math.PI / 2.5);

  const gridVertCount = (SEGS + 1) * (SEGS + 1);
  const gridColors = new Float32Array(gridVertCount * 3);
  // Initial rainbow spread
  for (let i = 0; i < gridVertCount; i++) {
    const hue = (i / gridVertCount) * 360;
    const c = new THREE.Color().setHSL(hue / 360, 1.0, 0.5);
    gridColors[i * 3] = c.r; gridColors[i * 3 + 1] = c.g; gridColors[i * 3 + 2] = c.b;
  }
  gridGeo.setAttribute('color', new THREE.BufferAttribute(gridColors, 3));

  const gridMat = new THREE.MeshBasicMaterial({
    wireframe: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.22,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const gridMesh = new THREE.Mesh(gridGeo, gridMat);
  gridMesh.position.y = -15;
  scene.add(gridMesh);

  const origPos = new Float32Array((gridGeo.attributes.position as THREE.BufferAttribute).array);

  // More floating shapes — chaotic
  interface FloatingShape {
    mesh: THREE.Mesh;
    baseY: number;
    baseX: number;
    phase: number;
    rotSpeed: THREE.Vector3;
    floatSpeed: number;
    floatAmp: number;
    driftSpeed: number;
  }
  const shapes: FloatingShape[] = [];
  const geometries = [
    () => new THREE.IcosahedronGeometry(3.5, 1),
    () => new THREE.OctahedronGeometry(3, 0),
    () => new THREE.TorusKnotGeometry(2.5, 0.8, 48, 8),
    () => new THREE.TetrahedronGeometry(3, 0),
    () => new THREE.DodecahedronGeometry(3, 0),
    () => new THREE.TorusGeometry(3, 0.8, 8, 12),
    () => new THREE.BoxGeometry(3.5, 3.5, 3.5),
    () => new THREE.CylinderGeometry(0, 3.5, 5, 5),
    () => new THREE.OctahedronGeometry(2.5, 2),
    () => new THREE.IcosahedronGeometry(2, 2),
    () => new THREE.TorusKnotGeometry(2, 0.6, 32, 4, 3, 2),
    () => new THREE.SphereGeometry(2.5, 8, 6),
  ];

  for (let i = 0; i < 12; i++) {
    const g = geometries[i]();
    const m = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL((i / 12), 1.0, 0.55),
      wireframe: true,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(g, m);
    const x = (Math.random() - 0.5) * 120;
    const y = Math.random() * 30 + 5;
    const z = (Math.random() - 0.5) * 60 - 10;
    mesh.position.set(x, y, z);
    scene.add(mesh);
    shapes.push({
      mesh,
      baseY: y,
      baseX: x,
      phase: Math.random() * Math.PI * 2,
      rotSpeed: new THREE.Vector3(
        (Math.random() - 0.5) * 1.2,
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 0.8,
      ),
      floatSpeed: 0.3 + Math.random() * 0.8,
      floatAmp: 4 + Math.random() * 7,
      driftSpeed: (Math.random() - 0.5) * 0.3,
    });
  }

  // Accent lines — more, rainbow
  const accentLines: THREE.Line[] = [];
  for (let i = 0; i < 10; i++) {
    const lg = new THREE.BufferGeometry();
    const x = (Math.random() - 0.5) * 140;
    const z = -20 - Math.random() * 50;
    const pts = [new THREE.Vector3(x, -30, z), new THREE.Vector3(x, 60, z)];
    lg.setFromPoints(pts);
    const lm = new THREE.LineBasicMaterial({
      color: new THREE.Color().setHSL(i / 10, 1.0, 0.5),
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const line = new THREE.Line(lg, lm);
    scene.add(line);
    accentLines.push(line);
  }

  let rippleX = 0, rippleY = 0, rippleStrength = 0;

  const onMouse = (x: number, y: number) => {
    rippleX = x * 100;
    rippleY = y * 80;
    rippleStrength = 0.8;
  };

  const tick = (t: number) => {
    // Scroll-reactive boost — extreme goes harder
    const sv = Math.min(Math.abs(scrollVelocity) * 0.3, 1.0);
    const waveBoost = 1.0 + sv * 2.5;
    const opacityBoost = sv * 0.1;

    // Camera tilt — aggressive on extreme
    camera.position.y = 30 + scrollVelocity * 0.01;
    camera.rotation.x = -0.4 + scrollVelocity * 0.0004;

    // Grid undulation — layered waves, boosted by scroll
    const pos = gridGeo.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;

    for (let i = 0; i < arr.length / 3; i++) {
      const ox = origPos[i * 3];
      const oz = origPos[i * 3 + 2];
      let y = (Math.sin(ox * 0.04 + t * 0.45) * 4.5
            + Math.cos(oz * 0.06 + t * 0.3) * 3.2
            + Math.sin((ox + oz) * 0.03 + t * 0.18) * 2.2
            + Math.sin(ox * 0.15 + t * 0.9) * 1.0
            + Math.cos(oz * 0.12 + t * 0.7) * 0.8) * waveBoost;
      // Mouse ripple — still strong for extreme but smoother
      if (rippleStrength > 0.01) {
        const dist = Math.sqrt((ox - rippleX) ** 2 + (oz - rippleY) ** 2);
        y += Math.sin(dist * 0.12 - t * 3) * Math.exp(-dist * 0.015) * 6 * rippleStrength;
      }
      arr[i * 3 + 1] = y;
    }
    pos.needsUpdate = true;
    rippleStrength *= 0.985;

    // Rainbow cycle the grid colors — faster when scrolling (reuse single Color)
    const colorSpeed = 12 + sv * 30;
    const colorAttr = gridGeo.attributes.color as THREE.BufferAttribute;
    const cArr = colorAttr.array as Float32Array;
    for (let i = 0; i < gridVertCount; i++) {
      const hue = ((i / gridVertCount) * 360 + t * colorSpeed) % 360;
      tmpColor.setHSL(hue / 360, 1.0, 0.5);
      cArr[i * 3] = tmpColor.r; cArr[i * 3 + 1] = tmpColor.g; cArr[i * 3 + 2] = tmpColor.b;
    }
    colorAttr.needsUpdate = true;

    // Grid opacity pulse + scroll boost
    gridMat.opacity = 0.18 + Math.sin(t * 0.35) * 0.06 + opacityBoost;

    // Float, rotate, drift shapes — scroll cranks rotation
    const rotBoost = 1.0 + sv * 4.0;
    for (let si = 0; si < shapes.length; si++) {
      const s = shapes[si];
      s.mesh.position.y = s.baseY + Math.sin(t * s.floatSpeed * 0.5 + s.phase) * s.floatAmp;
      s.mesh.position.x = s.baseX + Math.sin(t * s.driftSpeed * 0.5 + s.phase) * 10;
      s.mesh.rotation.x += s.rotSpeed.x * 0.007 * rotBoost;
      s.mesh.rotation.y += s.rotSpeed.y * 0.007 * rotBoost;
      s.mesh.rotation.z += s.rotSpeed.z * 0.007 * rotBoost;
      const m = s.mesh.material as THREE.MeshBasicMaterial;
      m.opacity = 0.3 + Math.sin(t * 0.5 + s.phase) * 0.15 + opacityBoost;
      // Rainbow cycle each shape — faster when scrolling (reuse tmpColor)
      tmpColor.setHSL(((si / shapes.length) * 360 + t * (20 + sv * 40)) % 360 / 360, 1.0, 0.55);
      m.color.copy(tmpColor);
    }

    // Accent line shimmer + color cycle
    for (let i = 0; i < accentLines.length; i++) {
      const m = accentLines[i].material as THREE.LineBasicMaterial;
      m.opacity = 0.07 + Math.sin(t * 0.3 + i * 0.9) * 0.04 + opacityBoost * 0.5;
      tmpColor.setHSL(((i / accentLines.length) * 360 + t * 15) % 360 / 360, 1.0, 0.5);
      m.color.copy(tmpColor);
    }
  };

  const dispose = () => {
    gridGeo.dispose(); gridMat.dispose();
    for (const s of shapes) { s.mesh.geometry.dispose(); (s.mesh.material as THREE.Material).dispose(); }
    for (const l of accentLines) { l.geometry.dispose(); (l.material as THREE.Material).dispose(); }
  };
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

// ── Scroll velocity (fed by Lenis) ─────────────────────────────────────────
export let scrollVelocity = 0;
export let scrollProgress = 0;

export function setScrollData(velocity: number, progress: number) {
  // Clamp velocity to prevent wild camera/grid jumps
  scrollVelocity = Math.max(-300, Math.min(300, velocity));
  scrollProgress = progress;
}

// ── Animation loop (throttled on mobile) ───────────────────────────────────
let lastFrameTime = 0;
const TARGET_FPS_MOBILE = 30;
const FRAME_INTERVAL_MOBILE = 1000 / TARGET_FPS_MOBILE;
let isMobileDevice = false;

function animate(t: number) {
  animId = requestAnimationFrame(animate);

  if (!isVisible || !renderer || !current) return;

  // Throttle to 30fps on mobile to save battery/GPU
  if (isMobileDevice) {
    const delta = t - lastFrameTime;
    if (delta < FRAME_INTERVAL_MOBILE) return;
    lastFrameTime = t - (delta % FRAME_INTERVAL_MOBILE);
  }

  const ts = t * 0.001; // seconds
  current.tick(ts);

  renderer.render(current.scene, current.camera);
}

// ── CSS bloom approximation (replaces EffectComposer/UnrealBloomPass) ──────
const CSS_BLOOM: Record<string, string> = {
  dark:    'blur(0px) brightness(1.25)',
  extreme: 'blur(0px) brightness(1.4)',
  light:   'blur(0px) brightness(1.0)',
};
function applyCSSBloom(el: HTMLCanvasElement, theme: Theme) {
  el.style.filter = CSS_BLOOM[theme] ?? CSS_BLOOM.dark;
}

// ── Swap scene on theme change ─────────────────────────────────────────────
function swapScene(theme: Theme) {
  if (theme === activeTheme) return;
  activeTheme = theme;
  if (current) { current.dispose(); current = null; }
  current = buildScene(theme);
  if (current && canvas) applyCSSBloom(canvas, theme);
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
  isMobileDevice = w < 768;
  renderer.setPixelRatio(isMobileDevice ? 1.0 : Math.min(window.devicePixelRatio, 1.5));
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
  // Cap DPR: 1.0 on mobile (< 768px), 1.5 on desktop — saves massive GPU work
  isMobileDevice = window.innerWidth < 768;
  renderer.setPixelRatio(isMobileDevice ? 1.0 : Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  // Apply CSS bloom approximation immediately (no GPU post-processing needed)
  applyCSSBloom(canvas, detectTheme());

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
