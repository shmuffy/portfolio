import "./style.css";

import { nav } from "./components/nav";
import { about } from "./components/about";
import { workSection } from "./components/work";
import { contactSection } from "./components/contact";
import { initReveal } from "./lib/reveal";
import { initScrollSpy } from "./lib/scrollspy";
import { initCard3d } from "./lib/card3d";
import { initLoadingCard } from "./lib/loadingcard";
import { initInkReveal } from "./lib/inkreveal";
import { initFlipHint } from "./lib/fliphint";
import { initCoffeeChat } from "./lib/coffeechat";
import { initPcbMorph } from "./lib/pcbmorph";

const app = document.querySelector<HTMLDivElement>("#app");

if (app) {
  app.innerHTML = `
    ${nav()}
    <main class="stack" id="main">
      ${about()}
      ${workSection()}
      ${contactSection()}
    </main>
  `;

  initReveal();
  initScrollSpy();
  initCard3d();
  initInkReveal();
  initLoadingCard();
  initFlipHint();
  initCoffeeChat();
  initPcbMorph();

  // content is injected after parse, so a deep link (e.g. /#work) won't have
  // scrolled to anything yet — do it now that the targets exist
  if (location.hash.length > 1) {
    const target = document.getElementById(location.hash.slice(1));
    if (target) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
  }
}
