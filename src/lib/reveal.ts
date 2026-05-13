/** Light scroll-reveal: adds `.is-in` to `.reveal` elements as they enter view.
    Bails out entirely (everything shown immediately) under prefers-reduced-motion
    or when IntersectionObserver is unavailable. */
export function initReveal(): void {
  const els = document.querySelectorAll<HTMLElement>(".reveal");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduce || !("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("is-in"));
    return;
  }

  const io = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          obs.unobserve(entry.target);
        }
      }
    },
    { rootMargin: "0px 0px -6% 0px", threshold: 0.08 },
  );

  els.forEach((el) => io.observe(el));
}
