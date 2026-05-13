// src/lib/pcb3dViewer.ts — the lazy code-split chunk's ONLY public export.
//
// `mountModel` boots a small three.js scene inside the `.pcb-morph` button: a
// transparent WebGL canvas (so the bone paper shows through), RoomEnvironment
// IBL + a soft key light, ACES tonemap, and OrbitControls (drag to rotate,
// scroll to zoom — no pan). It starts on a (near-)top-down view framed so the
// board fills the canvas like the flat ink render, with the render-scene backdrop
// the GLB ships stripped out. The GLB is fetched on demand (progress reported via
// `opts.onProgress`). Meshopt is wired (no Draco / no KTX2 — this GLB needs
// neither). The returned handle owns teardown: `dispose()` cancels the rAF loop,
// frees every GL resource, forces context loss, and removes the canvas;
// `resize()` re-reads the stage size.

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

/** Stage aspect ratio (the flat ink board is 1500×678). */
const ASPECT_W = 1500;
const ASPECT_H = 678;

interface ModelHandle {
  dispose(): void;
  resize(): void;
}

function stageSize(stage: HTMLElement): { w: number; h: number } {
  const w = Math.max(1, stage.clientWidth);
  const h = Math.max(1, stage.clientHeight || Math.round((w * ASPECT_H) / ASPECT_W));
  return { w, h };
}

function isMesh(obj: THREE.Object3D): obj is THREE.Mesh {
  return (obj as THREE.Mesh).isMesh === true;
}

function isTexture(value: unknown): value is THREE.Texture {
  return !!value && (value as THREE.Texture).isTexture === true;
}

/** Dispose every texture referenced by a material, then the material itself. */
function disposeMaterial(material: THREE.Material): void {
  const record = material as unknown as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    const value = record[key];
    if (isTexture(value)) value.dispose();
  }
  material.dispose();
}

/** Walk a scene graph disposing all mesh geometries, materials and textures. */
function disposeSceneGraph(scene: THREE.Scene): void {
  scene.traverse((obj) => {
    if (!isMesh(obj)) return;
    obj.geometry.dispose();
    const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const mat of materials) disposeMaterial(mat);
  });
}

/** True if this name looks like a render-scene backdrop, not part of the PCB
 *  (this GLB ships a 2×2 "Studio_Background" plane that, left in, swamps the
 *  bounding box so the actual ~0.14-unit board renders as a tiny speck). */
const BACKDROP_RE = /background|backdrop|studio[\s_-]*(?:bg|background|env)/i;

/** Remove backdrop / ground-plane meshes from the loaded model in place, so the
 *  camera framing (and the visible scene) is just the PCB. Matches on mesh name,
 *  ancestor node names, or any material name. */
function stripBackdrops(root: THREE.Object3D): void {
  const doomed: THREE.Object3D[] = [];
  root.traverse((obj) => {
    let hit = BACKDROP_RE.test(obj.name);
    if (!hit && isMesh(obj)) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      hit = mats.some((m) => BACKDROP_RE.test(m.name));
    }
    if (hit) doomed.push(obj);
  });
  for (const obj of doomed) obj.removeFromParent();
}

