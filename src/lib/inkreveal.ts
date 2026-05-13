/** Magic-card entrance + "invisible ink" reveal of the card-front lines.

    Plays a short opacity+scale entrance on `.card-stage` (CSS owned by Agent B —
    `.card-stage.is-entering`, instant under reduced-motion), then, a beat later,
    adds `.is-written` to each `.card-front .ink-line` so the left→right mask wipe
    in style.css surfaces the text like ink rising on parchment, staggered by the
    `--ink-i` index baked into the markup.

    Under reduced-motion the `.ink-line` CSS already shows the text and all
    transitions are nuked, so adding `.is-written` is harmless; we just do it on
    the next frame. With no JS the `.js`-scoped rules never apply — text is plain. */
export function initInkReveal(): void {
  const stage = document.querySelector<HTMLElement>(".card-stage");
  const lines = Array.from(
    document.querySelectorAll<HTMLElement>(".card-front .ink-line"),
  );
  if (!stage || lines.length === 0) return;

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  stage.classList.add("is-entering");
  requestAnimationFrame(() => {
    stage.classList.remove("is-entering"); // card fades + scales in (instant under reduced-motion)
    window.setTimeout(
      () => {
        lines.forEach((el) => el.classList.add("is-written"));
      },
      reduce ? 0 : 280,
    );
  });
}
