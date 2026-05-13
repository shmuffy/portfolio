/* PCB → 3D morph orchestrator (eager, tiny — must NOT statically import three
   or ./pcb3dViewer; the viewer is reached ONLY via dynamic import() so three
   stays in its own async chunk). Per stage: a small state machine that toggles
   the .is-3d class (CSS tilts the flat <img> out / cross-fades the canvas in),
   lazy-loads the viewer on click, shows loading/error stamps, and reverts on
   Escape or a pointerdown outside the figure. */

type State = "flat" | "loading" | "3d" | "reverting";

interface ViewerHandle {
  dispose(): void;
  resize(): void;
}

export function initPcbMorph(): void {
  document.querySelectorAll<HTMLButtonElement>(".pcb-morph").forEach((stage) => setup(stage));
}

function setup(stage: HTMLButtonElement): void {
  const rawGlb = stage.dataset.glb;
  if (!rawGlb) return;
  const glbUrl: string = rawGlb;

  let state: State = "flat";
  let handle: ViewerHandle | null = null;
  let ro: ResizeObserver | null = null;
  let revertTimer: number | null = null;
  let onCanvasEnd: ((e: TransitionEvent) => void) | null = null;
  let cancelledLoad = false;
  let backBtn: HTMLButtonElement | null = null;

  function setStatus(text: string | null, isError = false): void {
    let el = stage.querySelector<HTMLParagraphElement>(".pcb-morph-status");
    if (text == null) {
      el?.remove();
      return;
    }
    if (!el) {
      el = document.createElement("p");
      el.className = "pcb-morph-status stamp";
      stage.appendChild(el);
    }
    el.classList.toggle("is-error", isError);
    el.textContent = text;
  }

  function addBackButton(): void {
    if (backBtn) return;
    backBtn = document.createElement("button");
    backBtn.type = "button";
    backBtn.className = "pcb-morph-back";
    backBtn.textContent = "← BACK";
    backBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      revert();
    });
    stage.appendChild(backBtn);
  }

  function removeBackButton(): void {
    backBtn?.remove();
    backBtn = null;
  }

  const onKey = (e: KeyboardEvent): void => {
    if (e.key === "Escape") revert();
  };
  const onAway = (e: PointerEvent): void => {
    const t = e.target as Element | null;
    if (!t || !t.closest(".pcb-morph")) revert();
  };

  function detachDocListeners(): void {
    document.removeEventListener("keydown", onKey);
    document.removeEventListener("pointerdown", onAway, true);
  }

  async function activate(): Promise<void> {
    if (state !== "flat") return;
    state = "loading";
    cancelledLoad = false;
    // keep the flat board ON SCREEN (just a hair dimmed) while the 3D chunk +
    // the GLB download — so there's no blank gap; the model is rendered before
    // we cross-fade to it.
    stage.classList.add("is-loading");
    setStatus("LOADING 3D MODEL");
    try {
      const { mountModel } = await import("./pcb3dViewer");
      const h = await mountModel(stage, glbUrl, {
        onProgress: (f) =>
          setStatus(f == null ? "LOADING 3D MODEL" : "LOADING 3D MODEL · " + Math.round(f * 100) + "%"),
      });
      if (cancelledLoad) {
        h.dispose();
        state = "flat";
        stage.classList.remove("is-loading");
        setStatus(null);
        return;
      }
      handle = h;
      state = "3d";
      setStatus(null);
      // model is loaded and has painted a frame → now cross-fade: flat img tilts
      // out / 3D canvas (already showing the model) fades + settles in.
      stage.classList.remove("is-loading");
      stage.classList.add("is-3d");
      ro = new ResizeObserver(() => handle?.resize());
      ro.observe(stage);
      document.addEventListener("keydown", onKey);
      document.addEventListener("pointerdown", onAway, true);
      addBackButton();
    } catch (err) {
      const msg =
        err instanceof Error && err.message === "WEBGL_UNAVAILABLE"
          ? "3D NOT SUPPORTED"
          : "3D MODEL FAILED TO LOAD";
      stage.classList.remove("is-loading");
      setStatus(msg, true);
      state = "reverting";
      window.setTimeout(() => {
        setStatus(null);
        hardRevert();
      }, 1600);
    }
  }

  function revert(): void {
    if (state === "loading") {
      cancelledLoad = true;
      stage.classList.remove("is-loading");
      setStatus(null);
      state = "flat";
      return;
    }
    if (state !== "3d") return;
    state = "reverting";
    detachDocListeners();
    ro?.disconnect();
    ro = null;
    removeBackButton();
    stage.classList.remove("is-3d");

    const canvas = stage.querySelector<HTMLCanvasElement>(".pcb-morph-canvas");

    const finalize = (): void => {
      if (state !== "reverting") return;
      if (revertTimer != null) {
        clearTimeout(revertTimer);
        revertTimer = null;
      }
      if (canvas && onCanvasEnd) canvas.removeEventListener("transitionend", onCanvasEnd);
      onCanvasEnd = null;
      handle?.dispose();
      handle = null;
      setStatus(null);
      state = "flat";
    };

    if (canvas) {
      onCanvasEnd = (e: TransitionEvent): void => {
        if (e.target === canvas && e.propertyName === "opacity") finalize();
      };
      canvas.addEventListener("transitionend", onCanvasEnd);
    }
    revertTimer = window.setTimeout(finalize, 650);
  }

  function hardRevert(): void {
    detachDocListeners();
    ro?.disconnect();
    ro = null;
    removeBackButton();
    if (revertTimer != null) {
      clearTimeout(revertTimer);
      revertTimer = null;
    }
    handle?.dispose();
    handle = null;
    stage.classList.remove("is-3d");
    stage.classList.remove("is-loading");
    setStatus(null);
    state = "flat";
  }

  stage.addEventListener("click", () => {
    void activate();
  });
}
