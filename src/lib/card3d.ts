/* ---------------------------------------------------------------------------
   SHARED CONTRACT — the magic business card (mirror of about.ts; B + C adhere)

   DOM: section#about[position:relative]
          .card-shadow[aria-hidden]          ← cast shadow; NOT in the 3D chain
          .card-stage                        ← perspective camera; entrance only, no live transform
            .card-drag                        ← (vestigial wrapper — no longer driven; preserves the 3D chain)
              .card-tilt                      ← parallax: rotateX/Y(var(--tilt-x/y))
                .card-float                   ← idle bob (pure CSS, off w/ reduced-motion)
                  .card[data-face="front"|"back"]  ← rotateY(var(--flip)); .7s transition ALWAYS on; .is-dragging / .is-entering
                    .card-face.card-front     ← the 4 .ink-line <p>s
                    .card-face.card-back       ← button.coffee-trigger + #coffee-lines

   State / classes:
     .card[data-face="front"|"back"]   — set by THIS module only, on flip.
     .card.is-dragging                 — only during a confirmed drag; CSS just swaps the cursor (flip transition stays on).
     .card.is-entering                 — on init pre-rAF; inkreveal removes it (B defines the CSS).
     .card-back[inert][aria-hidden]    ⇔ data-face="front"  (mirrored on .card-front when "back"). THIS module owns.

   Interaction: the card is FIXED at the centre of the hero (it never translates — only the idle bob and the
   hover parallax move/tilt it in place). Dragging the card sideways past a small threshold flips it (one clean
   animated rotateY 0↔180); keep dragging the same way and it flips back. No pointer-driven rotation (which used to
   blow up near 90° because getBoundingClientRect().width foreshortens), no repositioning. Keyboard: ←/→/Space/Enter.

   Event: new CustomEvent('cardface', { detail:{ face:'front'|'back' }, bubbles:true }) on .card, on flip.

   CSS custom props this module writes:
     --flip (deg) on .card; --tilt-x/--tilt-y (deg) on .card-tilt;
     --shadow-sx (unitless), --shadow-tx/--shadow-ty (px) on .card-shadow.
--------------------------------------------------------------------------- */

type Face = "front" | "back";

const SLOP = 7; // px of movement before a pointerdown is promoted to a drag
const TILT_MAX = 7; // deg of parallax tilt at the edge of the hero

const clamp = (v: number, lo: number, hi: number): number =>
  v < lo ? lo : v > hi ? hi : v;

