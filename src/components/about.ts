import { site } from "../data/site";
import { esc } from "./micro";

/* ---------------------------------------------------------------------------
   SHARED CONTRACT — the magic business card (Agents B + C adhere)

   DOM (built here): 6 nested transform layers + a fake floor shadow.
     section#about[position:relative]
       div.card-shadow[aria-hidden]            ← cast shadow; NOT in the 3D chain; follows --drag-x/y too
       div.card-stage                          ← perspective camera; entrance only, no live transform
         div.card-drag                          ← free-drag translate: translate(var(--drag-x), var(--drag-y)); JS writes those
           div.card-tilt                        ← parallax: rotateX/Y(var(--tilt-x/y))
             div.card-float                      ← idle bob (pure CSS, off w/ reduced-motion)
               div.card[data-face="front"|"back"]  ← rotateY(var(--flip)); .7s transition ALWAYS on; .is-dragging / .is-entering
                 div.card-face.card-front          ← the 4 .ink-line <p>s (style="--ink-i:0..3"), bone+paper.png texture
                 div.card-face.card-back           ← button.coffee-trigger + div#coffee-lines
     a.scroll-hint[href="#work"]               ← unchanged sibling after </section>

   State / classes (single sources of truth):
     .card[data-face="front"|"back"]   — set by card3d only, on flip.
     .card.is-dragging                 — present only during a confirmed drag; CSS only changes cursor (flip transition stays on).
     .card.is-entering                 — on init pre-rAF; inkreveal removes it next frame to play the entrance.
     .card-back[inert][aria-hidden]    ⇔ data-face="front"  (mirrored on .card-front when data-face="back"). card3d owns.
     .card-back.is-expanded            — iff the contact lines are showing; coffeechat owns (may be unused).
     .ink-line / .ink-line.is-written  — C owns the CSS; inkreveal toggles .is-written. --ink-i set in markup here.

   Drag-to-flip mechanic: dragging only TRANSLATES the card (writes --drag-x/--drag-y on .card-drag, clamped to #about's
   bounds); a horizontal displacement past FLIP_THRESHOLD during a drag triggers one clean animated rotateY 0↔180, then
   rebases — keep nudging and it flips back. No pointer-driven rotation, no spring-back. Card stays where you drop it.

   Events (the only runtime coupling besides class names):
     card3d → new CustomEvent('cardface', { detail:{ face:'front'|'back' }, bubbles:true }) on .card, on flip.
     coffeechat listens: face==='front' → collapse(); face==='back' → no-op.

   CSS custom props JS writes (card3d owns all):
     --flip (deg, on .card); --drag-x/--drag-y (px, on .card-drag); --tilt-x/--tilt-y (deg, on .card-tilt);
     --shadow-sx (unitless), --shadow-tx/--shadow-ty (px) on .card-shadow (which also reads --drag-x/--drag-y).
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
    <div class="card-stage is-loading">
      <div class="card-drag">
        <div class="card-tilt">
          <div class="card-float">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
  <a class="scroll-hint" href="#work" aria-label="Scroll to Work">↓</a>`;
}
