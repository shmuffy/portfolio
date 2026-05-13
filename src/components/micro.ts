/* Minimal "float / stamp" micro-kit — small HTML/SVG fragments returned as strings. */

/** minimal HTML escaper for interpolated text content */
export function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** turn **bold** markers in copy into <b> tags (after escaping) */
export function emphasize(s: string): string {
  return esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
}

/** a centered short dotted leader, on its own line */
export function dotline(): string {
  return `<i class="dotline" aria-hidden="true"></i>`;
}

/** one empty line inside a .block */
export function spacer(): string {
  return `<p class="spacer" aria-hidden="true">&nbsp;</p>`;
}

/** tiny caps label line */
export function stampLine(text: string, ink = false): string {
  return `<p class="stamp${ink ? " stamp--ink" : ""}">${esc(text)}</p>`;
}

/** a line with gutter markers — left/right hold one short token (digit, +, ·, ↑) or "" */
export function gutterRow(left: string, text: string, right: string): string {
  return `<p class="row"><span class="g">${esc(left)}</span><span class="t">${esc(text)}</span><span class="g">${esc(right)}</span></p>`;
}

/** the .open section opener: "ID — TITLE" stamp + dotline */
export function sectionOpen(id: string, title: string): string {
  return `<div class="open reveal"><p class="stamp stamp--ink">${esc(id)} — ${esc(title.toUpperCase())}</p><i class="dotline" aria-hidden="true"></i></div>`;
}

/** a single mono "A → B → C" line; arrows in a faint span */
export function flowline(parts: string[]): string {
  return `<p class="flowline">${parts.map(esc).join('<span class="arr" aria-hidden="true"> → </span>')}</p>`;
}
