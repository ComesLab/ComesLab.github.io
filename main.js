/**
 * ComesLab · main.js
 * Author : Attilio Comes / ComesLab
 * ES2020+ Vanilla JS — no frameworks, no jQuery
 * All logic wrapped in an ES module (type="module" in HTML)
 */

/* ═══════════════════════════════════════════════════════════════════════
   1. UTILITY HELPERS
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * Shorthand querySelector
 * @param {string} sel - CSS selector
 * @param {Element} [ctx=document] - context element
 * @returns {Element|null}
 */
const qs  = (sel, ctx = document) => ctx.querySelector(sel);

/**
 * Shorthand querySelectorAll → Array
 * @param {string} sel
 * @param {Element} [ctx=document]
 * @returns {Element[]}
 */
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/**
 * Check if user prefers reduced motion
 * @returns {boolean}
 */
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ═══════════════════════════════════════════════════════════════════════
   2. CURSOR FOLLOWER
   Smooth 12px blue dot that tracks the cursor; expands on hover targets.
   ═══════════════════════════════════════════════════════════════════════ */
const initCursorFollower = () => {
  if (prefersReducedMotion()) return;
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const dot = qs('.cursor-dot');
  if (!dot) return;

  let curX = 0, curY = 0;
  let rafId = null;

  const moveDot = (x, y) => {
    dot.style.left = `${x}px`;
    dot.style.top  = `${y}px`;
  };

  // Animate on mousemove
  document.addEventListener('mousemove', (e) => {
    curX = e.clientX;
    curY = e.clientY;

    if (!dot.classList.contains('is-active')) {
      dot.classList.add('is-active');
    }

    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => moveDot(curX, curY));
  });

  // Expand on interactive elements
  const hoverTargets = 'a, button, [role="button"], .skill-tag, .cert-card, .card--project';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverTargets)) {
      dot.classList.add('is-hovered');
    }
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverTargets)) {
      dot.classList.remove('is-hovered');
    }
  });

  // Hide when leaving window
  document.addEventListener('mouseleave', () => dot.classList.remove('is-active'));
  document.addEventListener('mouseenter', () => dot.classList.add('is-active'));
};

/* ═══════════════════════════════════════════════════════════════════════
   3. HERO PARALLAX (mouse move on hero blob)
   Subtle parallax effect on the glow blobs in the hero section.
   ═══════════════════════════════════════════════════════════════════════ */
const initHeroParallax = () => {
  if (prefersReducedMotion()) return;

  const hero  = qs('.hero');
  const blob1 = qs('.hero__blob--1');
  const blob2 = qs('.hero__blob--2');
  if (!hero || !blob1 || !blob2) return;

  let tickId = null;

  hero.addEventListener('mousemove', (e) => {
    cancelAnimationFrame(tickId);
    tickId = requestAnimationFrame(() => {
      const { left, top, width, height } = hero.getBoundingClientRect();
      const cx = (e.clientX - left - width  / 2) / (width  / 2); // –1…1
      const cy = (e.clientY - top  - height / 2) / (height / 2); // –1…1

      blob1.style.transform = `translate(${cx * 25}px, ${cy * 15}px) scale(1)`;
      blob2.style.transform = `translate(${cx * -15}px, ${cy * -10}px) scale(1)`;
    });
  });

  hero.addEventListener('mouseleave', () => {
    blob1.style.transform = '';
    blob2.style.transform = '';
  });
};

/* ═══════════════════════════════════════════════════════════════════════
   3b. HERO CIRCUIT-GRID PULSES
   Edge-to-edge impulses that travel along the SVG grid lines, avoiding
   the central content zone. Duration 11-15 s, easeInOutSine, 180 px tail.
   ═══════════════════════════════════════════════════════════════════════ */
