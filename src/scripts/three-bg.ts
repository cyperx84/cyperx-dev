/**
 * three-bg.ts — CyperX.dev Three.js background scenes
 * One file handles all 3 themes with distinct visual personalities.
 * Dark: wireframe grid (glowing) | Light: wireframe grid (soft) | Extreme: wireframe grid (rainbow chaos)
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

// ── DARK: Wireframe Grid (dark variant of light mesh) ──────────────────────
function buildDarkScene(w: number, h: number): SceneBundle {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 1000);
  camera.position.set(0, 25, 70);
  camera.lookAt(0, -5, 0);

  // Ground grid — green-to-pink gradient, additive glow on black
  const SEGS = 50;
  const gridGeo = new THREE.PlaneGeometry(180, 140, SEGS, SEGS);
  gridGeo.rotateX(-Math.PI / 2.5);

  const gridVertCount = (SEGS + 1) * (SEGS + 1);
  const gridColors = new Float32Array(gridVertCount * 3);
  const greenC = new THREE.Color('#39FF14');
  const pinkC  = new THREE.Color('#FF51FA');
  const purpC  = new THREE.Color('#AC89FF');
  for (let i = 0; i < gridVertCount; i++) {
    const t = i / gridVertCount;
    const c = t < 0.5
      ? new THREE.Color().lerpColors(greenC, pinkC, t * 2)
      : new THREE.Color().lerpColors(pinkC, purpC, (t - 0.5) * 2);
    gridColors[i * 3] = c.r; gridColors[i * 3 + 1] = c.g; gridColors[i * 3 + 2] = c.b;
  }
  gridGeo.setAttribute('color', new THREE.BufferAttribute(gridColors, 3));

  const gridMat = new THREE.MeshBasicMaterial({
    wireframe: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.18,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const gridMesh = new THREE.Mesh(gridGeo, gridMat);
  gridMesh.position.y = -15;
  scene.add(gridMesh);

  const origPos = new Float32Array((gridGeo.attributes.position as THREE.BufferAttribute).array);

  // Floating wireframe shapes — glowing on black
  interface FloatingShape {
    mesh: THREE.Mesh;
    baseY: number;
    phase: number;
    rotSpeed: THREE.Vector3;
    floatSpeed: number;
    floatAmp: number;
  }
  const shapes: FloatingShape[] = [];
  const shapeColors = [0x39FF14, 0xFF51FA, 0xAC89FF, 0x39FF14, 0xFF51FA, 0xAC89FF, 0x39FF14, 0xFF51FA, 0xAC89FF];
  const geometries = [
    () => new THREE.OctahedronGeometry(3, 0),
    () => new THREE.TetrahedronGeometry(2.5, 0),
    () => new THREE.IcosahedronGeometry(2.5, 0),
    () => new THREE.BoxGeometry(3, 3, 3),
    () => new THREE.OctahedronGeometry(2, 1),
    () => new THREE.TorusGeometry(2.5, 0.7, 6, 8),
    () => new THREE.DodecahedronGeometry(2.5, 0),
    () => new THREE.CylinderGeometry(0, 3, 4, 4),
    () => new THREE.TorusKnotGeometry(1.8, 0.5, 32, 6),
  ];

  for (let i = 0; i < 9; i++) {
    const g = geometries[i]();
    const m = new THREE.MeshBasicMaterial({
      color: shapeColors[i],
      wireframe: true,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(g, m);
    const x = (Math.random() - 0.5) * 100;
    const y = Math.random() * 25 + 5;
    const z = (Math.random() - 0.5) * 50 - 10;
    mesh.position.set(x, y, z);
    scene.add(mesh);
    shapes.push({
      mesh,
      baseY: y,
      phase: Math.random() * Math.PI * 2,
      rotSpeed: new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.7,
        (Math.random() - 0.5) * 0.4,
      ),
      floatSpeed: 0.2 + Math.random() * 0.5,
      floatAmp: 3 + Math.random() * 5,
    });
  }

  // Vertical accent lines — glowing pillars
  const accentLines: THREE.Line[] = [];
  for (let i = 0; i < 7; i++) {
    const lg = new THREE.BufferGeometry();
    const x = (Math.random() - 0.5) * 120;
    const z = -20 - Math.random() * 40;
    const pts = [new THREE.Vector3(x, -25, z), new THREE.Vector3(x, 50, z)];
    lg.setFromPoints(pts);
    const lm = new THREE.LineBasicMaterial({
      color: i % 3 === 0 ? 0x39FF14 : i % 3 === 1 ? 0xFF51FA : 0xAC89FF,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const line = new THREE.Line(lg, lm);
    scene.add(line);
    accentLines.push(line);
  }

  let rippleX = 0, rippleY = 0, rippleStrength = 0;

  const onMouse = (x: number, y: number) => {
    rippleX = x * 90;
    rippleY = y * 70;
    rippleStrength = 1;
  };

  const tick = (t: number) => {
    // Grid undulation — more aggressive than light theme
    const pos = gridGeo.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;

    for (let i = 0; i < arr.length / 3; i++) {
      const ox = origPos[i * 3];
      const oz = origPos[i * 3 + 2];
      let y = Math.sin(ox * 0.05 + t * 0.7) * 4.5
            + Math.cos(oz * 0.07 + t * 0.5) * 3.5
            + Math.sin((ox + oz) * 0.03 + t * 0.3) * 2.0
            + Math.sin(ox * 0.12 + oz * 0.08 + t * 1.2) * 1.2;
      // Mouse ripple — stronger on dark
      if (rippleStrength > 0.01) {
        const dist = Math.sqrt((ox - rippleX) ** 2 + (oz - rippleY) ** 2);
        y += Math.sin(dist * 0.18 - t * 6) * Math.exp(-dist * 0.015) * 7 * rippleStrength;
      }
      arr[i * 3 + 1] = y;
    }
    pos.needsUpdate = true;
    rippleStrength *= 0.993;

    // Grid opacity pulse — breathing glow
    gridMat.opacity = 0.15 + Math.sin(t * 0.4) * 0.06;

    // Float + rotate shapes
    for (const s of shapes) {
      s.mesh.position.y = s.baseY + Math.sin(t * s.floatSpeed + s.phase) * s.floatAmp;
      s.mesh.rotation.x += s.rotSpeed.x * 0.012;
      s.mesh.rotation.y += s.rotSpeed.y * 0.012;
      s.mesh.rotation.z += s.rotSpeed.z * 0.012;
      const m = s.mesh.material as THREE.MeshBasicMaterial;
      m.opacity = 0.25 + Math.sin(t * 0.7 + s.phase) * 0.15;
    }

    // Accent line shimmer
    for (let i = 0; i < accentLines.length; i++) {
      const m = accentLines[i].material as THREE.LineBasicMaterial;
      m.opacity = 0.06 + Math.sin(t * 0.35 + i * 1.2) * 0.04;
    }
  };

  const dispose = () => {
    gridGeo.dispose(); gridMat.dispose();
    for (const s of shapes) { s.mesh.geometry.dispose(); (s.mesh.material as THREE.Material).dispose(); }
    for (const l of accentLines) { l.geometry.dispose(); (l.material as THREE.Material).dispose(); }
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

// ── EXTREME: Chaotic Rainbow Wireframe Grid ────────────────────────────────
function buildExtremeScene(w: number, h: number): SceneBundle {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 1000);
  camera.position.set(0, 30, 65);
  camera.lookAt(0, -5, 0);

  // Rainbow cycling grid — denser, wilder
  const SEGS = 60;
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
    rippleStrength = 1.5; // extra strong
  };

  const tick = (t: number) => {
    // Grid undulation — chaotic layered waves
    const pos = gridGeo.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;

    for (let i = 0; i < arr.length / 3; i++) {
      const ox = origPos[i * 3];
      const oz = origPos[i * 3 + 2];
      let y = Math.sin(ox * 0.04 + t * 0.9) * 5.5
            + Math.cos(oz * 0.06 + t * 0.6) * 4.0
            + Math.sin((ox + oz) * 0.03 + t * 0.35) * 3.0
            + Math.sin(ox * 0.15 + t * 2.0) * 1.5
            + Math.cos(oz * 0.12 + t * 1.6) * 1.2;
      // Mouse ripple — massive
      if (rippleStrength > 0.01) {
        const dist = Math.sqrt((ox - rippleX) ** 2 + (oz - rippleY) ** 2);
        y += Math.sin(dist * 0.15 - t * 8) * Math.exp(-dist * 0.012) * 10 * rippleStrength;
      }
      arr[i * 3 + 1] = y;
    }
    pos.needsUpdate = true;
    rippleStrength *= 0.99;

    // Rainbow cycle the grid colors
    const colorAttr = gridGeo.attributes.color as THREE.BufferAttribute;
    const cArr = colorAttr.array as Float32Array;
    for (let i = 0; i < gridVertCount; i++) {
      const hue = ((i / gridVertCount) * 360 + t * 30) % 360;
      const c = new THREE.Color().setHSL(hue / 360, 1.0, 0.5);
      cArr[i * 3] = c.r; cArr[i * 3 + 1] = c.g; cArr[i * 3 + 2] = c.b;
    }
    colorAttr.needsUpdate = true;

    // Grid opacity pulse
    gridMat.opacity = 0.18 + Math.sin(t * 0.6) * 0.08;

    // Float, rotate, drift shapes + rainbow cycle their colors
    for (let si = 0; si < shapes.length; si++) {
      const s = shapes[si];
      s.mesh.position.y = s.baseY + Math.sin(t * s.floatSpeed + s.phase) * s.floatAmp;
      s.mesh.position.x = s.baseX + Math.sin(t * s.driftSpeed + s.phase) * 10;
      s.mesh.rotation.x += s.rotSpeed.x * 0.015;
      s.mesh.rotation.y += s.rotSpeed.y * 0.015;
      s.mesh.rotation.z += s.rotSpeed.z * 0.015;
      const m = s.mesh.material as THREE.MeshBasicMaterial;
      m.opacity = 0.3 + Math.sin(t * 0.9 + s.phase) * 0.18;
      // Rainbow cycle each shape
      const hue = ((si / shapes.length) * 360 + t * 50) % 360;
      m.color.setHSL(hue / 360, 1.0, 0.55);
    }

    // Accent line shimmer + color cycle
    for (let i = 0; i < accentLines.length; i++) {
      const m = accentLines[i].material as THREE.LineBasicMaterial;
      m.opacity = 0.07 + Math.sin(t * 0.5 + i * 0.9) * 0.05;
      const hue = ((i / accentLines.length) * 360 + t * 40) % 360;
      m.color.setHSL(hue / 360, 1.0, 0.5);
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
