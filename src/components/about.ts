import { site } from "../data/site";
import { esc } from "./micro";

/* ---------------------------------------------------------------------------
   SHARED CONTRACT — the magic business card (three.js / CSS3DRenderer edition)

   DOM (built here):
     section#about[position:relative]
       div.card-shadow[aria-hidden]            ← cast shadow; NOT in the 3D chain; JS writes --shadow-sx/tx/ty
       div.card3d-host                          ← CSS3DRenderer mounts here, owns pointer/keyboard input
         div.card[data-face="front"|"back"]   ← three.js (via CSS3DObject) drives this element's wrapper transform
           div.card-face.card-front             ← the 4 .ink-line <p>s (style="--ink-i:0..3"), bone+paper.png texture
           div.card-face.card-back              ← button.coffee-trigger + div#coffee-lines
     a.scroll-hint[href="#work"]               ← unchanged sibling after </section>

   State / classes:
     .card[data-face="front"|"back"]   — set by card3d on flip.
     .card3d-host.is-dragging          — added while a pointer drag is active.
     .card-back[inert][aria-hidden]    ⇔ data-face="front"  (mirrored on .card-front when data-face="back"). card3d owns.
     .card-back.is-expanded            — iff the contact lines are showing; coffeechat owns.
     .ink-line / .ink-line.is-written  — inkreveal toggles .is-written; --ink-i set in markup here.

   Interaction: drag-orbit (no spring-back), click to flip ±180° around Y. A 4 px movement threshold suppresses
   the trailing click so a drag never triggers a flip. Keyboard ArrowLeft / ArrowRight / Space / Enter flip too.

   Events (the only runtime coupling besides class names):
     card3d → 'cardface' { detail:{ face:'front'|'back' }, bubbles:true } on .card, on flip.
     card3d → 'card-landed' { bubbles:true } on .card, on entrance completion.
     fliphint → 'card3d:wobble' on .card to play the auto-tease wobble.
     coffeechat listens for 'cardface': face==='front' → collapse(); face==='back' → no-op.

   Custom props the card3d render loop writes each frame:
     --tilt-x / --tilt-y on .card (feeds the .card-face sun-lighting gradient)
     --shadow-sx / --shadow-tx / --shadow-ty on .card-shadow
--------------------------------------------------------------------------- */

export function about(): string {
  const name = esc(site.name.toUpperCase());
  const role = esc(site.role.toUpperCase());
  const focus = esc(site.focus.toUpperCase());
  const location = esc(
    (site.location.toUpperCase() + ", USA").replace(/,\s*/g, " · "),
  );

  return `<section class="block-section" id="about" aria-labelledby="about-name">
    <div class="card-shadow" aria-hidden="true"></div>
    <div class="card3d-host">
      <div class="card" data-face="front">
        <div class="card-face card-front">
          <p class="name ink-line" id="about-name" style="--ink-i:0">${name}</p>
          <p class="stamp ink-line" style="--ink-i:1">${role}</p>
          <p class="spacer" aria-hidden="true">&nbsp;</p>
          <p class="row ink-line" style="--ink-i:2"><span class="g"></span><span class="t">${focus}</span><span class="g"></span></p>
          <p class="spacer" aria-hidden="true">&nbsp;</p>
          <p class="row ink-line" style="--ink-i:3"><span class="g"></span><span class="t">${location}</span><span class="g"></span></p>
        </div>
        <div class="card-face card-back">
          <button type="button" class="coffee-trigger" aria-expanded="false" aria-controls="coffee-lines">COFFEE CHAT?</button>
          <div class="coffee-lines" id="coffee-lines" role="region" aria-label="Contact links" hidden></div>
        </div>
        <div class="card-edge card-edge-top" aria-hidden="true"></div>
        <div class="card-edge card-edge-bottom" aria-hidden="true"></div>
        <div class="card-edge card-edge-left" aria-hidden="true"></div>
        <div class="card-edge card-edge-right" aria-hidden="true"></div>
      </div>
    </div>
    <a class="scroll-hint" href="#desktop" aria-label="Scroll to Desktop">
      <span class="srocket-stage" aria-hidden="true">
        <!-- rocket facing UP with exhaust flame -->
        <svg class="srocket" viewBox="0 0 20 34" overflow="visible"
             fill="none" stroke="currentColor"
             stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">
          <!-- exhaust flame: outer (intensity) wraps inner (flicker); both extend below viewBox -->
          <g class="srocket-flame">
            <g class="srocket-flame-flicker">
              <path class="srocket-flame-outer" d="M7 32 Q6.5 38 8 43 Q9 47 10 50 Q11 47 12 43 Q13.5 38 13 32 Z" fill="#ff7a2a" stroke="none"/>
              <path class="srocket-flame-inner" d="M8.5 32 Q8.2 36 9 40 Q9.5 44 10 46 Q10.5 44 11 40 Q11.8 36 11.5 32 Z" fill="#ffd166" stroke="none"/>
            </g>
          </g>
          <path d="M10 2 L5 14 L5 26 L8.5 29.5 L11.5 29.5 L15 26 L15 14 Z"/>
          <path d="M8.5 29.5 L7.5 32 L12.5 32 L11.5 29.5"/>
          <path d="M5 20 L1 26 L5 27.5"/>
          <path d="M15 20 L19 26 L15 27.5"/>
          <circle cx="10" cy="15" r="2.5"/>
        </svg>
        <span class="srocket-arr">↓</span>
      </span>
    </a>
  </section>`;
}
