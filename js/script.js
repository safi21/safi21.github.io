function toggleMenu() {
  document.querySelector(".nav-links").classList.toggle("active");
}

document.addEventListener("click", function (e) {
  const menu = document.querySelector(".nav-links");
  const toggle = document.querySelector(".menu-toggle");
  if (menu && toggle && menu.classList.contains("active") &&
      !menu.contains(e.target) && !toggle.contains(e.target)) {
    menu.classList.remove("active");
  }
});

document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    const navLinks = document.querySelector(".nav-links");
    if (navLinks) navLinks.classList.remove("active");
  });
});

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.addEventListener("DOMContentLoaded", function () {
  /* ===== Theme Toggle ===== */
  const toggleBtn = document.getElementById("themeToggle");
  const root = document.documentElement;
  const savedTheme = localStorage.getItem("theme");

  // Night Mode is the default
  root.setAttribute("data-theme", savedTheme || "dark");

  if (toggleBtn) {
    toggleBtn.addEventListener("click", function () {
      const currentTheme = root.getAttribute("data-theme");
      const next = currentTheme === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
    });
  }

  /* =====================================================
     One rAF-coalesced scroll pass. Instead of three
     independent "scroll" listeners each doing their own
     work (and their own layout reads) on every fired
     event — which is what was making fast trackpad
     scrolling feel janky — a single passive listener just
     flags "dirty" and a single rAF tick does all three
     updates together, at most once per frame.
     ===================================================== */
  const progressBar = document.getElementById("scrollProgress");
  const backToTop = document.getElementById("backToTop");
  const navLinks = document.querySelectorAll("[data-nav]");
  const sections = Array.from(navLinks)
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  let scrollTicking = false;

  function updateOnScroll() {
    const scrollTop = window.scrollY;

    if (progressBar) {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      progressBar.style.width = pct + "%";
    }

    if (backToTop) backToTop.classList.toggle("is-visible", scrollTop > 480);

    let current = sections[0];
    const offset = 120;
    for (let i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top - offset <= 0) current = sections[i];
    }
    navLinks.forEach((link) => {
      link.classList.toggle("active", current && link.getAttribute("href") === "#" + current.id);
    });

    scrollTicking = false;
  }

  function onScroll() {
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(updateOnScroll);
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  updateOnScroll();

  /* ===== Scroll-reveal for sections ===== */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ===== Publication filters ===== */
  const filterButtons = document.querySelectorAll(".pub-filter");
  const pubCards = document.querySelectorAll(".publication-card");

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const filter = btn.getAttribute("data-filter");

      pubCards.forEach((card) => {
        const tags = (card.getAttribute("data-tags") || "").split(" ");
        const show = filter === "all" || tags.includes(filter);
        card.classList.toggle("is-hidden", !show);
      });
    });
  });

  /* =====================================================
     Dynamic weave background — optimized.

     Two thread families (indigo "warp" + copper "weft"),
     quiet at rest, glowing near the cursor. Perf choices:
     - lines far from the cursor are batched into ONE path
       + ONE stroke() call per family per frame, instead of
       a beginPath/stroke per line (this was the main cost).
     - only the handful of lines actually inside the glow
       radius are stroked individually.
     - trig / geometry per family is computed once on
       resize, not every frame.
     - colors are converted to rgb once (on load + theme
       change), not every frame.
     - devicePixelRatio is capped at 1.5 (imperceptible for
       hairline threads, meaningfully cheaper to paint).
     - the loop runs at ~30fps, not 60 — plenty smooth for
       an ambient background, half the paint work.
     - the loop fully stops when the tab isn't visible.
     ===================================================== */
  const canvas = document.getElementById("bgWeave");
  if (canvas) {
    const ctx = canvas.getContext("2d", { alpha: true });
    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const SPACING = 38;
    const RADIUS = 190;
    const FRAME_INTERVAL = 1000 / 30; // ~30fps ambient loop

    const families = [
      { angle: (115 * Math.PI) / 180, colorVar: "--indigo", baseAlpha: 0.16, phaseOffset: 0 },
      { angle: (25 * Math.PI) / 180, colorVar: "--copper", baseAlpha: 0.14, phaseOffset: 10 },
    ];

    let dpr = 1;
    let w = 0, h = 0;
    let pointer = { x: -9999, y: -9999, active: false };
    let running = true;

    function hexToRgbString(hex, alpha) {
      const h2 = hex.trim().replace("#", "");
      const full = h2.length === 3 ? h2.split("").map((c) => c + c).join("") : h2;
      const bigint = parseInt(full, 16);
      const r = (bigint >> 16) & 255, g = (bigint >> 8) & 255, b = bigint & 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    function readColors() {
      const cs = getComputedStyle(root);
      families.forEach((f) => {
        const hex = cs.getPropertyValue(f.colorVar).trim() || "#888888";
        f.baseColor = hexToRgbString(hex, f.baseAlpha);
        f.hex = hex;
      });
    }

    function computeGeometry() {
      const diag = Math.sqrt(w * w + h * h);
      families.forEach((f) => {
        const dx = Math.cos(f.angle), dy = Math.sin(f.angle);
        const nx = -Math.sin(f.angle), ny = Math.cos(f.angle);
        const corners = [[0, 0], [w, 0], [0, h], [w, h]];
        let minProj = Infinity, maxProj = -Infinity;
        corners.forEach(([cx, cy]) => {
          const p = cx * nx + cy * ny;
          if (p < minProj) minProj = p;
          if (p > maxProj) maxProj = p;
        });
        f.dx = dx; f.dy = dy; f.nx = nx; f.ny = ny;
        f.half = diag;
        f.kStart = Math.floor(minProj / SPACING) - 1;
        f.kEnd = Math.ceil(maxProj / SPACING) + 1;
      });
    }

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      computeGeometry();
    }

    readColors();
    resize();

    let resizeRaf = null;
    window.addEventListener("resize", () => {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(resize);
    });

    window.addEventListener("pointermove", (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    }, { passive: true });
    window.addEventListener("pointerleave", () => { pointer.active = false; }, { passive: true });
    window.addEventListener("pointerdown", (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    }, { passive: true });

    document.addEventListener("visibilitychange", () => {
      running = !document.hidden;
      if (running && !reduceMotion) requestAnimationFrame(loop);
    });

    const mo = new MutationObserver(readColors);
    mo.observe(root, { attributes: true, attributeFilter: ["data-theme"] });

    function drawFamily(f, t) {
      const { dx, dy, nx, ny, half, kStart, kEnd, baseColor, hex } = f;
      const pn = pointer.active ? pointer.x * nx + pointer.y * ny : null;
      const phase = t * 0.35 + f.phaseOffset;

      ctx.beginPath();
      const activeLines = [];

      for (let k = kStart; k <= kEnd; k++) {
        const wobble = Math.sin(phase + k * 0.35) * 1.4;
        const linePos = k * SPACING + wobble;

        let isActive = false;
        if (pn !== null) {
          const dist = Math.abs(pn - linePos);
          if (dist < RADIUS) isActive = true;
        }

        const ax = nx * linePos, ay = ny * linePos;
        const x1 = ax - dx * half, y1 = ay - dy * half;
        const x2 = ax + dx * half, y2 = ay + dy * half;

        if (isActive) {
          activeLines.push({ x1, y1, x2, y2, pos: linePos });
        } else {
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
        }
      }

      ctx.strokeStyle = baseColor;
      ctx.lineWidth = 1;
      ctx.stroke();

      activeLines.forEach(({ x1, y1, x2, y2, pos }) => {
        const dist = Math.abs(pn - pos);
        const t2 = 1 - dist / RADIUS;
        const ease = t2 * t2;
        const alpha = f.baseAlpha + ease * (0.95 - f.baseAlpha);
        const width = 1 + ease * 1.6;

        ctx.strokeStyle = hexToRgbString(hex, alpha);
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });
    }

    function render(t) {
      ctx.clearRect(0, 0, w, h);
      families.forEach((f) => drawFamily(f, t));
    }

    let start = null;
    let lastFrameTime = 0;
    function loop(ts) {
      if (!running) return;
      if (start === null) start = ts;
      if (ts - lastFrameTime >= FRAME_INTERVAL) {
        lastFrameTime = ts;
        render((ts - start) / 1000);
      }
      requestAnimationFrame(loop);
    }

    if (reduceMotion) {
      render(0);
    } else {
      requestAnimationFrame(loop);
    }
  }
});