export function initCard3d(): void {
  const card = document.querySelector<HTMLElement>(".card");
  const tilt = document.querySelector<HTMLElement>(".card-tilt");
  const front = document.querySelector<HTMLElement>(".card-front");
  const back = document.querySelector<HTMLElement>(".card-back");
  const cardShadow = document.querySelector<HTMLElement>(".card-shadow");
  const hero = document.getElementById("about");
  if (!card || !tilt || !front || !back || !cardShadow || !hero) return;

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

  // -- face state -----------------------------------------------------------
  const setFace = (face: Face): void => {
    card.dataset.face = face;
    back.toggleAttribute("inert", face === "front");
    back.setAttribute("aria-hidden", String(face === "front"));
    front.toggleAttribute("inert", face === "back");
    front.setAttribute("aria-hidden", String(face === "back"));
    card.dispatchEvent(
      new CustomEvent("cardface", { detail: { face }, bubbles: true }),
    );
  };

  // -- flip + cast-shadow squash -------------------------------------------
  const writeFlip = (deg: number): void => {
    card.style.setProperty("--flip", deg + "deg");
    const sx = Math.abs(Math.cos((deg * Math.PI) / 180)) * 0.4 + 0.6;
    cardShadow.style.setProperty("--shadow-sx", sx.toFixed(3));
  };

  // baseFlip is the *resting* angle of the card — only ever 0 or 180.
  let baseFlip = 0;

  setFace("front");
  writeFlip(0);

  const doFlip = (): void => {
    baseFlip = baseFlip === 0 ? 180 : 0;
    writeFlip(baseFlip);
    setFace(baseFlip === 0 ? "front" : "back");
  };

  // -- parallax tilt --------------------------------------------------------
  const resetTilt = (): void => {
    tilt.style.setProperty("--tilt-x", "0deg");
    tilt.style.setProperty("--tilt-y", "0deg");
    cardShadow.style.setProperty("--shadow-tx", "0px");
    cardShadow.style.setProperty("--shadow-ty", "0px");
  };
  resetTilt();

  // -- drag sideways to flip (the card itself never moves) ------------------
  let pending = false; // pointerdown registered, not yet confirmed as a drag
  let dragging = false; // confirmed drag in progress
  let pid = -1;
  let startX = 0;
  let startY = 0;
  let flipOriginX = 0; // clientX from which the next flip-threshold is measured
  let flipThreshold = 9999; // px of sideways drag that triggers a flip (set on pointerdown)

  const onPointerDown = (e: PointerEvent): void => {
    if (e.button !== 0 && e.pointerType === "mouse") return; // primary mouse button only
    if (pending || dragging) return;
    // a press that started on an interactive control (the back's COFFEE CHAT
    // button, the revealed links) is a click — don't hijack it as a drag.
    if ((e.target as Element).closest("a, button")) return;
    pending = true;
    pid = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    // a brisk sideways nudge flips it (≈22% of the card width, clamped to 48–75px)
    const cardW = card.offsetWidth || 1;
    flipThreshold = clamp(cardW * 0.22, 48, 75);
    resetTilt(); // freeze parallax while a gesture is forming
  };

  const onPointerMove = (e: PointerEvent): void => {
    if (e.pointerId !== pid) return;

    if (pending) {
      const dx0 = e.clientX - startX;
      const dy0 = e.clientY - startY;
      if (Math.hypot(dx0, dy0) < SLOP) return;
      // promote to a real drag
      pending = false;
      dragging = true;
      card.setPointerCapture(pid);
      card.classList.add("is-dragging");
      resetTilt();
      flipOriginX = e.clientX;
    }

    if (!dragging) return;
    e.preventDefault(); // kill text-selection + the trailing synthetic click

    // drag horizontally past the threshold → it flips itself, then rebase so
    // another full threshold's worth of drag is needed to flip again.
    const seg = e.clientX - flipOriginX;
    if (Math.abs(seg) >= flipThreshold) {
      doFlip();
      flipOriginX = e.clientX;
    }
  };

  const endGesture = (e: PointerEvent): void => {
    if (e.pointerId !== pid) return;

    if (pending) {
      // never moved past the slop — it was a tap; let the browser fire `click`
      // on whatever's under the pointer (e.g. the back's COFFEE CHAT button).
      pending = false;
      pid = -1;
      return;
    }
    if (!dragging) return;

    dragging = false;
    if (card.hasPointerCapture(pid)) card.releasePointerCapture(pid);
    card.classList.remove("is-dragging");
    pid = -1;
  };

  card.addEventListener("pointerdown", onPointerDown);
  card.addEventListener("pointermove", onPointerMove);
  card.addEventListener("pointerup", endGesture);
  card.addEventListener("pointercancel", endGesture);

  // -- hover parallax (fine pointer + motion allowed only) ------------------
  if (finePointer && !reduce) {
    let rafId = 0;
    let pendingX = 0;
    let pendingY = 0;

    const applyTilt = (): void => {
      rafId = 0;
      const r = hero.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const nx = clamp((pendingX - cx) / (r.width / 2), -1, 1);
      const ny = clamp((pendingY - cy) / (r.height / 2), -1, 1);
      tilt.style.setProperty("--tilt-y", nx * TILT_MAX + "deg");
      tilt.style.setProperty("--tilt-x", -ny * TILT_MAX + "deg");
      cardShadow.style.setProperty("--shadow-tx", -nx * 10 + "px");
      cardShadow.style.setProperty("--shadow-ty", -ny * 6 + "px");
    };

    hero.addEventListener("pointermove", (e: PointerEvent) => {
      if (dragging || pending) return;
      pendingX = e.clientX;
      pendingY = e.clientY;
      if (!rafId) rafId = requestAnimationFrame(applyTilt);
    });
    hero.addEventListener("pointerleave", () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      resetTilt();
    });
  }

  // -- keyboard flip (a11y) -------------------------------------------------
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", "Business card — drag sideways or press to flip");
  card.addEventListener("keydown", (e: KeyboardEvent) => {
    if (
      e.key !== " " &&
      e.key !== "Enter" &&
      e.key !== "ArrowLeft" &&
      e.key !== "ArrowRight"
    )
      return;
    e.preventDefault();
    doFlip();
  });
}