const initHeroPulses = () => {
  if (prefersReducedMotion()) return;

  /** @type {HTMLCanvasElement|null} */
  const canvas = qs('.hero__pulses');
  const hero   = qs('.hero');
  if (!canvas || !hero) return;

  const ctx  = canvas.getContext('2d');
  const CELL = 60;
  const PULSE_COUNT   = 4;
  const TAIL_LENGTH   = 180;
  const DUR_MIN       = 11000;
  const DUR_MAX       = 15000;
  const STRAIGHT_W    = 0.55;
  const TOWARD_W      = 0.25;
  const PERP_W        = 0.06;

  let W = 0, H = 0, cols = 0, rows = 0;

  /* — helpers — */
  const ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const rf = (a, b) => Math.random() * (b - a) + a;
  /* Near-constant cruise speed: gentle ramp in/out, no initial burst
     (the previous easeOutQuart started at ~4x the average speed). */
  const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

  /* Theme-aware pulse color: matches .grid-dot palette (see style.css).
     Read every frame in draw(), so the theme toggle applies without reload. */
  const pulseRGB = () =>
    document.documentElement.dataset.theme === 'light' ? '0,80,140' : '0,212,255';

  /* Exclusion zone (normalised 0-1 of hero dimensions) */
  const EZ = { x1: 0.15, y1: 0.18, x2: 0.70, y2: 0.85 };
  const blocked = (c, r) => {
    const px = (c * CELL) / W;
    const py = (r * CELL) / H;
    return px > EZ.x1 && px < EZ.x2 && py > EZ.y1 && py < EZ.y2;
  };

  /* — resize — */
  const resize = () => {
    const rect = hero.getBoundingClientRect();
    W    = rect.width;
    H    = rect.height;
    cols = Math.ceil(W / CELL) + 1;
    rows = Math.ceil(H / CELL) + 1;
    canvas.width  = W * devicePixelRatio;
    canvas.height = H * devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize);

  /* — pathfinding — */
  const buildPath = (sc, sr, ec, er) => {
    const pts = [{ c: sc, r: sr }];
    let c = sc, r = sr, dir = null;

    for (let i = 0; i < 80; i++) {
      if (c === ec && r === er) break;

      const dc = ec - c;
      const dr = er - r;
      let cands = [];

      /* keep going straight */
      if (dir) {
        const nc = c + dir.dc;
        const nr = r + dir.dr;
        if (nc >= 0 && nc < cols && nr >= 0 && nr < rows && !blocked(nc, nr))
          cands.push({ dc: dir.dc, dr: dir.dr, w: STRAIGHT_W });
      }

      /* toward destination */
      if (dc !== 0) cands.push({ dc: Math.sign(dc), dr: 0, w: TOWARD_W });
      if (dr !== 0) cands.push({ dc: 0, dr: Math.sign(dr), w: TOWARD_W });

      /* perpendicular jitter */
      const perpDirs = [];
      if (dir && dir.dc !== 0) { perpDirs.push({ dc: 0, dr: 1 }, { dc: 0, dr: -1 }); }
      else if (dir && dir.dr !== 0) { perpDirs.push({ dc: 1, dr: 0 }, { dc: -1, dr: 0 }); }
      perpDirs.forEach((m) => {
        const nc = c + m.dc;
        const nr = r + m.dr;
        if (nc >= 0 && nc < cols && nr >= 0 && nr < rows && !blocked(nc, nr))
          cands.push({ ...m, w: PERP_W });
      });

      /* filter unreachable */
      cands = cands.filter((m) => {
        const nc = c + m.dc;
        const nr = r + m.dr;
        return nc >= 0 && nc < cols && nr >= 0 && nr < rows && !blocked(nc, nr);
      });

      /* fallback: any open neighbour */
      if (!cands.length) {
        for (const m of [{ dc: 1, dr: 0 }, { dc: -1, dr: 0 }, { dc: 0, dr: 1 }, { dc: 0, dr: -1 }]) {
          const nc = c + m.dc;
          const nr = r + m.dr;
          if (nc >= 0 && nc < cols && nr >= 0 && nr < rows && !blocked(nc, nr))
            cands.push({ ...m, w: 0.25 });
        }
        if (!cands.length) break;
      }

      /* weighted random pick */
      const tw = cands.reduce((s, m) => s + m.w, 0);
      let rnd = Math.random() * tw;
      let pick = cands[0];
      for (const m of cands) { rnd -= m.w; if (rnd <= 0) { pick = m; break; } }

      c += pick.dc;
      r += pick.dr;
      dir = { dc: pick.dc, dr: pick.dr };

      /* coalesce collinear segments */
      const last = pts[pts.length - 1];
      if (pts.length >= 2) {
        const prev = pts[pts.length - 2];
        if ((c - last.c) === (last.c - prev.c) && (r - last.r) === (last.r - prev.r)) {
          pts[pts.length - 1] = { c, r };
          continue;
        }
      }
      pts.push({ c, r });
    }

    return pts.map((p) => ({ x: p.c * CELL, y: p.r * CELL }));
  };

  /* — route templates — */
  const routes = [
    () => ({ sc: 0,        sr: ri(0, rows - 1),                       ec: cols - 1, er: ri(0, rows - 1) }),
    () => ({ sc: ri(0, cols - 1), sr: 0,                              ec: ri(0, cols - 1), er: rows - 1 }),
    () => ({ sc: cols - 1,  sr: ri(0, Math.floor(rows * 0.35)),       ec: 0,        er: ri(Math.floor(rows * 0.65), rows - 1) }),
    () => ({ sc: cols - 1,  sr: ri(Math.floor(rows * 0.5), rows - 1), ec: ri(0, Math.floor(cols * 0.3)), er: rows - 1 }),
    () => ({ sc: 0,         sr: ri(0, Math.floor(rows * 0.35)),       ec: ri(Math.floor(cols * 0.7), cols - 1), er: rows - 1 }),
  ];

  /* — Pulse class — */
  class Pulse {
    constructor() { this.reset(); }

    reset() {
      const route = routes[ri(0, routes.length - 1)]();
      this.pts = buildPath(route.sc, route.sr, route.ec, route.er);

      this.totalLen = 0;
      this.segLens  = [];
      for (let i = 1; i < this.pts.length; i++) {
        const dx = this.pts[i].x - this.pts[i - 1].x;
        const dy = this.pts[i].y - this.pts[i - 1].y;
        const len = Math.sqrt(dx * dx + dy * dy);
        this.segLens.push(len);
        this.totalLen += len;
      }

      this.duration    = rf(DUR_MIN, DUR_MAX);
      this.elapsed     = 0;
      this.alive       = true;
      this.head        = null;   // current head position, used for node blips
      this.lastBlipKey = null;   // last grid node that emitted a blip
    }

    update(dt) {
      this.elapsed += dt;
      if (this.elapsed >= this.duration) this.alive = false;
    }

    draw(ctx) {
      const rawProgress = Math.min(this.elapsed / this.duration, 1);
      const progress    = easeInOutSine(rawProgress);
      const headDist    = progress * this.totalLen;
      const tailDist    = Math.max(0, headDist - TAIL_LENGTH);

      let dist = 0;
      for (let i = 1; i < this.pts.length; i++) {
        const sl = this.segLens[i - 1];
        const segStart = dist;
        const segEnd   = dist + sl;
        dist = segEnd;
        if (segEnd < tailDist || segStart > headDist) continue;

        const s0 = Math.max(0, (tailDist - segStart) / sl);
        const s1 = Math.min(1, (headDist - segStart) / sl);
        const p  = this.pts[i - 1];
        const q  = this.pts[i];
        const x1 = p.x + (q.x - p.x) * s0;
        const y1 = p.y + (q.y - p.y) * s0;
        const x2 = p.x + (q.x - p.x) * s1;
        const y2 = p.y + (q.y - p.y) * s1;

        const midDist   = (segStart + segEnd) / 2;
        const localProg = TAIL_LENGTH > 0 ? Math.max(0, Math.min(1, (midDist - tailDist) / (headDist - tailDist))) : 1;
        const alpha     = 0.08 + localProg * 0.45;

        const rgb  = pulseRGB();
        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, `rgba(${rgb},${alpha * 0.15})`);
        grad.addColorStop(1, `rgba(${rgb},${alpha})`);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = grad;
        ctx.lineWidth   = 1.5;
        ctx.stroke();
      }

      /* head dot */
      const hp = this.pointAt(headDist);
      this.head = hp;
      if (hp) {
        const rgb = pulseRGB();
        ctx.beginPath();
        ctx.arc(hp.x, hp.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb},0.6)`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(hp.x, hp.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb},0.07)`;
        ctx.fill();
      }
    }

    pointAt(distance) {
      let d = 0;
      for (let i = 1; i < this.pts.length; i++) {
        const sl = this.segLens[i - 1];
        if (d + sl >= distance) {
          const t = (distance - d) / sl;
          const p = this.pts[i - 1];
          const q = this.pts[i];
          return { x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t };
        }
        d += sl;
      }
      return this.pts[this.pts.length - 1];
    }
  }

  /* — node blips —
     When a pulse head passes a grid intersection, the node lights up
     briefly (core flash + expanding ring) and fades out. */
  const blips     = [];
  const BLIP_LIFE = 700;   // ms
  const BLIP_MAX  = 40;    // safety cap
  const BLIP_SNAP = 5;     // px tolerance around the intersection
  const easeOutQuad = (t) => t * (2 - t);

  const maybeSpawnBlip = (p) => {
    if (!p.head) return;
    const nc = Math.round(p.head.x / CELL);
    const nr = Math.round(p.head.y / CELL);
    const nx = nc * CELL;
    const ny = nr * CELL;
    if (Math.abs(p.head.x - nx) > BLIP_SNAP || Math.abs(p.head.y - ny) > BLIP_SNAP) return;
    const key = `${nc},${nr}`;
    if (p.lastBlipKey === key) return;          // one blip per node per pass
    p.lastBlipKey = key;
    if (blips.length < BLIP_MAX) blips.push({ x: nx, y: ny, age: 0 });
  };

  const drawBlips = (dt) => {
    const rgb = pulseRGB();
    for (let i = blips.length - 1; i >= 0; i--) {
      const b = blips[i];
      b.age += dt;
      if (b.age >= BLIP_LIFE) { blips.splice(i, 1); continue; }
      const t    = b.age / BLIP_LIFE;
      const fade = 1 - easeOutQuad(t);

      /* core flash */
      ctx.beginPath();
      ctx.arc(b.x, b.y, 2 + t * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb},${0.55 * fade})`;
      ctx.fill();

      /* expanding ring */
      ctx.beginPath();
      ctx.arc(b.x, b.y, 3 + t * 9, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${rgb},${0.25 * fade})`;
      ctx.lineWidth   = 1;
      ctx.stroke();
    }
  };

  /* — animation loop — */
  const pulses = [];
  for (let i = 0; i < PULSE_COUNT; i++) {
    const p = new Pulse();
    p.elapsed = rf(0, p.duration * 0.6);   // stagger initial positions
    pulses.push(p);
  }

  let lastTime = performance.now();

  const loop = (now) => {
    const dt = now - lastTime;
    lastTime = now;
    ctx.clearRect(0, 0, W, H);

    for (const p of pulses) {
      p.update(dt);
      if (!p.alive) p.reset();
      p.draw(ctx);
      maybeSpawnBlip(p);
    }
    drawBlips(dt);

    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
};

