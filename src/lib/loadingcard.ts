/** Loading-state spin + bounce on the hero card.

    A single short flourish: the card does ~1.5 spins (720° total, ease-out
    so the last half-rotation reads as a settle) while the float layer
    bounces and decays to rest. Lands face-up on the front. Fires
    `card-landed` so inkreveal writes the front-face lines.

    Reduced-motion: skip the spin entirely; fire `card-landed` next rAF. */

const SPIN_DEGREES = 720; // 2 full rotations; ease-out makes the back half feel like a settle
const SPIN_DURATION_MS = 1500;
const BOUNCE_PX = 18;

export function initLoadingCard(): void {
  const stage = document.querySelector<HTMLElement>(".card-stage");
  const card = document.querySelector<HTMLElement>(".card");
  const float = document.querySelector<HTMLElement>(".card-float");
  if (!stage || !card || !float) return;

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduce) {
    requestAnimationFrame(() => {
      stage.classList.remove("is-loading");
      card.dispatchEvent(new CustomEvent("card-landed", { bubbles: true }));
    });
    return;
  }

  const spin = card.animate(
    [
      { transform: "rotateY(0deg)" },
      { transform: `rotateY(${SPIN_DEGREES}deg)` },
    ],
    {
      duration: SPIN_DURATION_MS,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      fill: "forwards",
    },
  );

  // Bounce that decays over the same duration — three peaks, getting smaller.
  const bounce = float.animate(
    [
      { offset: 0, transform: "translateY(0px)" },
      { offset: 0.18, transform: `translateY(-${BOUNCE_PX}px)` },
      { offset: 0.4, transform: "translateY(0px)" },
      { offset: 0.58, transform: `translateY(-${BOUNCE_PX * 0.55}px)` },
      { offset: 0.78, transform: "translateY(0px)" },
      { offset: 0.9, transform: `translateY(-${BOUNCE_PX * 0.2}px)` },
      { offset: 1, transform: "translateY(0px)" },
    ],
    {
      duration: SPIN_DURATION_MS,
      easing: "ease-in-out",
      fill: "forwards",
    },
  );

  let landed = false;
  const land = (): void => {
    if (landed) return;
    landed = true;
    stage.classList.remove("is-loading");
    spin.cancel();
    bounce.cancel();
    card.dispatchEvent(new CustomEvent("card-landed", { bubbles: true }));
  };

  spin.finished.then(land).catch(() => {});

  // If the user clicks during the spin, land immediately so card3d's flip
  // takes effect right away instead of being painted over by the WAAPI.
  card.addEventListener("pointerdown", land, { once: true });
}
