import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildTreeSceneAsset, disposeTreeGroup } from '../engine/treeGenerator';
import {
  BackdropMode,
  CameraPreset,
  EcoMetrics,
  MeshStats,
  PollinatorActivity,
  SpeciesProfile,
  TreeParams,
  ViewMode,
} from '../engine/types';

interface TreeViewportProps {
  params: TreeParams;
  backdrop: BackdropMode;
  showGrid: boolean;
  wireframe: boolean;
  autoRotate: boolean;
  ecoOverlay: boolean;
  ecoMetrics: EcoMetrics;
  pollinators: PollinatorActivity;
  cameraPreset: CameraPreset;
  cameraTrigger: number;
  onAssetReady: (
    group: THREE.Group,
    profile: SpeciesProfile,
    stats: MeshStats,
    mixProfiles: SpeciesProfile[]
  ) => void;
}

const BACKDROP_CONFIG: Record<
  BackdropMode,
  { bg: string; ground: string; grid1: number; grid2: number; hemiSky: number; hemiGround: number }
> = {
  [BackdropMode.Mint]: {
    bg: '#9AD8CE',
    ground: '#8CCAC0',
    grid1: 0x5c9a90,
    grid2: 0x76b5ab,
    hemiSky: 0xe6f8f5,
    hemiGround: 0x5f8f86,
  },
  [BackdropMode.Daylight]: {
    bg: '#EAECEF',
    ground: '#DFE3E8',
    grid1: 0x94a3b8,
    grid2: 0xcbd5e1,
    hemiSky: 0xf8fafc,
    hemiGround: 0x94a3b8,
  },
  [BackdropMode.Slate]: {
    bg: '#161C24',
    ground: '#1D2530',
    grid1: 0x3b495c,
    grid2: 0x283342,
    hemiSky: 0xcbd5e1,
    hemiGround: 0x1e293b,
  },
};