/* ═══════════════════════════════════════════════════════════════════════
   4. TYPING EFFECT
   Cycles through three role strings with a realistic keystroke simulation.
   ═══════════════════════════════════════════════════════════════════════ */
const initTypingEffect = () => {
  const el = qs('#typingText');
  if (!el) return;

  const roles = [
    'Junior Python Developer',
    'Automation Specialist',
    'Flask & SQL Server Builder',
  ];

  let roleIdx = 0;
  let charIdx = 0;
  let isDeleting = false;
  let timeoutId  = null;

  const TYPING_SPEED  = 70;   // ms per character typed
  const DELETING_SPEED = 40;  // ms per character deleted
  const PAUSE_AFTER    = 2400; // ms pause at full word
  const PAUSE_BEFORE   = 300; // ms pause before next word

  if (prefersReducedMotion()) {
    el.textContent = roles[0];
    return;
  }

  const tick = () => {
    const current = roles[roleIdx];

    if (!isDeleting) {
      // Type forward
      charIdx++;
      el.textContent = current.slice(0, charIdx);

      if (charIdx === current.length) {
        // Reached end — pause then start deleting
        isDeleting = true;
        timeoutId  = setTimeout(tick, PAUSE_AFTER);
        return;
      }
    } else {
      // Delete backward
      charIdx--;
      el.textContent = current.slice(0, charIdx);

      if (charIdx === 0) {
        // Finished deleting — move to next role
        isDeleting = false;
        roleIdx    = (roleIdx + 1) % roles.length;
        timeoutId  = setTimeout(tick, PAUSE_BEFORE);
        return;
      }
    }

    timeoutId = setTimeout(tick, isDeleting ? DELETING_SPEED : TYPING_SPEED);
  };

  timeoutId = setTimeout(tick, 800); // initial delay
};

