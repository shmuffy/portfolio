/** Auto-tease wobble that hints the card is two-sided.

    Fires ~1.6s after `card-landed`, then every 8s thereafter, by dispatching
    `card3d:wobble` on .card. card3d.ts owns the actual rotation (a +22° peek,
    -8° overshoot, settle to 0° via three.js quaternion slerp).

    Cancels permanently on the user's first interaction (pointerdown, gesture
    keypress, or actual flip). Reduced-motion: no-op. */

const GESTURE_KEYS = new Set(["ArrowLeft", "ArrowRight", " ", "Enter"]);
const FIRST_DELAY_MS = 1600;
const REPEAT_DELAY_MS = 8000;

export function initFlipHint(): void {
  const card = document.querySelector<HTMLElement>(".card");
  if (!card) return;

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  let stopped = false;
  let pendingTimeout: number | undefined;

  const scheduleTease = (delayMs: number): void => {
    if (stopped) return;
    if (pendingTimeout !== undefined) clearTimeout(pendingTimeout);
    pendingTimeout = window.setTimeout(tease, delayMs);
  };

  const tease = (): void => {
    if (stopped) return;
    card.dispatchEvent(new CustomEvent("card3d:wobble"));
    // Re-queue independently of the wobble's actual duration; if a new wobble
    // arrives while one is playing card3d.ts ignores it.
    scheduleTease(REPEAT_DELAY_MS);
  };

  const stopHint = (): void => {
    if (stopped) return;
    stopped = true;
    if (pendingTimeout !== undefined) {
      clearTimeout(pendingTimeout);
      pendingTimeout = undefined;
    }
  };

  card.addEventListener("card-landed", () => scheduleTease(FIRST_DELAY_MS), {
    once: true,
  });
  card.addEventListener("pointerdown", stopHint, { once: true });
  card.addEventListener("cardface", stopHint, { once: true });
  document.addEventListener("keydown", (e) => {
    if (GESTURE_KEYS.has(e.key)) stopHint();
  });
}
