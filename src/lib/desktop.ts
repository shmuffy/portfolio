import { experience } from "../data/experience";
import { projects } from "../data/projects";
import { links } from "../data/site";
import { roleDetailContent, projectDetailContent } from "../components/work";
import { esc, stampLine } from "../components/micro";
import { initPcbMorph } from "./pcbmorph";

type Section = "work" | "projects";
type State =
  | { level: "closed" }
  | { level: "list"; section: Section }
  | { level: "detail"; section: Section; itemId: string };

const FOLDER_SVG = `<svg class="folder-glyph" viewBox="0 0 80 56" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true"><path d="M4 16 L28 16 L34 10 L76 10 L76 50 L4 50 Z"/><path d="M4 22 L76 22" stroke-width="1"/></svg>`;

const TITLES: Record<Section, string> = {
  work: "WORK",
  projects: "PROJECTS",
};

function listTile(itemId: string, label: string, meta: string): string {
  return `<button class="folder-tile" type="button" data-folder-item="${esc(itemId)}" aria-label="${esc("Open " + label)}">
    ${FOLDER_SVG}
    <span class="folder-label">${esc(label)}</span>
    ${stampLine(meta)}
  </button>`;
}

function workListHtml(): string {
  const tiles = experience
    .map((r) => listTile(r.mod, r.org.toUpperCase(), r.role.toUpperCase()))
    .join("");
  return `<div class="desktop-grid desktop-grid--list">${tiles}</div>`;
}

function projectsListHtml(): string {
  const tiles = projects
    .map((p) => listTile(p.proj, p.title.toUpperCase(), `[${p.badge}]`))
    .join("");
  const gh = links.find((l) => l.key === "github");
  const ghLine = gh
    ? `<p class="linkline folder-modal-foot"><a href="${esc(gh.href)}" target="_blank" rel="noopener">MORE — ${esc(gh.display)} →</a></p>`
    : "";
  return `<div class="desktop-grid desktop-grid--list">${tiles}</div>${ghLine}`;
}

function detailTitle(section: Section, itemId: string): string {
  if (section === "work") {
    const r = experience.find((x) => x.mod === itemId);
    return r ? `${TITLES.work} / ${r.org.toUpperCase()}` : TITLES.work;
  }
  const p = projects.find((x) => x.proj === itemId);
  return p ? `${TITLES.projects} / ${p.title.toUpperCase()}` : TITLES.projects;
}

function detailHtml(section: Section, itemId: string): string | null {
  return section === "work"
    ? roleDetailContent(itemId)
    : projectDetailContent(itemId);
}

export function initDesktop(): void {
  const modal = document.querySelector<HTMLElement>("[data-folder-modal]");
  const titleEl = document.querySelector<HTMLElement>("[data-folder-modal-title]");
  const bodyEl = document.querySelector<HTMLElement>("[data-folder-modal-body]");
  const closeBtn = document.querySelector<HTMLElement>("[data-folder-modal-close]");
  if (!modal || !titleEl || !bodyEl || !closeBtn) return;

  let state: State = { level: "closed" };
  let lastFocus: HTMLElement | null = null;

  function lockScroll(lock: boolean): void {
    document.documentElement.style.overflow = lock ? "hidden" : "";
  }

  function setTitle(text: string): void {
    titleEl!.textContent = text;
  }

  function render(): void {
    if (state.level === "closed") {
      modal!.hidden = true;
      lockScroll(false);
      bodyEl!.innerHTML = "";
      setTitle("");
      return;
    }
    modal!.hidden = false;
    lockScroll(true);

    if (state.level === "list") {
      setTitle(TITLES[state.section]);
      bodyEl!.innerHTML =
        state.section === "work" ? workListHtml() : projectsListHtml();
      bodyEl!.scrollTop = 0;
      return;
    }

    // detail
    const content = detailHtml(state.section, state.itemId);
    if (!content) {
      // bad id — fall back to list
      state = { level: "list", section: state.section };
      render();
      return;
    }
    setTitle(detailTitle(state.section, state.itemId));
    bodyEl!.innerHTML = content;
    bodyEl!.scrollTop = 0;
    // re-bind .pcb-morph buttons that just got rendered
    initPcbMorph();
  }

  function goBack(): void {
    if (state.level === "detail") {
      state = { level: "list", section: state.section };
      render();
    } else if (state.level === "list") {
      state = { level: "closed" };
      render();
      if (lastFocus) {
        lastFocus.focus();
        lastFocus = null;
      }
    }
  }

  function openSection(section: Section, source: HTMLElement | null): void {
    if (state.level === "closed") {
      lastFocus = source;
    }
    state = { level: "list", section };
    render();
    closeBtn!.focus();
  }

  function openDetail(section: Section, itemId: string): void {
    state = { level: "detail", section, itemId };
    render();
    closeBtn!.focus();
  }

  // top-level tile clicks (desktop section)
  document.addEventListener("click", (event) => {
    const target = event.target as Element | null;
    if (!target) return;

    const tile = target.closest<HTMLElement>("[data-folder-tile]");
    if (tile) {
      const folder = tile.dataset.folderTile;
      if (folder === "work" || folder === "projects") {
        event.preventDefault();
        openSection(folder, tile);
      }
      return;
    }

    const item = target.closest<HTMLElement>("[data-folder-item]");
    if (item && state.level === "list") {
      const id = item.dataset.folderItem;
      if (id) {
        event.preventDefault();
        openDetail(state.section, id);
      }
      return;
    }
  });

  // close button + backdrop
  closeBtn.addEventListener("click", (event) => {
    event.preventDefault();
    goBack();
  });
  modal.addEventListener("click", (event) => {
    if (event.target === modal) goBack();
  });

  // escape key
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (state.level !== "closed") {
      event.preventDefault();
      goBack();
    }
  });
}