/* ═══════════════════════════════════════════════════════════════════════
   5. NAVBAR — scroll state + mobile hamburger
   ═══════════════════════════════════════════════════════════════════════ */
const initNavbar = () => {
  const navbar    = qs('#navbar');
  const hamburger = qs('#hamburger');
  const navLinks  = qs('#navLinks');
  if (!navbar) return;

  // Scroll state — add .is-scrolled after 10px
  const handleScroll = () => {
    navbar.classList.toggle('is-scrolled', window.scrollY > 10);
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // Hamburger toggle
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const open = hamburger.classList.toggle('is-open');
      navLinks.classList.toggle('is-open', open);
      hamburger.setAttribute('aria-expanded', String(open));
      hamburger.setAttribute('aria-label', open ? 'Chiudi menu' : 'Apri menu');
    });

    // Close on link click (mobile)
    qsa('.navbar__link', navLinks).forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('is-open');
        navLinks.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!navbar.contains(e.target)) {
        hamburger.classList.remove('is-open');
        navLinks.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  }
};

/* ═══════════════════════════════════════════════════════════════════════
   6. ACTIVE NAV LINK on scroll (IntersectionObserver)
   ═══════════════════════════════════════════════════════════════════════ */
const initActiveNavLinks = () => {
  const sections  = qsa('section[id]');
  const navLinks  = qsa('.navbar__link');
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => link.classList.remove('is-active'));
          const active = navLinks.find(l => l.getAttribute('href') === `#${entry.target.id}`);
          active?.classList.add('is-active');
        }
      });
    },
    {
      rootMargin: `-${(parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('--nav-height')) || 72)}px 0px -60% 0px`,
      threshold: 0,
    }
  );

  sections.forEach(sec => observer.observe(sec));
};

