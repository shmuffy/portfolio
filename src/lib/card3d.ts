/* ---------------------------------------------------------------------------
   The magic business card — three.js (CSS3DRenderer) edition.

   Pipeline:
     section#about
       div.card-shadow                  ← cast shadow; not in the 3D chain
       div.card3d-host                  ← CSS3DRenderer mounts here
         (renderer wrapper)             ← three.js owns the transform on this
           div.card[data-face]          ← the DOM the user sees (front/back faces)

   three.js drives the rotation; the DOM owns the surface (paper texture,
   Copperplate letterpress, ink-reveal mask, COFFEE CHAT back face).

   Interaction:
     - Drag anywhere on the host → orbits the card in 3D (Y from cursor X,
       X from cursor Y). Stays where you let go — no spring-back.
     - Single click flips ±180° around Y, 0.7s ease (clicks past a 4px drag
       threshold are swallowed).
     - Arrow / Space / Enter → flip (matches the prior contract).
     - On mount, runs an entrance tween (~1.5s) and then dispatches
       `card-landed` from the .card so inkreveal writes the front lines.
     - Listens for `card3d:wobble` on .card so fliphint can tease the back.

   Custom-prop cascade (kept verbatim for the existing CSS):
     - --tilt-x / --tilt-y on .card  → feeds the .card-face sun-lighting gradient
     - --shadow-sx / --shadow-tx / --shadow-ty on .card-shadow → squashes/nudges
       the floor shadow as the card turns and tips.
--------------------------------------------------------------------------- */