export async function mountModel(
  stage: HTMLElement,
  glbUrl: string,
  opts?: { onProgress?: (frac: number | null) => void },
): Promise<ModelHandle> {
  // --- Renderer (WebGL feature-detect lives in this try/catch) ----------------
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
  } catch {
    throw new Error("WEBGL_UNAVAILABLE");
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0); // transparent — paper shows behind
  // Khronos PBR-Neutral tonemap keeps the soldermask / copper saturated — ACES
  // was desaturating + lifting midtones, which read as "pale". Soft self-shadows
  // (rendered once, then frozen) give the board real depth.
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // outputColorSpace stays at its default (SRGBColorSpace).

  const canvas = renderer.domElement;
  canvas.className = "pcb-morph-canvas";
  stage.appendChild(canvas);

  let { w, h } = stageSize(stage);
  renderer.setSize(w, h, /* updateStyle = */ false); // CSS owns width/height

  // --- Scene + lighting: env as a soft fill, plus a real key/fill/rim rig ------
  const scene = new THREE.Scene();

  const pmrem = new THREE.PMREMGenerator(renderer);
  const roomEnv = new RoomEnvironment();
  const envRT = pmrem.fromScene(roomEnv, 0.04);
  scene.environment = envRT.texture;
  scene.environmentIntensity = 0.5; // dial the studio env back so it fills, not washes

  // key (shadow-casting) + a soft fill + a rim + a hemisphere bounce. Light
  // positions + the key's shadow frustum are sized to the model once it loads.
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.45);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 0.6);
  scene.add(rim);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x3a3a3a, 0.35));

  // --- Camera (small near — PCB models are tiny in world units) ---------------
  const camera = new THREE.PerspectiveCamera(40, w / h, 0.001, 100);

  // teardown for the "dispose() ran while the GLB was still loading" race.
  let disposed = false;
  const teardownPartial = (): void => {
    (roomEnv as { dispose?: () => void }).dispose?.();
    pmrem.dispose();
    envRT.texture?.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  };

  // --- Load the GLB -----------------------------------------------------------
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);

  const gltf = await new Promise<GLTF>((resolve, reject) => {
    loader.load(
      glbUrl,
      resolve,
      (ev) => {
        const frac = ev.lengthComputable && ev.total ? ev.loaded / ev.total : null;
        opts?.onProgress?.(frac);
      },
      (err) => reject(err instanceof Error ? err : new Error("GLB_LOAD_FAILED")),
    );
  });

  if (disposed) {
    // dispose() was called mid-load — clean up what we built, return a no-op.
    teardownPartial();
    return { dispose() {}, resize() {} };
  }

  // --- Frame the model: a (near-)top-down view matching the flat board image ---
  const root = gltf.scene;
  stripBackdrops(root); // drop the render-scene backdrop so we frame just the PCB
  scene.add(root);

  // glTF convention: Y is up; an Altium-style board lies flat in XZ with Y thin.
  // If the footprint's long axis came in along Z (portrait), spin it 90° about Y
  // so it runs along X — i.e. matches the wide flat render.
  let box = new THREE.Box3().setFromObject(root);
  let size = box.getSize(new THREE.Vector3());
  if (size.z > size.x) {
    root.rotation.y = Math.PI / 2;
    box = new THREE.Box3().setFromObject(root);
    size = box.getSize(new THREE.Vector3());
  }
  const center = box.getCenter(new THREE.Vector3());
  root.position.sub(center); // recenter at the origin

  const footW = Math.max(size.x, 1e-4); // long axis → the canvas's width
  const footD = Math.max(size.z, 1e-4); // short axis → the canvas's height
  const aspect = w / h;
  const halfFovTan = Math.tan((camera.fov * Math.PI) / 360);
  // distance so the footprint fills the (1500×678-ish) canvas like the flat render
  const dist = Math.max(footW / (2 * halfFovTan * aspect), footD / (2 * halfFovTan)) * 1.08;
  const r = Math.max(0.5 * Math.hypot(footW, footD), 1e-4);

  // light the board now that we know its size: key from upper-left/front (it
  // casts), a soft fill from the opposite side, a rim from behind.
  key.position.set(-r * 1.6, r * 3.2, r * 1.4);
  fill.position.set(r * 1.8, r * 1.0, -r * 1.2);
  rim.position.set(r * 0.4, r * 1.6, -r * 3.0);
  const sc = key.shadow.camera; // OrthographicCamera (directional light)
  sc.left = -r * 1.4;
  sc.right = r * 1.4;
  sc.top = r * 1.4;
  sc.bottom = -r * 1.4;
  sc.near = r * 0.05;
  sc.far = r * 10;
  sc.updateProjectionMatrix();
  key.shadow.bias = -0.0001;
  key.shadow.normalBias = r * 0.02;

  // every mesh casts + receives → components self-shadow onto the soldermask
  root.traverse((obj) => {
    if (isMesh(obj)) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  // model + lights are static (only the camera orbits) — render the shadow map
  // once on the next render(), then freeze it (sampling stays cheap forever).
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;

  camera.up.set(0, 1, 0);
  camera.position.set(0, dist, dist * 0.05); // straight above, a hair forward (not degenerate)
  camera.near = r * 0.01;
  camera.far = r * 60;
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();

  // --- Controls: drag-orbit + scroll-zoom ------------------------------------
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.autoRotate = false;
  controls.enableZoom = true; // scroll up/down zooms into the board
  controls.zoomToCursor = true; // zoom toward whatever the pointer is over
  controls.minDistance = r * 0.15; // zoom in close to a component cluster
  controls.maxDistance = r * 8; // ... but not lost in the void
  controls.update();

  // paint one frame synchronously so the canvas already shows the model the
  // instant mountModel resolves — the orchestrator can then cross-fade cleanly
  // (flat image out / 3D in) with no blank frame.
  renderer.render(scene, camera);

  // --- Render loop ------------------------------------------------------------
  let rafId = 0;
  const tick = (): void => {
    rafId = requestAnimationFrame(tick);
    controls.update();
    renderer.render(scene, camera);
  };
  rafId = requestAnimationFrame(tick);

  // --- Public handle ----------------------------------------------------------
  const resize = (): void => {
    if (disposed) return;
    const next = stageSize(stage);
    w = next.w;
    h = next.h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(rafId);
    controls.dispose();
    disposeSceneGraph(scene);
    (roomEnv as { dispose?: () => void }).dispose?.();
    pmrem.dispose();
    envRT.texture?.dispose();
    renderer.dispose();
    renderer.forceContextLoss(); // actually frees the GPU context (browsers cap ~8–16)
    canvas.remove();
  };

  return { dispose, resize };
}