/* ═══════════════════════════════════════════════════════════════════════
   7. SMOOTH SCROLL with navbar offset
   ═══════════════════════════════════════════════════════════════════════ */
const initSmoothScroll = () => {
  const NAV_HEIGHT = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--nav-height')
  ) || 72;

  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;

    const targetId = anchor.getAttribute('href').slice(1);
    if (!targetId) return;

    const target = document.getElementById(targetId);
    if (!target) return;

    e.preventDefault();
    const y = target.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT - 8;
    window.scrollTo({ top: y, behavior: 'smooth' });
  });
};

/* ═══════════════════════════════════════════════════════════════════════
   8. SCROLL-TRIGGERED REVEAL (IntersectionObserver)
   ═══════════════════════════════════════════════════════════════════════ */
const initReveal = () => {
  const elements = qsa('.reveal');
  if (!elements.length) return;

  if (prefersReducedMotion()) {
    elements.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: '0px 0px -60px 0px',
    }
  );

  elements.forEach(el => observer.observe(el));
};

/* ═══════════════════════════════════════════════════════════════════════
   9. BACK TO TOP BUTTON
   ═══════════════════════════════════════════════════════════════════════ */
const initBackToTop = () => {
  const btn = qs('#backToTop');
  if (!btn) return;

  const toggle = () => btn.classList.toggle('is-visible', window.scrollY > 300);
  window.addEventListener('scroll', toggle, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
};

/* ═══════════════════════════════════════════════════════════════════════
   10. DARK / LIGHT THEME TOGGLE
   ═══════════════════════════════════════════════════════════════════════ */
const initThemeToggle = () => {
  const btn = qs('#themeToggle');
  if (!btn) return;

  // Restore saved preference
  const saved = localStorage.getItem('cl-theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);

  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next    = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('cl-theme', next);
    btn.setAttribute('aria-label', next === 'light' ? 'Attiva tema scuro' : 'Attiva tema chiaro');
  });
};

