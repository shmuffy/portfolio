/** Auto-tease wobble that hints the card is two-sided.

    Fires ~1.6s after `card-landed`, then every 8s thereafter. Each wobble
    peeks the card +22° toward the back, overshoots back to -8°, and settles
    to 0°. Cancels permanently on the user's first interaction
    (pointerdown, gesture keypress, or actual flip).

    Reduced-motion: no-op. WAAPI cancels after each cycle so the underlying
    `transform: rotateY(var(--flip))` and `.7s` flip transition resume. */

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
  let currentAnim: Animation | undefined;

  const scheduleTease = (delayMs: number): void => {
    if (stopped) return;
    if (pendingTimeout !== undefined) clearTimeout(pendingTimeout);
    pendingTimeout = window.setTimeout(tease, delayMs);
  };

  const tease = (): void => {
    if (stopped) return;
    currentAnim = card.animate(
      [
        { transform: "rotateY(0deg)", offset: 0, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" },
        { transform: "rotateY(22deg)", offset: 0.375, easing: "ease-in-out" },
        { transform: "rotateY(-8deg)", offset: 0.583, easing: "ease-out" },
        { transform: "rotateY(0deg)", offset: 1 },
      ],
      { duration: 1200, fill: "forwards" },
    );
    currentAnim.finished
      .then(() => {
        currentAnim?.cancel();
        currentAnim = undefined;
        scheduleTease(REPEAT_DELAY_MS);
      })
      .catch(() => {
        // cancelled by stopHint — handled there
      });
  };

  const stopHint = (): void => {
    if (stopped) return;
    stopped = true;
    if (pendingTimeout !== undefined) {
      clearTimeout(pendingTimeout);
      pendingTimeout = undefined;
    }
    // Cancel any in-flight wobble. The card's existing `.7s` CSS transition
    // smoothly carries it from the current angle to whatever the next CSS
    // rotateY value is (either rest at 0° or the user's flip target).
    currentAnim?.cancel();
    currentAnim = undefined;
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
