import { esc, sectionOpen, stampLine } from "./micro";

const FOLDER_SVG = `<svg class="folder-glyph" viewBox="0 0 80 56" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true"><path d="M4 16 L28 16 L34 10 L76 10 L76 50 L4 50 Z"/><path d="M4 22 L76 22" stroke-width="1"/></svg>`;

function tile(folder: string, label: string): string {
  return `<button class="folder-tile" type="button" data-folder-tile="${esc(folder)}" aria-label="${esc("Open " + label)}">
    ${FOLDER_SVG}
    <span class="folder-label">${esc(label)}</span>
  </button>`;
}

export function desktopSection(): string {
  return `<section class="block-section" id="desktop" aria-label="Desktop">
    ${sectionOpen("02", "Desktop")}
    <div class="block reveal desktop-intro">
      ${stampLine("CLICK A FOLDER TO OPEN · X OR ESC TO CLOSE")}
    </div>
    <div class="desktop-grid reveal">
      ${tile("work", "Work")}
      ${tile("projects", "Projects")}
    </div>
    <div class="folder-modal" data-folder-modal hidden role="dialog" aria-modal="true" aria-labelledby="folder-modal-title">
      <div class="folder-modal-window">
        <div class="folder-modal-bar">
          <span class="folder-modal-title stamp" id="folder-modal-title" data-folder-modal-title></span>
          <button class="folder-modal-close" data-folder-modal-close type="button" aria-label="Close folder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true"><path d="M5 5 L19 19"/><path d="M19 5 L5 19"/></svg>
          </button>
        </div>
        <div class="folder-modal-body" data-folder-modal-body></div>
      </div>
    </div>
  </section>`;
}
