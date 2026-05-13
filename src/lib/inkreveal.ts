/** Tom-Riddle-diary ink reveal of the card-front lines.

    Each glyph is wrapped in <span class="ink-char"> at init (preserving the
    `.row .g` / `.row .t` gutter structure). On `card-landed` (dispatched by
    card3d.ts after the spinning entrance settles), `.is-written` is added
    and every char emerges in unison from white (invisible under the
    parent's multiply blend) into full ink — like writing surfacing through
    the parchment of Riddle's diary.

    No per-char or per-line stagger — the whole inscription rises at once.
    Reduced-motion: CSS overrides nuke the animation. Without JS the `.js`
    scope ensures none of these rules apply — text shows plain. */

function splitTextNode(textNode: Text): void {
  const parent = textNode.parentNode;
  if (!parent) return;
  const text = textNode.textContent ?? "";
  const frag = document.createDocumentFragment();
  for (const ch of text) {
    if (ch === " " || ch === " " || ch === "\t") {
      frag.appendChild(document.createTextNode(ch));
      continue;
    }
    const span = document.createElement("span");
    span.className = "ink-char";
    span.textContent = ch;
    span.setAttribute("aria-hidden", "true");
    frag.appendChild(span);
  }
  parent.replaceChild(frag, textNode);
}

function splitLine(line: HTMLElement): void {
  const target = line.querySelector<HTMLElement>(".t") ?? line;
  if (!line.hasAttribute("aria-label")) {
    const label = (line.textContent ?? "").trim().replace(/\s+/g, " ");
    if (label) line.setAttribute("aria-label", label);
  }
  const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) textNodes.push(node as Text);
  for (const tn of textNodes) splitTextNode(tn);
}

export function initInkReveal(): void {
  const card = document.querySelector<HTMLElement>(".card");
  const lines = Array.from(
    document.querySelectorAll<HTMLElement>(".card-front .ink-line"),
  );
  if (!card || lines.length === 0) return;

  lines.forEach(splitLine);

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
