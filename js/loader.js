/**
 * loader.js — Kinetic Loading Animation
 *
 * Inspired by Love Death + Robots opening sequences:
 * rapid circuit traces, hard cuts, kinetic text, white flash reveal.
 *
 * Timeline (4.4s total):
 *  0–400ms   : Black screen (tension)
 *  400–1900ms: Circuit traces erupt across screen
 *  1900–2700ms: Convergence — traces focus to center, targeting reticle
 *  2700–3600ms: Name reveal — CHRISTIAN slams from left, KIM from right, glitch
 *  3600–4400ms: Flash out — white builds, site reveals
 */

;(function () {
  const canvas  = document.getElementById('loader-canvas');
  const overlay = document.getElementById('loader-overlay');
  const site    = document.getElementById('site');
  const nav     = document.getElementById('nav');
  const loader  = document.getElementById('loader');
  const ctx     = canvas.getContext('2d');

  let W, H, raf;
  let t0 = null; // animation start time

  /* ── Timing constants (ms) ─────────────────────────────── */
  const T_CIRCUIT_START  =  400;
  const T_CIRCUIT_END    = 1900;
  const T_CONVERGE_END   = 2700;
  const T_NAME_CHRISTIAN = 2700;
  const T_NAME_KIM       = 2860;
  const T_ROLE           = 3050;
  const T_FLASH_START    = 3600;
  const T_TOTAL          = 4400;

  /* ── Palette ────────────────────────────────────────────── */
  const TEAL  = '#00FFB2';
  const BLUE  = '#0077FF';
  const WHITE = '#FFFFFF';

  /* ── Utility ────────────────────────────────────────────── */
  function resize () {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function lerp (a, b, t) { return a + (b - a) * t; }

  function easeOutExpo (t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function easeOutCubic (t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function easeInCubic (t) {
    return t * t * t;
  }

  function clamp01 (v) {
    return Math.max(0, Math.min(1, v));
  }

  /* progress between two time points, clamped 0→1 */
  function phase (elapsed, start, end) {
    return clamp01((elapsed - start) / (end - start));
  }

  /* ── Circuit Trace ──────────────────────────────────────── */
  class Trace {
    constructor () { this.reset(); }

    reset () {
      /* spawn near center but offset */
      const margin = 100;
      this.x = margin + Math.random() * (W - margin * 2);
      this.y = margin + Math.random() * (H - margin * 2);
      this.pts   = [{ x: this.x, y: this.y }];
      this.maxSeg = Math.floor(Math.random() * 7) + 4;
      this.seg    = 0;
      this.prog   = 0;               // 0→1 within current segment
      this.speed  = 0.025 + Math.random() * 0.035;
      this.color  = Math.random() < 0.18 ? BLUE : TEAL;
      this.lw     = Math.random() < 0.25 ? 1.4 : 0.7;
      this.alpha  = 0;
      this.targetAlpha = 0.45 + Math.random() * 0.55;
      this.done   = false;
      this._addSeg();
    }

    _addSeg () {
      if (this.seg >= this.maxSeg) { this.done = true; return; }
      const horiz  = Math.random() < 0.5;
      const length = (Math.random() * 130 + 50) * (Math.random() < 0.5 ? 1 : -1);
      const last   = this.pts[this.pts.length - 1];
      let nx = last.x + (horiz ? length : 0);
      let ny = last.y + (horiz ? 0 : length);
      nx = Math.max(10, Math.min(W - 10, nx));
      ny = Math.max(10, Math.min(H - 10, ny));
      this.pts.push({ x: nx, y: ny });
      this.seg++;
    }

    update () {
      this.alpha += (this.targetAlpha - this.alpha) * 0.07;
      if (this.done) return;
      this.prog += this.speed;
      if (this.prog >= 1) {
        this.prog = 0;
        this._addSeg();
      }
    }

    draw (ctx) {
      if (this.pts.length < 2) return;
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.strokeStyle = this.color;
      ctx.lineWidth   = this.lw;
      ctx.shadowBlur  = 5;
      ctx.shadowColor = this.color;
      ctx.lineCap     = 'round';

      ctx.beginPath();
      ctx.moveTo(this.pts[0].x, this.pts[0].y);
      for (let i = 1; i < this.pts.length - 1; i++) {
        ctx.lineTo(this.pts[i].x, this.pts[i].y);
      }

      /* current segment partially drawn */
      const prev = this.pts[this.pts.length - 2];
      const curr = this.pts[this.pts.length - 1];
      ctx.lineTo(
        prev.x + (curr.x - prev.x) * this.prog,
        prev.y + (curr.y - prev.y) * this.prog
      );
      ctx.stroke();

      /* traveling spark */
      if (!this.done && this.prog < 1) {
        const sx = prev.x + (curr.x - prev.x) * this.prog;
        const sy = prev.y + (curr.y - prev.y) * this.prog;
        ctx.beginPath();
        ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = WHITE;
        ctx.shadowBlur = 14;
        ctx.shadowColor = this.color;
        ctx.fill();
      }

      /* junction dots */
      for (let i = 0; i < this.pts.length - 1; i++) {
        ctx.beginPath();
        ctx.arc(this.pts[i].x, this.pts[i].y, 2, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 6;
        ctx.fill();
      }

      ctx.restore();
    }
  }

  /* ── Targeting Reticle ──────────────────────────────────── */
  function drawReticle (ctx, cx, cy, r, alpha, spin) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = TEAL;
    ctx.lineWidth   = 0.8;
    ctx.shadowBlur  = 8;
    ctx.shadowColor = TEAL;
    ctx.translate(cx, cy);
    ctx.rotate(spin);

    /* outer circle */
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    /* inner circle */
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2);
    ctx.stroke();

    /* cross hairs */
    const gap = r * 0.55;
    for (let a = 0; a < 4; a++) {
      ctx.rotate(Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, gap);
      ctx.lineTo(0, r * 1.15);
      ctx.stroke();
    }

    /* tick marks */
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const ir = r * 0.88, or = r;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * ir, Math.sin(angle) * ir);
      ctx.lineTo(Math.cos(angle) * or, Math.sin(angle) * or);
      ctx.stroke();
    }

    ctx.restore();
  }

  /* ── Scanline ───────────────────────────────────────────── */
  function drawScanlines (alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha * 0.35;
    for (let y = 0; y < H; y += 3) {
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.fillRect(0, y, W, 1);
    }
    /* moving scan band */
    const band = (performance.now() * 0.08) % (H + 40) - 20;
    ctx.globalAlpha = alpha * 0.04;
    ctx.fillStyle = TEAL;
    ctx.fillRect(0, band, W, 3);
    ctx.restore();
  }

  /* ── Text Helpers ───────────────────────────────────────── */
  function measureText (text, fontSize) {
    ctx.save();
    ctx.font = `700 ${fontSize}px 'Space Grotesk', sans-serif`;
    const w = ctx.measureText(text).width;
    ctx.restore();
    return w;
  }

  /**
   * Draw text with optional chromatic aberration (glitch RGB split)
   */
  function drawText (text, x, y, fontSize, color, alpha, glitch) {
    ctx.save();
    ctx.font        = `700 ${fontSize}px 'Space Grotesk', sans-serif`;
    ctx.textAlign   = 'center';
    ctx.textBaseline= 'middle';

    if (glitch > 0.02) {
      const ox = (Math.random() - 0.5) * glitch * 24;
      const oy = (Math.random() - 0.5) * glitch * 6;
      ctx.globalAlpha = alpha * 0.6;
      ctx.fillStyle   = '#FF0055';
      ctx.fillText(text, x + ox + 4, y + oy);
      ctx.fillStyle   = '#00FFFF';
      ctx.fillText(text, x - ox - 4, y - oy);
    }

    ctx.globalAlpha = alpha;
    ctx.shadowBlur  = glitch > 0.1 ? 0 : 20;
    ctx.shadowColor = color;
    ctx.fillStyle   = color;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  /* ── Noise / flicker ────────────────────────────────────── */
  function drawNoise (alpha) {
    if (alpha <= 0) return;
    ctx.save();
    const imgData = ctx.createImageData(W, H);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = Math.random() > 0.97 ? 255 : 0;
      d[i] = v; d[i+1] = v; d[i+2] = v;
      d[i+3] = v * alpha * 0.5;
    }
    ctx.putImageData(imgData, 0, 0);
    ctx.restore();
  }

  /* ── Animation state ────────────────────────────────────── */
  const traces = [];
  let traceBudget = 0; /* how many we've spawned */

  /* ── Main loop ──────────────────────────────────────────── */
  function tick (now) {
    if (!t0) t0 = now;
    const elapsed = now - t0;

    /* ── Clear ── */
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    /* ======================================================
       PHASE 1 — Circuit traces
    ====================================================== */
    if (elapsed >= T_CIRCUIT_START && elapsed < T_FLASH_START) {
      /* spawn traces rapidly */
      if (elapsed < T_CIRCUIT_END) {
        const density = phase(elapsed, T_CIRCUIT_START, T_CIRCUIT_END);
        const budget  = Math.floor(density * 55);
        while (traceBudget < budget) {
          traces.push(new Trace());
          traceBudget++;
        }
      }

      /* fade traces out as we approach flash */
      const fadeOut = elapsed > T_CONVERGE_END
        ? 1 - phase(elapsed, T_CONVERGE_END, T_FLASH_START)
        : 1;

      ctx.save();
      ctx.globalAlpha = fadeOut;
      for (const tr of traces) { tr.update(); tr.draw(ctx); }
      ctx.restore();
    }

    /* scanlines always on */
    drawScanlines(clamp01((elapsed - T_CIRCUIT_START) / 600));

    /* ======================================================
       PHASE 2 — Convergence reticle
    ====================================================== */
    if (elapsed >= T_CIRCUIT_END && elapsed < T_FLASH_START) {
      const t       = phase(elapsed, T_CIRCUIT_END, T_CONVERGE_END);
      const spin    = (elapsed * 0.001) % (Math.PI * 2);
      const r       = lerp(280, 90, easeOutCubic(t));
      const alpha   = elapsed < T_CONVERGE_END
        ? easeOutCubic(t)
        : 1 - phase(elapsed, T_CONVERGE_END, T_NAME_KIM);

      /* flicker effect right before name */
      const flicker = t > 0.85
        ? (Math.sin(elapsed * 0.04) > 0 ? 1 : 0.2)
        : 1;

      drawReticle(ctx, W / 2, H / 2, r, alpha * flicker, spin);

      /* corner data readouts — micrographic HUD elements */
      const hudAlpha = easeOutCubic(t) * flicker;
      ctx.save();
      ctx.globalAlpha = hudAlpha * 0.6;
      ctx.font        = `100 10px 'JetBrains Mono', monospace`;
      ctx.fillStyle   = TEAL;
      ctx.textAlign   = 'left';
      ctx.fillText('NODE_ACTIVE: CK-EE-001',  24, 24);
      ctx.fillText('FREQ: 168.000 MHz',        24, 38);
      ctx.fillText('SIG_INT: NOMINAL',         24, 52);
      ctx.textAlign = 'right';
      ctx.fillText('SYS_CLK: LOCKED',   W - 24, 24);
      ctx.fillText('CAP: 10.0 Gbps',    W - 24, 38);
      ctx.fillText('STATUS: [ACTIVE]',  W - 24, 52);
      ctx.textAlign = 'left';
      ctx.fillText('PCB_LAYER: 8',      24, H - 52);
      ctx.fillText('IMP: 100Ω ±5%',    24, H - 38);
      ctx.fillText('EYE: OPEN',        24, H - 24);
      ctx.textAlign = 'right';
      ctx.fillText('TEMP: 32.4°C',     W - 24, H - 52);
      ctx.fillText('ERR_RATE: 0.000%', W - 24, H - 38);
      ctx.fillText('// ONLINE',        W - 24, H - 24);
      ctx.restore();
    }

    /* ======================================================
       PHASE 3 — Name reveal (SLAM + GLITCH)
    ====================================================== */
    if (elapsed >= T_NAME_CHRISTIAN && elapsed < T_FLASH_START) {
      const nameSize  = Math.min(W * 0.125, 148);
      const roleSize  = Math.min(W * 0.018, 15);
      const centerY   = H / 2;

      /* CHRISTIAN slams from left */
      const t1        = phase(elapsed, T_NAME_CHRISTIAN, T_NAME_CHRISTIAN + 280);
      const glitch1   = t1 < 0.6 ? (1 - t1 / 0.6) * 1.2 : 0;
      const christX   = lerp(-W * 0.4, W / 2, easeOutExpo(t1));
      const alphaC    = t1;
      drawText('CHRISTIAN', christX, centerY - nameSize * 0.55, nameSize, WHITE, alphaC, glitch1);

      /* KIM slams from right */
      if (elapsed >= T_NAME_KIM) {
        const t2      = phase(elapsed, T_NAME_KIM, T_NAME_KIM + 260);
        const glitch2 = t2 < 0.6 ? (1 - t2 / 0.6) * 1.4 : 0;
        const kimX    = lerp(W * 1.4, W / 2, easeOutExpo(t2));
        const alphaK  = t2;
        drawText('KIM', kimX, centerY + nameSize * 0.52, nameSize, TEAL, alphaK, glitch2);
      }

      /* Role line types in */
      if (elapsed >= T_ROLE) {
        const t3      = phase(elapsed, T_ROLE, T_ROLE + 500);
        const chars   = '// ELECTRICAL ENGINEER';
        const shown   = Math.floor(t3 * chars.length);
        const partial = chars.slice(0, shown);

        ctx.save();
        ctx.globalAlpha = t3;
        ctx.font        = `200 ${roleSize}px 'JetBrains Mono', monospace`;
        ctx.textAlign   = 'center';
        ctx.textBaseline= 'middle';
        ctx.fillStyle   = TEAL;
        ctx.fillText(partial + (Math.random() > 0.4 ? '█' : ''), W / 2, centerY + nameSize * 0.52 + nameSize * 0.7);
        ctx.restore();
      }

      /* subtle vignette around text */
      const grad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H)*0.6);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.7)');
      ctx.save();
      ctx.globalAlpha = phase(elapsed, T_NAME_CHRISTIAN, T_FLASH_START);
      ctx.fillStyle   = grad;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    /* sparse noise */
    if (elapsed < T_FLASH_START) {
      drawNoise(0.03);
    }

    /* ======================================================
       PHASE 4 — White flash out
    ====================================================== */
    if (elapsed >= T_FLASH_START) {
      const t = phase(elapsed, T_FLASH_START, T_TOTAL);

      /* ramp up then hard cut */
      let flashOpacity;
      if (t < 0.45) {
        flashOpacity = easeOutCubic(t / 0.45);
      } else {
        flashOpacity = 1 - easeInCubic((t - 0.45) / 0.55);
      }
      overlay.style.opacity = flashOpacity;

      /* also force a hard white frame at peak */
      if (t > 0.38 && t < 0.55) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, W, H);
      }
    }

    /* ======================================================
       Done
    ====================================================== */
    if (elapsed >= T_TOTAL) {
      loader.style.transition = 'opacity 0.5s ease';
      loader.style.opacity    = '0';
      site.classList.add('visible');
      nav.classList.add('visible');
      setTimeout(() => { loader.remove(); }, 500);
      return;
    }

    raf = requestAnimationFrame(tick);
  }

  /* ── Kick off after fonts load ─────────────────────────── */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      raf = requestAnimationFrame(tick);
    });
  } else {
    raf = requestAnimationFrame(tick);
  }
})();
