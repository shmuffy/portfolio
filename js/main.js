/**
 * main.js — Micrographics Portfolio
 *
 * Aesthetic: product spec sheet / industrial print.
 * No particle systems. No glowing cursors. No 3D tilt.
 * Just precision, restraint, and the crosshair.
 */

;(function () {
  'use strict';

  /* ── Crosshair cursor ───────────────────────────── */
  const cursor    = document.getElementById('cursor');
  const cursorDot = document.getElementById('cursor-dot');

  if (cursor && window.matchMedia('(pointer: fine)').matches) {
    const move = (e) => {
      const x = e.clientX, y = e.clientY;
      cursor.style.left    = x + 'px';
      cursor.style.top     = y + 'px';
      if (cursorDot) {
        cursorDot.style.left = x + 'px';
        cursorDot.style.top  = y + 'px';
      }
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseleave', () => { cursor.style.opacity = '0'; });
    document.addEventListener('mouseenter', () => { cursor.style.opacity = '1'; });

    /* Grow on interactive hover */
    const hoverEls = document.querySelectorAll('a, button, .project-item, .tag, .btn');
    hoverEls.forEach(el => {
      el.addEventListener('mouseenter', () => cursor.style.transform = 'translate(-50%,-50%) scale(1.8)');
      el.addEventListener('mouseleave', () => cursor.style.transform = 'translate(-50%,-50%) scale(1)');
    });
  }

  /* ── Smooth anchor scroll ───────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* ── Scroll reveals (.reveal → add .in) ─────────── */
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  }

  /* ── Project items: stagger in on viewport enter ── */
  const projectItems = document.querySelectorAll('.project-item');
  if (projectItems.length) {
    const io2 = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io2.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });

    projectItems.forEach((item, i) => {
      item.style.transitionDelay = `${i * 90}ms`;
      io2.observe(item);
    });
  }

  /* ── Nav active state on scroll ─────────────────── */
  const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
  const sections = [];
  navLinks.forEach(link => {
    const sec = document.querySelector(link.getAttribute('href'));
    if (sec) sections.push({ link, sec });
  });

  if (sections.length) {
    const onScroll = () => {
      const midY = window.scrollY + window.innerHeight * 0.4;
      let active = sections[0];
      sections.forEach(s => {
        if (s.sec.offsetTop <= midY) active = s;
      });
      navLinks.forEach(l => l.classList.remove('nav-link--active'));
      active.link.classList.add('nav-link--active');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Nav: scrolled state ─────────────────────────── */
  const nav = document.getElementById('nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });
  }

  /* ── Receipt lines: stagger on enter ────────────── */
  const receipt = document.querySelector('.receipt');
  if (receipt) {
    const lines = receipt.querySelectorAll('.receipt-line');
    /* Start invisible */
    lines.forEach(l => {
      l.style.opacity    = '0';
      l.style.transition = 'opacity 0.3s ease';
    });
    const io3 = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          lines.forEach((line, i) => {
            setTimeout(() => { line.style.opacity = '1'; }, i * 65);
          });
          io3.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    io3.observe(receipt);
  }

})();
