/**
 * loader.js — Micrographics Print-Press Loader
 *
 * Aesthetic: product spec sheet / industrial print production.
 * Not a terminal. Not a circuit board. A high-speed PRINT RUN.
 *
 * Animation arc (≈3.2s total):
 *  0 – 300ms    : Empty paper — tension
 *  300 – 1700ms : Micro-text items APPEAR hard (no fade) one by one,
 *                 scattered like a spec sheet compositing itself
 *  1700 – 2100ms: Horizontal rules draw across
 *  2100ms        : "CHRISTIAN" slams in — hard cut, massive condensed
 *  2380ms        : "KIM" appears below — hard cut
 *  2600ms        : Subtitle / classification line
 *  2700 – 3100ms: Rapid projector-flicker (paper ↔ black)
 *  3100ms        : Site loads
 */

;(function () {

  const loader  = document.getElementById('loader');
  const canvas  = loader.querySelector('canvas');
  const site    = document.getElementById('site');
  const nav     = document.getElementById('nav');
  const ctx     = canvas.getContext('2d');

  let W, H, raf;
  let t0 = null;

  const PAPER = '#EDEBE3';
  const INK   = '#1A1916';
  const MID   = '#6B6860';

  /* ── Sizing ──────────────────────────────────────── */
  function resize () {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  /* ── Timing ──────────────────────────────────────── */
  const T_ITEMS_START  =  300;
  const T_ITEMS_END    = 1700;
  const T_RULES        = 1700;
  const T_RULES_END    = 2100;
  const T_NAME_1       = 2100;
  const T_NAME_2       = 2380;
  const T_SUB          = 2600;
  const T_FLICKER      = 2700;
  const T_DONE         = 3200;

  /* ── Scatter items — fixed layout, like a composed sheet ── */
  /* Positions are proportional (0–1) so they scale with viewport */
  const ITEMS = [
    /* classification strip — top */
    { t:'CHRISTIAN KIM CO.',    x:.04, y:.07, size: 9, font:'mono', color: MID,  rot: 0 },
    { t:'SERIES 01 / 12',        x:.38, y:.07, size: 9, font:'mono', color: MID,  rot: 0 },
    { t:'2026',                  x:.72, y:.07, size: 9, font:'mono', color: MID,  rot: 0 },
    { t:'EST. BEAVERTON, OREGON',x:.85, y:.07, size: 8, font:'mono', color: MID,  rot: 0 },

    /* left vertical stamp */
    { t:'CIRCUIT DESIGN · PCB LAYOUT · EMBEDDED SYSTEMS',
                                 x:.03, y:.55, size: 8, font:'mono', color: INK, rot:-90, alpha:.2 },

    /* right vertical stamp */
    { t:'SIGNAL INTEGRITY · REGULATORY COMPLIANCE · EE',
                                 x:.97, y:.48, size: 8, font:'mono', color: INK, rot: 90, alpha:.2 },

    /* scattered classification marks */
    { t:'NSRL — EE RESEARCH LAB',x:.04, y:.15, size: 8, font:'mono', color: MID,  rot: 0 },
    { t:'NODE: CK-EE-001',       x:.68, y:.15, size: 8, font:'mono', color: MID,  rot: 0 },
    { t:'/////',                 x:.04, y:.82, size:13, font:'mono', color: INK,  rot: 0, alpha:.35 },
    { t:'OUTPUT: SYSTEMS',       x:.04, y:.88, size: 8, font:'mono', color: MID,  rot: 0 },
    { t:'INPUT: PROBLEMS',       x:.04, y:.92, size: 8, font:'mono', color: MID,  rot: 0 },
    { t:'COMPLIANCE: IPC-2581 · IEEE',
                                 x:.55, y:.88, size: 8, font:'mono', color: MID,  rot: 0 },
    { t:'V=IR',                  x:.84, y:.82, size:28, font:'display',color:INK, rot: 0, alpha:.12 },
    { t:'IDENTIFICATION NO. 0xCK00001-2026',
                                 x:.38, y:.92, size: 8, font:'mono', color: MID,  rot: 0 },

    /* corner registration marks + circles */
    { t:'+', x:.04, y:.04, size:18, font:'mono', color: INK, rot:0, alpha:.55, regMark: true },
    { t:'+', x:.96, y:.04, size:18, font:'mono', color: INK, rot:0, alpha:.55, regMark: true },
    { t:'+', x:.04, y:.96, size:18, font:'mono', color: INK, rot:0, alpha:.55, regMark: true },
    { t:'+', x:.96, y:.96, size:18, font:'mono', color: INK, rot:0, alpha:.55, regMark: true },

    /* caution triangle zone */
    { t:'CAUTION',               x:.36, y:.12, size:10, font:'mono', color: INK, rot:0, alpha:.4  },
    { t:'△',                     x:.47, y:.12, size:16, font:'mono', color: INK, rot:0, alpha:.4  },

    /* MADE IN block */
    { t:'MADE IN USA · >>>',     x:.04, y:.96, size: 8, font:'mono', color: MID, rot:0 },

    /* data row mid-right */
    { t:'PARAMETER',             x:.62, y:.82, size: 8, font:'mono', color: MID, rot:0 },
    { t:'CK-PCB-EE',             x:.72, y:.86, size:10, font:'mono', color: INK, rot:0 },
    { t:'394.41 — 394.41',       x:.72, y:.91, size: 8, font:'mono', color: MID, rot:0 },
  ];

  /* stagger: each item gets a scheduled appearance time */
  const totalItems = ITEMS.length;
  const staggerMs  = (T_ITEMS_END - T_ITEMS_START) / totalItems;
  const visible    = new Array(totalItems).fill(false);

  /* ── Utility ─────────────────────────────────────── */
  function clamp01 (v) { return Math.max(0, Math.min(1, v)); }
  function phase (e, a, b) { return clamp01((e - a) / (b - a)); }

  function setFont (size, type) {
    if (type === 'display') {
      ctx.font = `800 ${size}px 'Barlow Condensed', 'Arial Narrow', sans-serif`;
    } else {
      ctx.font = `400 ${size}px 'IBM Plex Mono', monospace`;
    }
  }

  /* Registration circle around the + mark */
  function drawRegMark (x, y, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha * 0.55;
    ctx.strokeStyle = INK;
    ctx.lineWidth   = 0.8;
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  /* ── Main tick ───────────────────────────────────── */
  function tick (now) {
    if (!t0) t0 = now;
    const e = now - t0; // elapsed ms

    /* Clear with paper */
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, W, H);

    /* ── PHASE 1: items appear ───────────────────── */
    for (let i = 0; i < totalItems; i++) {
      const appearsAt = T_ITEMS_START + i * staggerMs;
      if (e >= appearsAt) visible[i] = true;
    }

    for (let i = 0; i < totalItems; i++) {
      if (!visible[i]) continue;
      const item = ITEMS[i];
      const px = item.x * W;
      const py = item.y * H;
      const a  = item.alpha !== undefined ? item.alpha : 1;

      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(px, py);
      if (item.rot) ctx.rotate(item.rot * Math.PI / 180);
      setFont(item.size, item.font);
      ctx.fillStyle   = item.color;
      ctx.textBaseline = 'middle';
      ctx.textAlign    = item.rot < 0 ? 'right' : (item.rot > 0 ? 'left' : 'left');
      ctx.fillText(item.t, 0, 0);
      ctx.restore();

      if (item.regMark) {
        drawRegMark(px, py, a);
      }
    }

    /* ── PHASE 2: horizontal rules draw across ───── */
    if (e >= T_RULES) {
      const rp = phase(e, T_RULES, T_RULES_END);

      /* top rule */
      ctx.save();
      ctx.fillStyle   = INK;
      ctx.globalAlpha = 0.55;
      ctx.fillRect(0, H * 0.1, W * rp, 0.75);
      /* bottom rule */
      ctx.fillRect(0, H * 0.9, W * rp, 0.75);
      ctx.restore();
    }

    /* ── PHASE 3: NAME — hard cuts ───────────────── */
    if (e >= T_NAME_1 && e < T_FLICKER) {
      /* dim everything behind */
      ctx.fillStyle   = 'rgba(237,235,227,0.6)';
      ctx.fillRect(0, 0, W, H);

      const nameSize = Math.min(W * 0.165, 200);

      /* "CHRISTIAN" */
      ctx.save();
      ctx.font         = `800 ${nameSize}px 'Barlow Condensed', 'Arial Narrow', sans-serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle    = INK;
      ctx.fillText('CHRISTIAN', W / 2, H / 2 - nameSize * 0.55);
      ctx.restore();

      /* "KIM" */
      if (e >= T_NAME_2) {
        ctx.save();
        ctx.font         = `800 ${nameSize}px 'Barlow Condensed', 'Arial Narrow', sans-serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle    = INK;
        ctx.fillText('KIM', W / 2, H / 2 + nameSize * 0.5);
        ctx.restore();
      }

      /* subtitle */
      if (e >= T_SUB) {
        ctx.save();
        ctx.font         = `300 ${Math.min(W * 0.018, 15)}px 'IBM Plex Mono', monospace`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle    = MID;
        ctx.globalAlpha  = phase(e, T_SUB, T_SUB + 300);
        ctx.fillText('ELECTRICAL ENGINEER · SERIES 01 · CK-EE-001', W / 2, H / 2 + nameSize * 0.5 + nameSize * 0.5 + 14);
        ctx.restore();
      }

      /* Thin rules flanking the name */
      ctx.save();
      ctx.fillStyle   = INK;
      ctx.globalAlpha = 0.3;
      ctx.fillRect(W * 0.1, H / 2 - nameSize * 1.1, W * 0.8, 0.75);
      ctx.fillRect(W * 0.1, H / 2 + nameSize * 1.0, W * 0.8, 0.75);
      ctx.restore();
    }

    /* ── PHASE 4: flicker / projector ───────────── */
    if (e >= T_FLICKER) {
      const fp = phase(e, T_FLICKER, T_DONE);
      /* Rapid alternation: black frames at specific intervals */
      const flickers = [0, 0.15, 0.28, 0.42, 0.56, 0.68, 0.80];
      for (const f of flickers) {
        if (fp >= f && fp < f + 0.07) {
          ctx.fillStyle = INK;
          ctx.fillRect(0, 0, W, H);
          break;
        }
      }
    }

    /* ── Done ────────────────────────────────────── */
    if (e >= T_DONE) {
      site.classList.add('visible');
      nav.classList.add('visible');
      loader.style.transition = 'opacity 0.35s ease';
      loader.style.opacity    = '0';
      setTimeout(() => loader.remove(), 350);
      return;
    }

    raf = requestAnimationFrame(tick);
  }

  /* Kick off after fonts ─────────────────────────── */
  const start = () => { raf = requestAnimationFrame(tick); };
  document.fonts && document.fonts.ready
    ? document.fonts.ready.then(start)
    : setTimeout(start, 100);

})();