/* ═══════════════════════════════════════════════════════════════════════
   11. CONTACT FORM — client-side validation + success toast
   ═══════════════════════════════════════════════════════════════════════ */
const initContactForm = () => {
  const submitBtn  = qs('#contactSubmit');
  const nameInput  = qs('#contactName');
  const emailInput = qs('#contactEmail');
  const msgInput   = qs('#contactMessage');
  const nameErr    = qs('#nameError');
  const emailErr   = qs('#emailError');
  const msgErr     = qs('#messageError');
  const toast      = qs('#toast');

  if (!submitBtn) return;

  /**
   * Validate a single field
   * @param {HTMLInputElement|HTMLTextAreaElement} input
   * @param {HTMLElement} errEl
   * @param {Function} validator — returns error string or ''
   * @returns {boolean}
   */
  const validateField = (input, errEl, validator) => {
    const msg = validator(input.value.trim());
    errEl.textContent = msg;
    input.classList.toggle('is-invalid', !!msg);
    return !msg;
  };

  const validators = {
    name:    v => v.length < 2  ? 'Il nome deve avere almeno 2 caratteri.' : '',
    email:   v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Inserisci un indirizzo email valido.',
    message: v => v.length < 10 ? 'Il messaggio deve avere almeno 10 caratteri.' : '',
  };

  // Live validation on blur
  nameInput?.addEventListener('blur',  () => validateField(nameInput,  nameErr,  validators.name));
  emailInput?.addEventListener('blur', () => validateField(emailInput, emailErr, validators.email));
  msgInput?.addEventListener('blur',   () => validateField(msgInput,   msgErr,   validators.message));

  /**
   * Show toast and auto-hide after 4s
   */
  const showToast = () => {
    if (!toast) return;
    toast.classList.add('is-visible');
    setTimeout(() => toast.classList.remove('is-visible'), 4000);
  };

  submitBtn.addEventListener('click', () => {
    const okName  = validateField(nameInput,  nameErr,  validators.name);
    const okEmail = validateField(emailInput, emailErr, validators.email);
    const okMsg   = validateField(msgInput,   msgErr,   validators.message);

    if (okName && okEmail && okMsg) {
      // No backend — just show success feedback
      nameInput.value  = '';
      emailInput.value = '';
      msgInput.value   = '';
      [nameInput, emailInput, msgInput].forEach(i => i.classList.remove('is-invalid'));
      showToast();
    }
  });
};

/* ═══════════════════════════════════════════════════════════════════════
   12. BOOT — initialise everything on DOMContentLoaded
   ═══════════════════════════════════════════════════════════════════════ */
const boot = () => {
  initCursorFollower();
  initHeroParallax();
  initHeroPulses();
  initTypingEffect();
  initNavbar();
  initActiveNavLinks();
  initSmoothScroll();
  initReveal();
  initBackToTop();
  initThemeToggle();
  initContactForm();
};

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', boot)
  : boot();
