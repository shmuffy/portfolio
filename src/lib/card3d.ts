/* ---------------------------------------------------------------------------
   The magic business card.

   DOM:
     section#about
       .card-shadow
       .card-stage                ← perspective camera
         .card-drag
           .card-tilt              ← parallax tilt
             .card-float           ← idle bob
               .card[data-face]    ← rotateY(var(--flip))
                 .card-face.card-front
                 .card-face.card-back

   Interaction:
     - Click the right half → flip +180° (right edge rolls back).
     - Click the left half  → flip -180° (left edge rolls back).
     - Space/Enter (focused) → flip in the last-clicked direction (defaults +1).
     - ArrowLeft / ArrowRight → flip -1 / +1.
     - The card is fixed at centre; it never translates. Only the idle bob and
       hover parallax move it in place.
     - Clicks on a/button inside the card (COFFEE CHAT, contact links) pass
       through untouched.
--------------------------------------------------------------------------- */

type Face = "front" | "back";

const TILT_MAX = 7;
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

  // -- face / flip state ----------------------------------------------------
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

  const writeFlip = (deg: number): void => {
    card.style.setProperty("--flip", deg + "deg");
    const sx = Math.abs(Math.cos((deg * Math.PI) / 180)) * 0.4 + 0.6;
    cardShadow.style.setProperty("--shadow-sx", sx.toFixed(3));
  };

  // baseFlip accumulates by ±180° so the CSS transition rotates in the
  // direction the user clicked (never backtracks).
  let baseFlip = 0;
  let lastDirection: 1 | -1 = 1;

  const faceFor = (deg: number): Face =>
    ((((Math.round(deg / 180) % 2) + 2) % 2) === 0 ? "front" : "back");

  const doFlip = (direction: 1 | -1): void => {
    lastDirection = direction;
    baseFlip += 180 * direction;
    writeFlip(baseFlip);
    setFace(faceFor(baseFlip));
  };

  setFace("front");
  writeFlip(0);

  // -- click to flip --------------------------------------------------------
  card.addEventListener("click", (e: MouseEvent) => {
    // let interactive children handle their own clicks (COFFEE CHAT etc.)
    if ((e.target as Element).closest("a, button")) return;
    // ignore synthetic clicks from keyboard activation — keydown handles those
    if (e.detail === 0) return;
    const rect = card.getBoundingClientRect();
    const direction: 1 | -1 =
      e.clientX >= rect.left + rect.width / 2 ? 1 : -1;
    doFlip(direction);
  });

  // -- keyboard -------------------------------------------------------------
  // Browsers do NOT auto-fire `click` for Space/Enter on a div with
  // role="button", so handle every flip key explicitly here.
  card.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      doFlip(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      doFlip(1);
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault(); // also stops Space from scrolling the page
      doFlip(lastDirection);
    }
  });

  // -- a11y attrs -----------------------------------------------------------
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute(
    "aria-label",
    "Business card — click either side to flip",
  );

  // -- hover parallax (fine pointer + motion allowed) -----------------------
  const resetTilt = (): void => {
    tilt.style.setProperty("--tilt-x", "0deg");
    tilt.style.setProperty("--tilt-y", "0deg");
    cardShadow.style.setProperty("--shadow-tx", "0px");
    cardShadow.style.setProperty("--shadow-ty", "0px");
  };
  resetTilt();

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
}
