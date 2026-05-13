/** "Invisible ink" reveal of the card-front lines.

    Waits for the `card-landed` event from `loadingcard` (which fires after
    the loading spin decelerates and the card settles face-up), then adds
    `.is-written` to each `.card-front .ink-line` so the left→right mask
    wipe in style.css surfaces the text like ink rising on parchment,
    staggered by the `--ink-i` index baked into the markup.

    Under reduced-motion the `.ink-line` CSS already shows the text and all
    transitions are nuked, so adding `.is-written` is harmless. With no JS
    the `.js`-scoped rules never apply — text is plain. */
export function initInkReveal(): void {
  const card = document.querySelector<HTMLElement>(".card");
  const lines = Array.from(
    document.querySelectorAll<HTMLElement>(".card-front .ink-line"),
  );
  if (!card || lines.length === 0) return;

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const reveal = (): void => {
    window.setTimeout(
      () => {
        lines.forEach((el) => el.classList.add("is-written"));
      },
      reduce ? 0 : 280,
    );
  };

  card.addEventListener("card-landed", reveal, { once: true });
}
