import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildTreeSceneAsset, disposeTreeGroup } from '../engine/treeGenerator';
import {
  BackdropMode,
  CameraPreset,
  MeshStats,
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
  cameraPreset: CameraPreset;
  cameraTrigger: number;
  onAssetReady: (
    group: THREE.Group,
    profile: SpeciesProfile,
    stats: MeshStats
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

const _desiredPos = new THREE.Vector3();
const _desiredTarget = new THREE.Vector3();

export function TreeViewport({
  params,
  backdrop,
  showGrid,
  wireframe,
  autoRotate,
  cameraPreset,
  cameraTrigger,
  onAssetReady,
}: TreeViewportProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [contextLost, setContextLost] = useState(false);

  const onAssetReadyRef = useRef(onAssetReady);
  onAssetReadyRef.current = onAssetReady;

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

    const { root, profile, stats, treeAnchors } = buildTreeSceneAsset(params);

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

    // Adjust shadow frustum to tightly frame single tree or grove
    const frustumD = params.viewMode === ViewMode.Grove ? Math.max(18, stats.widthM * 0.7) : Math.max(10, stats.heightM * 1.4);
    state.keyLight.shadow.camera.left = -frustumD;
    state.keyLight.shadow.camera.right = frustumD;
    state.keyLight.shadow.camera.top = frustumD;
    state.keyLight.shadow.camera.bottom = -frustumD;
    state.keyLight.shadow.camera.updateProjectionMatrix();

    onAssetReadyRef.current(root, profile, stats);
    state.requestRender();
  }, [params]);

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

  // Smooth damped camera preset transitions + auto-framing on viewMode/height changes
  useEffect(() => {
    const state = sceneRefs.current;
    if (!state) return;

    const isGrove = params.viewMode === ViewMode.Grove;
    const span = isGrove ? Math.max(16, params.heightM * 2.15) : Math.max(5.5, params.heightM * 1.45);
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