import * as THREE from "three";
import { CSS3DObject, CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer.js";

type Face = "front" | "back";

const FLIP_DURATION_MS = 700;
const ENTRANCE_DURATION_MS = 1500;
const DRAG_SENSITIVITY = 0.006; // radians per pixel of cursor motion
const DRAG_THRESHOLD = 4;
const TILT_MAX = 7; // degrees mapped into the existing CSS lighting band

const clamp = (v: number, lo: number, hi: number): number =>
  v < lo ? lo : v > hi ? hi : v;

/** cubic-bezier(0.22, 1, 0.36, 1) — matches --ease across the project. */
function makeCubicEase(
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number,
): (x: number) => number {
  const cx = 3 * p1x;
  const bx = 3 * (p2x - p1x) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * p1y;
  const by = 3 * (p2y - p1y) - cy;
  const ay = 1 - cy - by;

  const sampleX = (t: number): number => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number): number => ((ay * t + by) * t + cy) * t;
  const sampleDerivX = (t: number): number => (3 * ax * t + 2 * bx) * t + cx;

  return (x: number): number => {
    let t = x;
    for (let i = 0; i < 6; i++) {
      const xt = sampleX(t) - x;
      if (Math.abs(xt) < 1e-6) return sampleY(t);
      const d = sampleDerivX(t);
      if (Math.abs(d) < 1e-6) break;
      t -= xt / d;
    }
    let lo = 0;
    let hi = 1;
    t = x;
    for (let i = 0; i < 20; i++) {
      const xt = sampleX(t);
      if (Math.abs(xt - x) < 1e-6) return sampleY(t);
      if (xt < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return sampleY(t);
  };
}
const flipEase = makeCubicEase(0.22, 1, 0.36, 1);

export function initCard3d(): void {
  const host = document.querySelector<HTMLElement>(".card3d-host");
  const card = document.querySelector<HTMLElement>(".card");
  const front = document.querySelector<HTMLElement>(".card-front");
  const back = document.querySelector<HTMLElement>(".card-back");
  const cardShadow = document.querySelector<HTMLElement>(".card-shadow");
  const hero = document.getElementById("about");
  if (!host || !card || !front || !back || !cardShadow || !hero) return;

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- three.js setup ----------------------------------------------------
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(22, 1, 1, 5000);
  camera.position.set(0, 0, 1100);

  const renderer = new CSS3DRenderer();
  const rendererEl = renderer.domElement;
  rendererEl.style.position = "absolute";
  rendererEl.style.left = "0";
  rendererEl.style.top = "0";
  rendererEl.style.pointerEvents = "none"; // .card overrides; host gets the events
  rendererEl.style.overflow = "visible"; // don't clip the card's rotated corners
  host.appendChild(rendererEl);

  const obj = new CSS3DObject(card);
  // CSS3DRenderer wants px-equivalent dimensions on the wrapped element to
  // sync with the camera projection. We measure the card once it's positioned.
  scene.add(obj);
  card.style.pointerEvents = "auto";

  // ---- resize ------------------------------------------------------------
  const fitCamera = (): void => {
    const r = host.getBoundingClientRect();
    const w = Math.max(1, r.width);
    const h = Math.max(1, r.height);
    renderer.setSize(w, h);
    camera.aspect = w / h;
    // Pick distance so 1 CSS px maps to 1 world unit (matches CSS3DRenderer).
    const fovRad = (camera.fov * Math.PI) / 180;
    camera.position.z = h / 2 / Math.tan(fovRad / 2);
    camera.updateProjectionMatrix();
  };
  fitCamera();
  const ro = new ResizeObserver(fitCamera);
  ro.observe(host);

  // ---- face state --------------------------------------------------------
  const setFace = (face: Face): void => {
    if (card.dataset.face === face) return;
    card.dataset.face = face;
    back.toggleAttribute("inert", face === "front");
    back.setAttribute("aria-hidden", String(face === "front"));
    front.toggleAttribute("inert", face === "back");
    front.setAttribute("aria-hidden", String(face === "back"));
    card.dispatchEvent(
      new CustomEvent("cardface", { detail: { face }, bubbles: true }),
    );
  };

  const eulerScratch = new THREE.Euler();
  const normalScratch = new THREE.Vector3();
  // Robust face test: which way does the card's surface normal actually point?
  // (Pure Euler decomposition gets ambiguous after combined X/Y/Z rotations.)
  const faceFromQuat = (q: THREE.Quaternion): Face => {
    normalScratch.set(0, 0, 1).applyQuaternion(q);
    return normalScratch.z >= 0 ? "front" : "back";
  };

  setFace("front");

  // ---- shared tween state ------------------------------------------------
  // A single rAF-driven tween targeting obj.quaternion. New tweens cancel
  // whatever's playing.
  let activeTween: number | null = null;
  const cancelTween = (): void => {
    if (activeTween !== null) {
      cancelAnimationFrame(activeTween);
      activeTween = null;
    }
  };
  const tweenQuat = (
    target: THREE.Quaternion,
    durationMs: number,
    ease: (x: number) => number,
    onDone?: () => void,
  ): void => {
    cancelTween();
    if (reduce || durationMs <= 0) {
      obj.quaternion.copy(target);
      onDone?.();
      return;
    }
    const start = obj.quaternion.clone();
    const t0 = performance.now();
    const step = (): void => {
      const u = Math.min(1, (performance.now() - t0) / durationMs);
      obj.quaternion.copy(start).slerp(target, ease(u));
      if (u < 1) {
        activeTween = requestAnimationFrame(step);
      } else {
        activeTween = null;
        onDone?.();
      }
    };
    activeTween = requestAnimationFrame(step);
  };

  const Y_AXIS = new THREE.Vector3(0, 1, 0);
  const X_AXIS = new THREE.Vector3(1, 0, 0);
  const quatScratch1 = new THREE.Quaternion();
  const quatScratch2 = new THREE.Quaternion();

  // ---- entrance ----------------------------------------------------------
  // Card starts ~2 full Y rotations off identity, scaled smaller, eases home.
  let entranceFinished = false;
  const landEntrance = (): void => {
    if (entranceFinished) return;
    entranceFinished = true;
    cancelTween();
    obj.quaternion.identity();
    obj.scale.setScalar(1);
    card.dispatchEvent(new CustomEvent("card-landed", { bubbles: true }));
  };

  if (reduce) {
    requestAnimationFrame(landEntrance);
  } else {
    const SPIN_DEGREES = 720;
    const t0 = performance.now();
    const easeOut = makeCubicEase(0.22, 1, 0.36, 1);
    obj.scale.setScalar(0.6);
    const stepEntrance = (): void => {
      const u = Math.min(1, (performance.now() - t0) / ENTRANCE_DURATION_MS);
      const e = easeOut(u);
      const angle = ((SPIN_DEGREES * (1 - e)) * Math.PI) / 180;
      obj.quaternion.setFromAxisAngle(Y_AXIS, angle);
      const s = 0.6 + 0.4 * e;
      const bounce = (1 - u) * Math.sin(u * Math.PI * 3) * 14;
      obj.position.y = bounce;
      obj.scale.setScalar(s);
      if (u < 1) {
        activeTween = requestAnimationFrame(stepEntrance);
      } else {
        activeTween = null;
        obj.position.y = 0;
        landEntrance();
      }
    };
    activeTween = requestAnimationFrame(stepEntrance);
    // user clicks the spinning card → snap it home, fire card-landed.
    host.addEventListener("pointerdown", landEntrance, { once: true });
  }

  // ---- drag-rotate -------------------------------------------------------
  let isDragging = false;
  let moved = false;
  let pressX = 0;
  let pressY = 0;
  let lastX = 0;
  let lastY = 0;
  let activePointerId: number | null = null;

  const onDown = (e: PointerEvent): void => {
    if ((e.target as Element).closest("a, button")) return;
    if (e.button !== 0) return;
    cancelTween();
    isDragging = true;
    moved = false;
    pressX = lastX = e.clientX;
    pressY = lastY = e.clientY;
    activePointerId = e.pointerId;
    try { host.setPointerCapture(e.pointerId); } catch {}
    host.classList.add("is-dragging");
  };

  const onMove = (e: PointerEvent): void => {
    if (!isDragging || e.pointerId !== activePointerId) return;
    if (!moved) {
      const dxp = e.clientX - pressX;
      const dyp = e.clientY - pressY;
      if (dxp * dxp + dyp * dyp < DRAG_THRESHOLD * DRAG_THRESHOLD) return;
      moved = true;
    }
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    // World-axis rotation, premultiplied so screen-X always yaws the card.
    quatScratch1.setFromAxisAngle(Y_AXIS, dx * DRAG_SENSITIVITY);
    quatScratch2.setFromAxisAngle(X_AXIS, dy * DRAG_SENSITIVITY);
    obj.quaternion.premultiply(quatScratch1).premultiply(quatScratch2);
  };

  const onUp = (e: PointerEvent): void => {
    if (!isDragging) return;
    isDragging = false;
    host.classList.remove("is-dragging");
    try { host.releasePointerCapture(e.pointerId); } catch {}
    activePointerId = null;
    // No spring-back. Update face state in case drag took us across 90°.
    setFace(faceFromQuat(obj.quaternion));
  };

  host.addEventListener("pointerdown", onDown);
  host.addEventListener("pointermove", onMove);
  host.addEventListener("pointerup", onUp);
  host.addEventListener("pointercancel", onUp);

  // ---- click to flip -----------------------------------------------------
  // A flip always settles to a clean face-up or face-down pose (no leftover
  // drag tilt) — slerping to identity or rotateY(180°), via the long way
  // around the axis the user nudged so it reads as the card turning over.
  let lastDirection: 1 | -1 = 1;
  const doFlip = (direction: 1 | -1): void => {
    lastDirection = direction;
    const currentFace = faceFromQuat(obj.quaternion);
    const targetFace: Face = currentFace === "front" ? "back" : "front";
    // identity for front, rotateY(π) for back — the clean rest pose.
    const target = new THREE.Quaternion();
    if (targetFace === "back") target.setFromAxisAngle(Y_AXIS, Math.PI);
    // Bias the slerp through the user-chosen side: insert a midpoint that
    // rotates 90° in the click direction so a right-click rolls right.
    const mid = obj.quaternion.clone().premultiply(
      new THREE.Quaternion().setFromAxisAngle(Y_AXIS, (Math.PI / 2) * direction),
    );
    cancelTween();
    if (reduce) {
      obj.quaternion.copy(target);
      setFace(targetFace);
      return;
    }
    const start = obj.quaternion.clone();
    const t0 = performance.now();
    const step = (): void => {
      const u = Math.min(1, (performance.now() - t0) / FLIP_DURATION_MS);
      const e = flipEase(u);
      if (e < 0.5) {
        obj.quaternion.copy(start).slerp(mid, e * 2);
      } else {
        obj.quaternion.copy(mid).slerp(target, (e - 0.5) * 2);
      }
      if (u < 1) {
        activeTween = requestAnimationFrame(step);
      } else {
        activeTween = null;
        obj.quaternion.copy(target);
        setFace(targetFace);
      }
    };
    activeTween = requestAnimationFrame(step);
  };

  host.addEventListener("click", (e: MouseEvent) => {
    if ((e.target as Element).closest("a, button")) return;
    if (e.detail === 0) return; // keyboard synthetic clicks
    if (moved) { moved = false; return; }
    if (!entranceFinished) return; // entrance landing already handles the press
    const rect = host.getBoundingClientRect();
    const direction: 1 | -1 =
      e.clientX >= rect.left + rect.width / 2 ? 1 : -1;
    doFlip(direction);
  });

  // ---- keyboard ----------------------------------------------------------
  host.tabIndex = 0;
  host.setAttribute("role", "button");
  host.setAttribute(
    "aria-label",
    "Business card — click either side to flip",
  );
  host.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      doFlip(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      doFlip(1);
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      doFlip(lastDirection);
    }
  });

  // ---- wobble (fliphint contract) ----------------------------------------
  // fliphint.ts dispatches `card3d:wobble` on .card to tease the back face.
  const playWobble = (): void => {
    if (isDragging || activeTween !== null) return;
    const home = obj.quaternion.clone();
    const peek = home.clone().premultiply(
      new THREE.Quaternion().setFromAxisAngle(Y_AXIS, (22 * Math.PI) / 180),
    );
    const back = home.clone().premultiply(
      new THREE.Quaternion().setFromAxisAngle(Y_AXIS, (-8 * Math.PI) / 180),
    );
    const ease1 = makeCubicEase(0.2, 0.7, 0.2, 1);
    const ease2 = makeCubicEase(0.42, 0, 0.58, 1); // ease-in-out
    const ease3 = makeCubicEase(0, 0, 0.58, 1); // ease-out
    tweenQuat(peek, 450, ease1, () => {
      tweenQuat(back, 250, ease2, () => {
        tweenQuat(home, 500, ease3);
      });
    });
  };
  card.addEventListener("card3d:wobble", playWobble as EventListener);

  // ---- render loop + custom-prop cascade ---------------------------------
  const wrapHalfTurn = (a: number): number => {
    let x = a % Math.PI;
    if (x > Math.PI / 2) x -= Math.PI;
    else if (x < -Math.PI / 2) x += Math.PI;
    return x;
  };

  const tick = (): void => {
    renderer.render(scene, camera);

    eulerScratch.setFromQuaternion(obj.quaternion, "YXZ");
    const tiltYdeg = clamp(
      (wrapHalfTurn(eulerScratch.y) * 180) / Math.PI,
      -TILT_MAX,
      TILT_MAX,
    );
    const tiltXdeg = clamp(
      (wrapHalfTurn(eulerScratch.x) * 180) / Math.PI,
      -TILT_MAX,
      TILT_MAX,
    );
    card.style.setProperty("--tilt-x", tiltXdeg.toFixed(2) + "deg");
    card.style.setProperty("--tilt-y", tiltYdeg.toFixed(2) + "deg");

    const sx = Math.abs(Math.cos(eulerScratch.y)) * 0.4 + 0.6;
    cardShadow.style.setProperty("--shadow-sx", sx.toFixed(3));
    cardShadow.style.setProperty(
      "--shadow-tx",
      (-tiltYdeg * 1.4).toFixed(1) + "px",
    );
    cardShadow.style.setProperty(
      "--shadow-ty",
      (-tiltXdeg * 0.9).toFixed(1) + "px",
    );

    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