function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  grad.addColorStop(0.0, 'rgba(15, 23, 42, 0.55)');
  grad.addColorStop(0.45, 'rgba(15, 23, 42, 0.25)');
  grad.addColorStop(1.0, 'rgba(15, 23, 42, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createShadeFootprintTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  grad.addColorStop(0.0, 'rgba(13, 148, 136, 0.56)');
  grad.addColorStop(0.55, 'rgba(20, 184, 166, 0.28)');
  grad.addColorStop(0.85, 'rgba(45, 212, 191, 0.10)');
  grad.addColorStop(1.0, 'rgba(45, 212, 191, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

const FLUX_COUNT = 36;
const _desiredPos = new THREE.Vector3();
const _desiredTarget = new THREE.Vector3();
const _fluxMat4 = new THREE.Matrix4();
const _fluxPos = new THREE.Vector3();
const _fluxQuat = new THREE.Quaternion();
const _fluxEuler = new THREE.Euler();
const _fluxScale = new THREE.Vector3();
const _co2Color = new THREE.Color('#F59E0B');
const _o2Color = new THREE.Color('#2DD4BF');

function updateFluxInstances(
  mesh: THREE.InstancedMesh,
  phase: number,
  spreadR: number,
  treeH: number,
  activeLAI: number
) {
  const activeRatio = THREE.MathUtils.clamp(activeLAI / 3.4, 0.2, 1.0);
  const activePerStream = Math.max(4, Math.round((FLUX_COUNT / 2) * activeRatio));
  const half = FLUX_COUNT / 2;

  for (let i = 0; i < FLUX_COUNT; i++) {
    const isO2 = i >= half;
    const streamIdx = isO2 ? i - half : i;

    if (streamIdx >= activePerStream) {
      _fluxScale.set(0, 0, 0);
      _fluxPos.set(0, -10, 0);
      _fluxQuat.identity();
      _fluxMat4.compose(_fluxPos, _fluxQuat, _fluxScale);
      mesh.setMatrixAt(i, _fluxMat4);
      continue;
    }

    const offset = streamIdx / activePerStream;
    const t = (phase + offset) % 1;
    const angle = streamIdx * 2.39996 + (isO2 ? phase * 0.9 : -phase * 1.15);

    if (!isO2) {
      // CO2 amber motes drawn inward & up from outer air into canopy
      const r = THREE.MathUtils.lerp(spreadR * 1.45, spreadR * 0.25, t);
      const y = THREE.MathUtils.lerp(treeH * 0.22, treeH * 0.74, t);
      _fluxPos.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
    } else {
      // O2 cyan-mint motes rising from canopy
      const r = THREE.MathUtils.lerp(spreadR * 0.28, spreadR * 1.1, t);
      const y = THREE.MathUtils.lerp(treeH * 0.56, treeH * 1.14, t);
      _fluxPos.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
    }

    const fade = Math.sin(t * Math.PI);
    const s = Math.max(0.01, fade * THREE.MathUtils.clamp(treeH * 0.085, 0.55, 1.45));
    _fluxEuler.set(phase * 1.7 + i, phase * 1.2 + i * 0.5, 0);
    _fluxQuat.setFromEuler(_fluxEuler);
    _fluxScale.set(s, s, s);
    _fluxMat4.compose(_fluxPos, _fluxQuat, _fluxScale);
    mesh.setMatrixAt(i, _fluxMat4);
  }

  mesh.instanceMatrix.needsUpdate = true;
}

const MAX_BUTTERFLIES = 10;
const MAX_BEES = 14;
const BUTTERFLY_COLORS = [0xf97316, 0xfacc15, 0x38bdf8, 0xf472b6, 0xfb923c];

interface ButterflyActor {
  root: THREE.Group;
  leftWing: THREE.Mesh;
  rightWing: THREE.Mesh;
}

interface BeeActor {
  root: THREE.Group;
  leftWing: THREE.Mesh;
  rightWing: THREE.Mesh;
}

function createRingLabelMesh(
  text: string,
  accentHex: string,
  isDark: boolean,
  scaleW: number
): THREE.Mesh {
  const w = 320;
  const h = 76;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.86)' : 'rgba(255, 255, 255, 0.92)';
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 3;

  const r = 16;
  ctx.beginPath();
  ctx.moveTo(r, 4);
  ctx.lineTo(w - r, 4);
  ctx.quadraticCurveTo(w - 4, 4, w - 4, r);
  ctx.lineTo(w - 4, h - r);
  ctx.quadraticCurveTo(w - 4, h - 4, w - r, h - 4);
  ctx.lineTo(r, h - 4);
  ctx.quadraticCurveTo(4, h - 4, 4, h - r);
  ctx.lineTo(4, r);
  ctx.quadraticCurveTo(4, 4, r, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Left color dot
  ctx.fillStyle = accentHex;
  ctx.beginPath();
  ctx.arc(28, h / 2, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = isDark ? '#F8FAFC' : '#0F172A';
  ctx.font = '700 26px "JetBrains Mono", ui-monospace, monospace';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 48, h / 2 + 1);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;

  const geo = new THREE.PlaneGeometry(scaleW, scaleW * (h / w));
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -5,
    polygonOffsetUnits: -5,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 0.028;
  return mesh;
}

function updatePollinatorActors(
  butterflies: ButterflyActor[],
  bees: BeeActor[],
  phase: number,
  anchors: Array<{ x: number; z: number; radius: number }>,
  treeH: number,
  butterflyCount: number,
  beeCount: number,
  active: boolean
) {
  const fallbackAnchor = { x: 0, z: 0, radius: 2.2 };
  const anchorLen = Math.max(1, anchors.length);

  for (let i = 0; i < butterflies.length; i++) {
    const actor = butterflies[i];
    if (!active || i >= butterflyCount) {
      actor.root.visible = false;
      continue;
    }
    actor.root.visible = true;
    const anchor = anchors[i % anchorLen] ?? fallbackAnchor;
    const speed = 0.48 + (i % 3) * 0.12;
    const theta = phase * speed + i * 2.15;
    const orbitR = Math.max(1.0, anchor.radius * (0.72 + (i % 4) * 0.16));
    const x = anchor.x + Math.cos(theta) * orbitR + Math.sin(theta * 2.1) * 0.35;
    const z = anchor.z + Math.sin(theta) * orbitR + Math.cos(theta * 1.7) * 0.35;
    const y = treeH * (0.44 + ((i * 0.17) % 0.42)) + Math.sin(phase * 2.2 + i) * 0.38;

    actor.root.position.set(x, y, z);
    actor.root.rotation.y = -theta;
    const flap = Math.sin(phase * 13.5 + i * 1.7) * 0.85;
    actor.leftWing.rotation.z = flap;
    actor.rightWing.rotation.z = -flap;
  }

  for (let i = 0; i < bees.length; i++) {
    const actor = bees[i];
    if (!active || i >= beeCount) {
      actor.root.visible = false;
      continue;
    }
    actor.root.visible = true;
    const anchor = anchors[(i * 2) % anchorLen] ?? fallbackAnchor;
    const speed = 1.25 + (i % 4) * 0.22;
    const theta = -phase * speed + i * 1.618;
    const orbitR = Math.max(0.75, anchor.radius * (0.55 + (i % 3) * 0.18));
    const x = anchor.x + Math.cos(theta) * orbitR;
    const z = anchor.z + Math.sin(theta * 1.5) * orbitR * 0.85;
    const y = treeH * (0.38 + ((i * 0.13) % 0.46)) + Math.sin(phase * 5.2 + i) * 0.18;

    actor.root.position.set(x, y, z);
    actor.root.rotation.y = -theta + Math.PI * 0.5;
    const buzz = Math.sin(phase * 38.0 + i * 2.3) * 0.68;
    actor.leftWing.rotation.z = 0.3 + buzz;
    actor.rightWing.rotation.z = -(0.3 + buzz);
  }
}

export function TreeViewport({
  params,
  backdrop,
  showGrid,
  wireframe,
  autoRotate,
  ecoOverlay,
  ecoMetrics,
  pollinators,
  cameraPreset,
  cameraTrigger,
  onAssetReady,
}: TreeViewportProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [contextLost, setContextLost] = useState(false);
  const [assetVersion, setAssetVersion] = useState(0);

  const onAssetReadyRef = useRef(onAssetReady);
  onAssetReadyRef.current = onAssetReady;
  const anchorsRef = useRef<Array<{ x: number; z: number; radius: number }>>([]);
  const statsRef = useRef<MeshStats>({
    triangles: 0,
    vertices: 0,
    parts: 0,
    heightM: params.heightM,
    widthM: 4,
    treeCount: 1,
  });

  const sceneRefs = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    hemiLight: THREE.HemisphereLight;
    keyLight: THREE.DirectionalLight;
    groundMesh: THREE.Mesh;
    gridHelper: THREE.GridHelper;
    shadowGroup: THREE.Group;
    shadowMat: THREE.MeshBasicMaterial;
    ecoGroup: THREE.Group;
    shadeTex: THREE.CanvasTexture;
    shadeMat: THREE.MeshBasicMaterial;
    fluxMesh: THREE.InstancedMesh;
    fluxGeo: THREE.BufferGeometry;
    fluxMat: THREE.MeshBasicMaterial;
    fluxActive: boolean;
    fluxSpreadR: number;
    fluxTreeH: number;
    fluxLai: number;
    fluxPhase: number;
    ecoOverlay: boolean;
    pollinatorGroup: THREE.Group;
    butterflies: ButterflyActor[];
    bees: BeeActor[];
    pollinatorActive: boolean;
    pollinatorButterflyCount: number;
    pollinatorBeeCount: number;
    pollinatorPhase: number;
    treeContainer: THREE.Group;
    currentTree: THREE.Group | null;
    isSoftwareGl: boolean;
    requestRender: () => void;
    transitionActive: boolean;
    targetCamPos: THREE.Vector3;
    targetLookAt: THREE.Vector3;
    autoRotate: boolean;
    wireframe: boolean;
  } | null>(null);

  // Initialize Three.js WebGL scene once
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setContextLost(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    container.appendChild(renderer.domElement);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const onContextRestored = () => {
      setContextLost(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    const scene = new THREE.Scene();
    const initCfg = BACKDROP_CONFIG[backdrop];
    scene.background = new THREE.Color(initCfg.bg);
    scene.fog = new THREE.FogExp2(initCfg.bg, 0.011);

    // Mandatory studio environment reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(
      42,
      Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight),
      0.1,
      450
    );
    camera.position.set(16, 12, 22);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 2.5;
    controls.maxDistance = 120;
    controls.maxPolarAngle = Math.PI * 0.495;
    controls.target.set(0, 6.0, 0);
    controls.update();

    // 3-Point Studio Daylight Rig
    const hemiLight = new THREE.HemisphereLight(
      initCfg.hemiSky,
      initCfg.hemiGround,
      0.75
    );
    hemiLight.position.set(0, 40, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff4e0, 2.05);
    keyLight.position.set(22, 38, 26);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 2;
    keyLight.shadow.camera.far = 120;
    const d = 28;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xd9f2ff, 0.65);
    rimLight.position.set(-14, 12, -16);
    scene.add(rimLight);

    // Horizon-blending ground plane
    const groundGeo = new THREE.CircleGeometry(140, 64);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: initCfg.ground,
      roughness: 0.95,
      metalness: 0.0,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.position.y = 0;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // 1m Scale Grid (game engine reference)
    const gridHelper = new THREE.GridHelper(60, 60, initCfg.grid1, initCfg.grid2);
    gridHelper.position.y = 0.012;
    const gridMats = Array.isArray(gridHelper.material)
      ? gridHelper.material
      : [gridHelper.material];
    gridMats.forEach((m) => {
      m.transparent = true;
      m.opacity = 0.42;
      m.polygonOffset = true;
      m.polygonOffsetFactor = -1;
      m.polygonOffsetUnits = -1;
    });
    scene.add(gridHelper);

    // Contact shadow group
    const shadowTex = createContactShadowTexture();
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.45,
    });
    const shadowGroup = new THREE.Group();
    scene.add(shadowGroup);

    // Ecological visualization group (strictly excluded from treeContainer exports)
    const ecoGroup = new THREE.Group();
    ecoGroup.visible = ecoOverlay;
    scene.add(ecoGroup);

    const shadeTex = createShadeFootprintTexture();
    const shadeMat = new THREE.MeshBasicMaterial({
      map: shadeTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.68,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });

    const fluxGeo = new THREE.OctahedronGeometry(0.11, 0);
    const fluxMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    const fluxMesh = new THREE.InstancedMesh(fluxGeo, fluxMat, FLUX_COUNT);
    fluxMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    for (let i = 0; i < FLUX_COUNT; i++) {
      fluxMesh.setColorAt(i, i >= FLUX_COUNT / 2 ? _o2Color : _co2Color);
    }
    if (fluxMesh.instanceColor) fluxMesh.instanceColor.needsUpdate = true;
    fluxMesh.frustumCulled = false;
    fluxMesh.visible = false;
    scene.add(fluxMesh);

    // Pre-allocated low-poly Butterflies & Bees pool (excluded from exports)
    const pollinatorGroup = new THREE.Group();
    scene.add(pollinatorGroup);

    const wingGeo = new THREE.BufferGeometry();
    wingGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        [
          0, 0, 0.08,
          0.22, 0.05, 0.14,
          0.24, 0.02, -0.04,
          0, 0, 0.08,
          0.24, 0.02, -0.04,
          0.14, -0.02, -0.14,
          0, 0, 0.08,
          0.14, -0.02, -0.14,
          0, 0, -0.08,
        ],
        3
      )
    );
    wingGeo.computeVertexNormals();

    const bfBodyGeo = new THREE.BoxGeometry(0.032, 0.032, 0.18);
    const bfBodyMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
    const bfWingMats = BUTTERFLY_COLORS.map(
      (hex) =>
        new THREE.MeshBasicMaterial({
          color: hex,
          side: THREE.DoubleSide,
        })
    );

    const butterflies: ButterflyActor[] = [];
    for (let i = 0; i < MAX_BUTTERFLIES; i++) {
      const bfRoot = new THREE.Group();
      bfRoot.visible = false;
      const body = new THREE.Mesh(bfBodyGeo, bfBodyMat);
      const wingMat = bfWingMats[i % bfWingMats.length];
      const leftWing = new THREE.Mesh(wingGeo, wingMat);
      const rightWing = new THREE.Mesh(wingGeo, wingMat);
      rightWing.scale.x = -1;
      bfRoot.add(body, leftWing, rightWing);
      bfRoot.scale.setScalar(1.25);
      pollinatorGroup.add(bfRoot);
      butterflies.push({ root: bfRoot, leftWing, rightWing });
    }

    const beeBodyGeo = new THREE.OctahedronGeometry(0.068, 0);
    beeBodyGeo.scale(0.85, 0.85, 1.45);
    const beeStripeGeo = new THREE.BoxGeometry(0.09, 0.085, 0.045);
    const beeWingGeo = new THREE.PlaneGeometry(0.11, 0.055);
    const beeBodyMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const beeStripeMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
    const beeWingMat = new THREE.MeshBasicMaterial({
      color: 0xf8fafc,
      transparent: true,
      opacity: 0.78,
      side: THREE.DoubleSide,
    });

    const bees: BeeActor[] = [];
    for (let i = 0; i < MAX_BEES; i++) {
      const beeRoot = new THREE.Group();
      beeRoot.visible = false;
      const body = new THREE.Mesh(beeBodyGeo, beeBodyMat);
      const stripe = new THREE.Mesh(beeStripeGeo, beeStripeMat);
      const leftWing = new THREE.Mesh(beeWingGeo, beeWingMat);
      leftWing.rotation.x = -Math.PI / 2;
      leftWing.position.set(0.065, 0.045, 0);
      const rightWing = new THREE.Mesh(beeWingGeo, beeWingMat);
      rightWing.rotation.x = -Math.PI / 2;
      rightWing.position.set(-0.065, 0.045, 0);
      beeRoot.add(body, stripe, leftWing, rightWing);
      beeRoot.scale.setScalar(1.25);
      pollinatorGroup.add(beeRoot);
      bees.push({ root: beeRoot, leftWing, rightWing });
    }

    const treeContainer = new THREE.Group();
    scene.add(treeContainer);

    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let disposed = false;
    let lastTime = performance.now();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function requestRender() {
      if (disposed || renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame(() => {
        if (disposed) return;
        renderDirty = false;
        const now = performance.now();
        const delta = Math.min(0.1, (now - lastTime) / 1000);
        lastTime = now;

        const state = sceneRefs.current;
        let keepAnimating = false;

        if (state) {
          if (state.transitionActive) {
            const lambda = 7.5;
            camera.position.x = THREE.MathUtils.damp(
              camera.position.x,
              state.targetCamPos.x,
              lambda,
              delta
            );
            camera.position.y = THREE.MathUtils.damp(
              camera.position.y,
              state.targetCamPos.y,
              lambda,
              delta
            );
            camera.position.z = THREE.MathUtils.damp(
              camera.position.z,
              state.targetCamPos.z,
              lambda,
              delta
            );
            controls.target.x = THREE.MathUtils.damp(
              controls.target.x,
              state.targetLookAt.x,
              lambda,
              delta
            );
            controls.target.y = THREE.MathUtils.damp(
              controls.target.y,
              state.targetLookAt.y,
              lambda,
              delta
            );
            controls.target.z = THREE.MathUtils.damp(
              controls.target.z,
              state.targetLookAt.z,
              lambda,
              delta
            );

            const distPos = camera.position.distanceTo(state.targetCamPos);
            const distTgt = controls.target.distanceTo(state.targetLookAt);
            if (distPos < 0.03 && distTgt < 0.02) {
              camera.position.copy(state.targetCamPos);
              controls.target.copy(state.targetLookAt);
              state.transitionActive = false;
            } else {
              keepAnimating = true;
            }
          }

          if (!isSoftwareGl && state.autoRotate) {
            controls.autoRotate = true;
            controls.autoRotateSpeed = 1.1;
            keepAnimating = true;
          } else {
            controls.autoRotate = false;
          }

          if (state.ecoOverlay && state.fluxActive && !isSoftwareGl) {
            state.fluxPhase = (state.fluxPhase + delta * 0.24) % 1000;
            updateFluxInstances(
              state.fluxMesh,
              state.fluxPhase,
              state.fluxSpreadR,
              state.fluxTreeH,
              state.fluxLai
            );
            keepAnimating = true;
          }

          if (state.pollinatorActive && !isSoftwareGl) {
            state.pollinatorPhase = (state.pollinatorPhase + delta) % 1000;
            updatePollinatorActors(
              state.butterflies,
              state.bees,
              state.pollinatorPhase,
              anchorsRef.current,
              state.fluxTreeH,
              state.pollinatorButterflyCount,
              state.pollinatorBeeCount,
              true
            );
            keepAnimating = true;
          }
        }

        const dampingNeedsMore = controls.update();
        if (dampingNeedsMore && !isSoftwareGl) {
          keepAnimating = true;
        }

        renderer.render(scene, camera);

        const done = () => {
          renderBusy = false;
          if (!disposed && (renderDirty || keepAnimating)) {
            requestRender();
          }
        };

        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    }

    const onControlsChange = () => requestRender();
    const onControlsStart = () => {
      if (sceneRefs.current) {
        sceneRefs.current.transitionActive = false;
      }
    };
    controls.addEventListener('change', onControlsChange);
    controls.addEventListener('start', onControlsStart);

    const handleResize = () => {
      if (!container || disposed) return;
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    };
    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    sceneRefs.current = {
      scene,
      camera,
      renderer,
      controls,
      hemiLight,
      keyLight,
      groundMesh,
      gridHelper,
      shadowGroup,
      shadowMat,
      ecoGroup,
      shadeTex,
      shadeMat,
      fluxMesh,
      fluxGeo,
      fluxMat,
      fluxActive: false,
      fluxSpreadR: 3.0,
      fluxTreeH: params.heightM,
      fluxLai: ecoMetrics.activeLAI,
      fluxPhase: 0.35,
      ecoOverlay,
      pollinatorGroup,
      butterflies,
      bees,
      pollinatorActive: pollinators.active,
      pollinatorButterflyCount: pollinators.butterflies,
      pollinatorBeeCount: pollinators.bees,
      pollinatorPhase: 0.4,
      treeContainer,
      currentTree: null,
      isSoftwareGl,
      requestRender,
      transitionActive: false,
      targetCamPos: camera.position.clone(),
      targetLookAt: controls.target.clone(),
      autoRotate,
      wireframe,
    };

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }
    requestRender();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      controls.removeEventListener('change', onControlsChange);
      controls.removeEventListener('start', onControlsStart);
      controls.dispose();
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);

      if (sceneRefs.current?.currentTree) {
        disposeTreeGroup(sceneRefs.current.currentTree);
      }
      if (sceneRefs.current?.ecoGroup) {
        while (sceneRefs.current.ecoGroup.children.length > 0) {
          const obj = sceneRefs.current.ecoGroup.children[0] as THREE.Mesh;
          sceneRefs.current.ecoGroup.remove(obj);
          obj.geometry?.dispose();
          if (obj.material && obj.material !== shadeMat) {
            const m = obj.material as THREE.MeshBasicMaterial;
            m.map?.dispose();
            m.dispose();
          }
        }
      }
      wingGeo.dispose();
      bfBodyGeo.dispose();
      bfBodyMat.dispose();
      bfWingMats.forEach((m) => m.dispose());
      beeBodyGeo.dispose();
      beeStripeGeo.dispose();
      beeWingGeo.dispose();
      beeBodyMat.dispose();
      beeStripeMat.dispose();
      beeWingMat.dispose();
      fluxGeo.dispose();
      fluxMat.dispose();
      shadeTex.dispose();
      shadeMat.dispose();
      groundGeo.dispose();
      groundMat.dispose();
      shadowTex.dispose();
      shadowMat.dispose();
      envTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      sceneRefs.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rebuild procedural tree asset when tree params change
  useEffect(() => {
    const state = sceneRefs.current;
    if (!state) return;

    if (state.currentTree) {
      state.treeContainer.remove(state.currentTree);
      disposeTreeGroup(state.currentTree);
      state.currentTree = null;
    }

    // Clear old contact shadows
    while (state.shadowGroup.children.length > 0) {
      const child = state.shadowGroup.children[0] as THREE.Mesh;
      state.shadowGroup.remove(child);
      child.geometry.dispose();
    }

    const { root, profile, mixProfiles, stats, treeAnchors } = buildTreeSceneAsset(params);

    // Apply current wireframe toggle
    root.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => {
          if ('wireframe' in m) {
            (m as THREE.MeshStandardMaterial).wireframe = state.wireframe;
          }
        });
      }
    });

    state.treeContainer.add(root);
    state.currentTree = root;

    // Ground contact shadows under each tree
    for (const anchor of treeAnchors) {
      const r = Math.max(1.2, anchor.radius * 1.45);
      const planeGeo = new THREE.PlaneGeometry(r * 2, r * 2);
      planeGeo.rotateX(-Math.PI / 2);
      const shadowPlane = new THREE.Mesh(planeGeo, state.shadowMat);
      shadowPlane.position.set(anchor.x, 0.006, anchor.z);
      state.shadowGroup.add(shadowPlane);
    }

    // Adjust shadow frustum to tightly frame single tree, grove, or mini-forest
    const isMulti = params.viewMode !== ViewMode.Specimen;
    const frustumD = isMulti ? Math.max(20, stats.widthM * 0.72) : Math.max(10, stats.heightM * 1.4);
    state.keyLight.shadow.camera.left = -frustumD;
    state.keyLight.shadow.camera.right = frustumD;
    state.keyLight.shadow.camera.top = frustumD;
    state.keyLight.shadow.camera.bottom = -frustumD;
    state.keyLight.shadow.camera.updateProjectionMatrix();

    anchorsRef.current = treeAnchors;
    statsRef.current = stats;
    setAssetVersion((v) => v + 1);

    onAssetReadyRef.current(root, profile, stats, mixProfiles);
    state.requestRender();
  }, [params]);

  // Update 3D LAI Shade Footprints, Carbon Age Ground Rings, Ring Number Labels, Flux Particles & Pollinators
  useEffect(() => {
    const state = sceneRefs.current;
    if (!state) return;

    state.ecoOverlay = ecoOverlay;
    state.ecoGroup.visible = ecoOverlay;

    while (state.ecoGroup.children.length > 0) {
      const child = state.ecoGroup.children[0] as THREE.Mesh;
      state.ecoGroup.remove(child);
      child.geometry.dispose();
      if (child.material && child.material !== state.shadeMat) {
        const m = child.material as THREE.MeshBasicMaterial;
        m.map?.dispose();
        m.dispose();
      }
    }

    const anchors = anchorsRef.current;
    const isMulti = params.viewMode !== ViewMode.Specimen;
    state.fluxTreeH = Math.max(2.0, statsRef.current.heightM);

    // Update Butterflies & Bees (Spring / Summer pollinator attraction)
    state.pollinatorActive = pollinators.active;
    state.pollinatorButterflyCount = pollinators.butterflies;
    state.pollinatorBeeCount = pollinators.bees;
    updatePollinatorActors(
      state.butterflies,
      state.bees,
      state.pollinatorPhase,
      anchors,
      state.fluxTreeH,
      pollinators.butterflies,
      pollinators.bees,
      pollinators.active
    );

    if (!ecoOverlay) {
      state.fluxActive = false;
      state.fluxMesh.visible = false;
      state.requestRender();
      return;
    }

    const isDark = backdrop === BackdropMode.Slate;
    const laiRatio = THREE.MathUtils.clamp(ecoMetrics.activeLAI / 4.8, 0, 1);

    // 1. Projected LAI Shade & Cooling Footprints under each tree
    state.shadeMat.opacity = ecoMetrics.activeLAI < 0.25 ? 0.08 : 0.22 + laiRatio * 0.62;
    for (const anchor of anchors) {
      const footprintR = Math.max(1.1, anchor.radius * THREE.MathUtils.lerp(0.68, 1.38, laiRatio));
      const discGeo = new THREE.PlaneGeometry(footprintR * 2, footprintR * 2);
      discGeo.rotateX(-Math.PI / 2);
      const disc = new THREE.Mesh(discGeo, state.shadeMat);
      disc.position.set(anchor.x, 0.015, anchor.z);
      state.ecoGroup.add(disc);
    }

    // 2. Carbon Sequestration Ground Ring (Age progress 1..40 yrs + annual CO2 scale)
    const baseRingR = isMulti
      ? Math.max(4.8, statsRef.current.widthM * 0.56 + 0.65)
      : Math.max(1.7, (anchors[0]?.radius ?? 2.0) * 1.24 + 0.45);
    const carbonRadiusBoost = THREE.MathUtils.clamp(ecoMetrics.annualCo2Kg / 260, 0, 0.75);
    const ringR = baseRingR + carbonRadiusBoost;
    const ringThickness = isMulti ? 0.14 : 0.085;

    const trackGeo = new THREE.RingGeometry(ringR - ringThickness, ringR + ringThickness, 72);
    trackGeo.rotateX(-Math.PI / 2);
    const trackMat = new THREE.MeshBasicMaterial({
      color: isDark ? 0x64748b : 0x0f172a,
      transparent: true,
      opacity: isDark ? 0.3 : 0.14,
      side: THREE.DoubleSide,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3,
    });
    const trackMesh = new THREE.Mesh(trackGeo, trackMat);
    trackMesh.position.y = 0.019;
    state.ecoGroup.add(trackMesh);

    const ageFrac = THREE.MathUtils.clamp(params.year / 40, 0.03, 1.0);
    const arcGeo = new THREE.RingGeometry(
      ringR - ringThickness * 1.15,
      ringR + ringThickness * 1.15,
      64,
      1,
      Math.PI / 2,
      ageFrac * Math.PI * 2
    );
    arcGeo.rotateX(-Math.PI / 2);
    const arcMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    });
    const arcMesh = new THREE.Mesh(arcGeo, arcMat);
    arcMesh.position.y = 0.022;
    state.ecoGroup.add(arcMesh);

    // Inner LAI Density Arc
    const innerR = Math.max(1.0, ringR - (isMulti ? 0.65 : 0.38));
    const laiArcGeo = new THREE.RingGeometry(
      innerR - ringThickness * 0.65,
      innerR + ringThickness * 0.65,
      64,
      1,
      Math.PI / 2,
      Math.max(0.08, laiRatio * Math.PI * 2)
    );
    laiArcGeo.rotateX(-Math.PI / 2);
    const laiArcMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: ecoMetrics.activeLAI < 0.25 ? 0.22 : 0.82,
      side: THREE.DoubleSide,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    });
    const laiArcMesh = new THREE.Mesh(laiArcGeo, laiArcMat);
    laiArcMesh.position.y = 0.021;
    state.ecoGroup.add(laiArcMesh);

    // Simple 3D Ground Number Labels attached cleanly near the rings
    const labelScale = isMulti ? Math.max(2.4, ringR * 0.32) : Math.max(1.5, ringR * 0.56);
    const co2Label = createRingLabelMesh(
      `${ecoMetrics.cumulativeCo2Kg.toLocaleString()} kg CO₂`,
      '#F59E0B',
      isDark,
      labelScale
    );
    co2Label.position.set(ringR * 0.72, 0.028, ringR * 0.78);
    state.ecoGroup.add(co2Label);

    const laiLabel = createRingLabelMesh(
      `LAI ${ecoMetrics.activeLAI.toFixed(1)}`,
      '#10B981',
      isDark,
      labelScale * 0.8
    );
    laiLabel.position.set(-innerR * 0.68, 0.028, innerR * 0.76);
    state.ecoGroup.add(laiLabel);

    // 3. CO2 Uptake & O2 Release Flux Particles
    const fluxActive = ecoMetrics.activeLAI >= 0.25;
    state.fluxActive = fluxActive;
    state.fluxSpreadR = isMulti
      ? Math.max(3.4, statsRef.current.widthM * 0.44)
      : Math.max(1.4, (anchors[0]?.radius ?? 2.0) * 1.15);
    state.fluxLai = ecoMetrics.activeLAI;

    if (fluxActive) {
      state.fluxMesh.visible = true;
      updateFluxInstances(
        state.fluxMesh,
        state.fluxPhase,
        state.fluxSpreadR,
        state.fluxTreeH,
        state.fluxLai
      );
    } else {
      state.fluxMesh.visible = false;
    }

    state.requestRender();
  }, [assetVersion, ecoOverlay, ecoMetrics, pollinators, params.year, params.viewMode, backdrop]);

  // Update backdrop lighting & colors
  useEffect(() => {
    const state = sceneRefs.current;
    if (!state) return;
    const cfg = BACKDROP_CONFIG[backdrop];
    state.scene.background = new THREE.Color(cfg.bg);
    state.scene.fog = new THREE.FogExp2(cfg.bg, 0.0055);
    (state.groundMesh.material as THREE.MeshStandardMaterial).color.set(cfg.ground);
    state.hemiLight.color.setHex(cfg.hemiSky);
    state.hemiLight.groundColor.setHex(cfg.hemiGround);

    // Recreate GridHelper colors cleanly
    state.scene.remove(state.gridHelper);
    state.gridHelper.geometry.dispose();
    const newGrid = new THREE.GridHelper(60, 60, cfg.grid1, cfg.grid2);
    newGrid.position.y = 0.012;
    newGrid.visible = showGrid;
    const gridMats = Array.isArray(newGrid.material) ? newGrid.material : [newGrid.material];
    gridMats.forEach((m) => {
      m.transparent = true;
      m.opacity = 0.42;
      m.polygonOffset = true;
      m.polygonOffsetFactor = -1;
      m.polygonOffsetUnits = -1;
    });
    state.gridHelper = newGrid;
    state.scene.add(newGrid);

    state.requestRender();
  }, [backdrop, showGrid]);

  // Update Grid visibility
  useEffect(() => {
    const state = sceneRefs.current;
    if (!state) return;
    state.gridHelper.visible = showGrid;
    state.requestRender();
  }, [showGrid]);

  // Update Wireframe toggle
  useEffect(() => {
    const state = sceneRefs.current;
    if (!state) return;
    state.wireframe = wireframe;
    if (state.currentTree) {
      state.currentTree.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => {
            if ('wireframe' in m) {
              (m as THREE.MeshStandardMaterial).wireframe = wireframe;
            }
          });
        }
      });
    }
    state.requestRender();
  }, [wireframe]);

  // Update Auto-Rotate
  useEffect(() => {
    const state = sceneRefs.current;
    if (!state) return;
    state.autoRotate = autoRotate;
    state.requestRender();
  }, [autoRotate]);

  // Smooth damped camera preset transitions + auto-framing on viewMode changes
  useEffect(() => {
    const state = sceneRefs.current;
    if (!state) return;

    const span =
      params.viewMode === ViewMode.MiniForest
        ? Math.max(21, params.heightM * 2.5)
        : params.viewMode === ViewMode.Grove
          ? Math.max(16, params.heightM * 2.15)
          : Math.max(5.5, params.heightM * 1.45);
    const targetY = params.heightM * 0.44;

    if (cameraPreset === CameraPreset.Front) {
      _desiredPos.set(0, targetY + span * 0.15, span * 1.15);
      _desiredTarget.set(0, targetY, 0);
    } else if (cameraPreset === CameraPreset.Top) {
      _desiredPos.set(0, span * 1.45, span * 0.25);
      _desiredTarget.set(0, targetY * 0.4, 0);
    } else {
      _desiredPos.set(span * 0.72, targetY + span * 0.44, span * 0.92);
      _desiredTarget.set(0, targetY, 0);
    }

    state.targetCamPos.copy(_desiredPos);
    state.targetLookAt.copy(_desiredTarget);
    state.transitionActive = true;
    state.requestRender();
  }, [cameraPreset, cameraTrigger, params.viewMode]);

  return (
    <div className="relative w-full h-full select-none">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      {contextLost && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 text-slate-100 p-6">
          <div className="max-w-md text-center space-y-2">
            <h2 className="font-display text-xl font-semibold">3D Viewport Unavailable</h2>
            <p className="text-sm text-slate-300">
              WebGL context was interrupted. Reload the page or re-enable hardware acceleration to resume interactive 3D rendering.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
