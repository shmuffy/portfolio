import { navItems } from "../data/site";

/** Highlights the nav link for whichever section is crossing the viewport's
    mid-band, via aria-current="true". No-op without IntersectionObserver. */
export function initScrollSpy(): void {
  if (!("IntersectionObserver" in window)) return;

  const sections = navItems
    .map((it) => document.getElementById(it.id))
    .filter((el): el is HTMLElement => el !== null);
  if (sections.length === 0) return;

  const navLinks = Array.from(
    document.querySelectorAll<HTMLAnchorElement>(".nav a[data-nav]"),
  );
  let active = "";

  const setActive = (id: string): void => {
    if (id === active) return;
    active = id;
    for (const a of navLinks) {
      if (a.dataset.nav === id) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    }
  };

  const io = new IntersectionObserver(
    (entries) => {
      const hit = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (hit) setActive(hit.target.id);
    },
    { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
  );

  sections.forEach((s) => io.observe(s));
}
