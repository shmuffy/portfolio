/**
 * main.js — Site interactions
 *
 * - Magnetic custom cursor
 * - Hero ambient particle canvas
 * - IntersectionObserver scroll reveals
 * - Nav scroll behavior
 * - Project card 3D tilt
 */

;(function () {

  /* ============================================================
     CUSTOM CURSOR — magnetic, lagging outer ring
  ============================================================ */

  const cursorOuter = document.getElementById('cursor-outer');
  const cursorInner = document.getElementById('cursor-inner');

  let mx = 0, my = 0;    // real mouse position
  let ox = 0, oy = 0;    // outer ring (lagging)

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    cursorInner.style.left = mx + 'px';
    cursorInner.style.top  = my + 'px';
  });

  (function animCursor () {
    ox += (mx - ox) * 0.1;
    oy += (my - oy) * 0.1;
    cursorOuter.style.left = ox + 'px';
    cursorOuter.style.top  = oy + 'px';
    requestAnimationFrame(animCursor);
  })();

  /* hover state */
  const hoverTargets = document.querySelectorAll(
    'a, button, .project-card, .tag, .c-link'
  );
  hoverTargets.forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });

  /* ============================================================
     NAV — scrolled class
  ============================================================ */

  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });

  /* ============================================================
     SMOOTH ANCHOR SCROLL
  ============================================================ */

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ============================================================
     SCROLL REVEAL — IntersectionObserver
  ============================================================ */

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* ============================================================
     HERO CANVAS — ambient circuit / particle network
  ============================================================ */

  const heroEl     = document.getElementById('hero');
  const heroCanvas = document.getElementById('hero-canvas');
  const hCtx       = heroCanvas.getContext('2d');

  let hW, hH;

  function resizeHero () {
    hW = heroCanvas.width  = heroEl.offsetWidth;
    hH = heroCanvas.height = heroEl.offsetHeight;
  }
  resizeHero();
  window.addEventListener('resize', resizeHero, { passive: true });

  /* Particles */
  const PARTICLE_COUNT = 70;
  const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
    x:  Math.random() * (heroEl.offsetWidth  || window.innerWidth),
    y:  Math.random() * (heroEl.offsetHeight || window.innerHeight),
    vx: (Math.random() - 0.5) * 0.25,
    vy: (Math.random() - 0.5) * 0.25,
    r:  Math.random() * 1.4 + 0.4,
    a:  Math.random() * 0.3 + 0.08,
  }));

  let heroMX = -1000, heroMY = -1000;
  heroEl.addEventListener('mousemove', (e) => {
    const r = heroCanvas.getBoundingClientRect();
    heroMX = e.clientX - r.left;
    heroMY = e.clientY - r.top;
  });
  heroEl.addEventListener('mouseleave', () => { heroMX = -1000; heroMY = -1000; });

  (function animHero () {
    hCtx.clearRect(0, 0, hW, hH);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = hW;
      if (p.x > hW) p.x = 0;
      if (p.y < 0) p.y = hH;
      if (p.y > hH) p.y = 0;

      /* gentle mouse attraction */
      const dx = heroMX - p.x;
      const dy = heroMY - p.y;
      const d  = Math.hypot(dx, dy);
      if (d < 180) {
        p.vx += dx * 0.00008;
        p.vy += dy * 0.00008;
      }
      /* dampen */
      p.vx *= 0.998;
      p.vy *= 0.998;

      hCtx.beginPath();
      hCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      hCtx.fillStyle = `rgba(0,255,178,${p.a})`;
      hCtx.fill();
    }

    /* connections */
    const CONN_DIST = 95;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[j].x - particles[i].x;
        const dy = particles[j].y - particles[i].y;
        const d  = Math.hypot(dx, dy);
        if (d < CONN_DIST) {
          hCtx.beginPath();
          hCtx.moveTo(particles[i].x, particles[i].y);
          hCtx.lineTo(particles[j].x, particles[j].y);
          hCtx.strokeStyle = `rgba(0,255,178,${(1 - d / CONN_DIST) * 0.12})`;
          hCtx.lineWidth   = 0.5;
          hCtx.stroke();
        }
      }
    }

    requestAnimationFrame(animHero);
  })();

  /* ============================================================
     PROJECT CARDS — 3D tilt on hover
  ============================================================ */

  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'border-color 0.3s, transform 0.05s ease-out';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transition = 'border-color 0.3s, transform 0.5s cubic-bezier(0.16,1,0.3,1)';
      card.style.transform  = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0)';
    });
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const x  = e.clientX - r.left;
      const y  = e.clientY - r.top;
      const rx = ((y - r.height / 2) / r.height) * -5;
      const ry = ((x - r.width  / 2) / r.width)  *  5;
      card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
    });
  });

  /* ============================================================
     TERMINAL TYPEWRITER — replay on viewport enter
  ============================================================ */

  const terminal = document.querySelector('.terminal-body');
  if (terminal) {
    const lines = terminal.querySelectorAll('.t-line');

    /* hide all lines initially */
    lines.forEach(l => { l.style.opacity = '0'; });

    const termObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        let delay = 0;
        lines.forEach(line => {
          setTimeout(() => {
            line.style.transition = 'opacity 0.1s';
            line.style.opacity    = '1';
          }, delay);
          delay += 220;
        });
        termObserver.unobserve(entry.target);
      });
    }, { threshold: 0.3 });

    termObserver.observe(terminal);
  }

})();
