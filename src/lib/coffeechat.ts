import { links } from "../data/site";

/** One revealed contact line: "LABEL · value" rendered as a finished link. */
interface Line {
  label: string;
  value: string;
  href: string;
  /** open in a new tab */
  newTab?: boolean;
}

function lineSpecs(): Line[] {
  const find = (k: string) => links.find((l) => l.key === k);
  const email = find("email");
  const linkedin = find("linkedin");
  const resume = find("resume");
  const out: Line[] = [];
  if (email)
    out.push({ label: "EMAIL", value: email.display, href: email.href });
  if (linkedin)
    out.push({
      label: "LINKEDIN",
      value: linkedin.display,
      href: linkedin.href,
      newTab: true,
    });
  if (resume)
    out.push({
      label: "RESUME",
      value: resume.display,
      href: resume.href,
      newTab: true,
    });
  return out;
}

/** Build a finished contact line: "LABEL · <a>value</a>". */
function finishedLine(line: Line): HTMLParagraphElement {
  const p = document.createElement("p");
  p.className = "coffee-line coffee-line--done";

  const lab = document.createElement("span");
  lab.className = "coffee-label";
  lab.textContent = line.label;

  const sep = document.createElement("span");
  sep.className = "coffee-sep";
  sep.setAttribute("aria-hidden", "true");
  sep.textContent = " · ";

  const a = document.createElement("a");
  a.className = "coffee-val";
  a.href = line.href;
  a.textContent = line.value;
  if (line.newTab) {
    a.target = "_blank";
    a.rel = "noopener";
  }

  p.append(lab, sep, a);
  return p;
}

export function initCoffeeChat(): void {
  // the trigger lives on the card BACK; tapping it fades the contact links in
  // (Harry-Potter style ink-resolve); tapping again fades them back out.
  const trigger = document.querySelector<HTMLButtonElement>(
    ".card-back .coffee-trigger",
  );
  const box = document.getElementById("coffee-lines");
  if (!trigger || !box) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let open = false;
  // collapse bookkeeping (one transitionend + fallback timer at a time)
  let collapsing = false;
  let collapseTimer: number | null = null;
  let onCollapseEnd: ((e: TransitionEvent) => void) | null = null;

  /** Tear down any in-flight collapse animation cleanly (no DOM clear here). */
  const cancelCollapse = (): void => {
    if (collapseTimer !== null) {
      window.clearTimeout(collapseTimer);
      collapseTimer = null;
    }
    if (onCollapseEnd) {
      box.removeEventListener("transitionend", onCollapseEnd);
      onCollapseEnd = null;
    }
    box.classList.remove("is-dissolving");
    collapsing = false;
  };

  /** Final state once a collapse is fully done. */
  const finishCollapse = (): void => {
    cancelCollapse();
    box.classList.remove("is-revealed");
    box.replaceChildren();
    box.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    open = false;
  };

  const expand = (): void => {
    cancelCollapse();
    box.replaceChildren(
      ...lineSpecs().map((line, i) => {
        const el = finishedLine(line);
        el.style.setProperty("--coffee-i", String(i));
        return el;
      }),
    );
    box.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    open = true;

    if (reduce) {
      // CSS reduced-motion override makes this instant; class kept for parity
      box.classList.add("is-revealed");
      return;
    }
    // next frame so the lines have a "from" (hidden) state to transition from
    requestAnimationFrame(() => {
      if (open) box.classList.add("is-revealed");
    });
  };

  const collapse = (): void => {
    if (reduce) {
      finishCollapse();
      return;
    }
    if (collapsing) return; // already fading out — leave it running

    collapsing = true;
    open = false;

    onCollapseEnd = (e: TransitionEvent): void => {
      if (e.target !== box) return;
      finishCollapse();
    };
    box.addEventListener("transitionend", onCollapseEnd);
    // fallback in case transitionend never fires (~750ms vs ~700ms transition)
    collapseTimer = window.setTimeout(finishCollapse, 750);

    // next frame so the transition has a "from" state to animate from
    requestAnimationFrame(() => {
      if (collapsing) {
        box.classList.remove("is-revealed");
        box.classList.add("is-dissolving");
      }
    });
  };

  trigger.addEventListener("click", () => {
    if (open) collapse();
    else expand();
  });

  // flipping the card back to the front closes the list (collapse() handles the
  // reduced-motion / mid-collapse cases). Tapping to the back is a no-op here.
  document.querySelector(".card")?.addEventListener("cardface", (e) => {
    const ev = e as CustomEvent<{ face: "front" | "back" }>;
    if (ev.detail.face === "front" && open) collapse();
  });
}
