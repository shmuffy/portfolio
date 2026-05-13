import { navItems } from "../data/site";
import { esc } from "./micro";

export function nav(): string {
  const items = navItems
    .map(
      (it) =>
        `<a data-nav="${it.id}" href="#${it.id}">${it.n} ${esc(it.label.toUpperCase())}</a>`,
    )
    .join('<span class="sep" aria-hidden="true"> · </span>');

  return `<header>
    <nav class="nav" aria-label="Sections">
      <a class="nav-brand" href="#about" aria-label="Christian Kim — top"><span>CK</span></a>
      <span class="nav-links">${items}</span>
    </nav>
  </header>`;
}
