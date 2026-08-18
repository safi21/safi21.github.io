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

  const toggleBtn = document.getElementById("themeToggle");
  const root = document.documentElement;
  const savedTheme = localStorage.getItem("theme");


  root.setAttribute("data-theme", savedTheme || "dark");

  if (toggleBtn) {
    toggleBtn.addEventListener("click", function () {
      const currentTheme = root.getAttribute("data-theme");
      const next = currentTheme === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
    });
  }

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

 
  function initWeave() {
    const base = document.getElementById("bgWeave");
    const glow = document.getElementById("bgWeaveGlow");
    if (!base || !glow) return;

    const baseCtx = base.getContext("2d", { alpha: true });
    const glowCtx = glow.getContext("2d", { alpha: true });
    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const SPACING = 38;
    const RADIUS = 190;

    const families = [
      { angle: (115 * Math.PI) / 180, colorVar: "--indigo", baseAlpha: 0.16 },
      { angle: (25 * Math.PI) / 180, colorVar: "--copper", baseAlpha: 0.14 },
    ];

    let dpr = 1;
    let w = 0, h = 0;
    let pointer = { x: -9999, y: -9999, active: false };

    function hexToRgbString(hex, alpha) {
      const h2 = hex.trim().replace("#", "");
      const full = h2.length === 3 ? h2.split("").map((c) => c + c).join("") : h2;
      const bigint = parseInt(full, 16);
      const r = (bigint >> 16) & 255, g = (bigint >> 8) & 255, b = bigint & 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    function readColors() {
      const cs = getComputedStyle(document.documentElement);
      families.forEach((f) => {
        const hex = cs.getPropertyValue(f.colorVar).trim() || "#888888";
        f.hex = hex;
        f.baseColor = hexToRgbString(hex, f.baseAlpha);
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

    function sizeCanvas(canvas, ctx) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

   
    function drawBase() {
      baseCtx.clearRect(0, 0, w, h);
      families.forEach((f) => {
        const { dx, dy, nx, ny, half, kStart, kEnd } = f;
        baseCtx.beginPath();
        for (let k = kStart; k <= kEnd; k++) {
          const jitter = (Math.sin(k * 12.9898) * 43758.5453 % 1) * 2.6 - 1.3;
          const linePos = k * SPACING + jitter;
          const ax = nx * linePos, ay = ny * linePos;
          baseCtx.moveTo(ax - dx * half, ay - dy * half);
          baseCtx.lineTo(ax + dx * half, ay + dy * half);
        }
        baseCtx.strokeStyle = f.baseColor;
        baseCtx.lineWidth = 1;
        baseCtx.stroke();
      });
    }

    function drawGlow() {
      glowCtx.clearRect(0, 0, w, h);
      if (!pointer.active) return;

      families.forEach((f) => {
        const { dx, dy, nx, ny, half, hex } = f;
        const pn = pointer.x * nx + pointer.y * ny;
        const kLo = Math.floor((pn - RADIUS) / SPACING);
        const kHi = Math.ceil((pn + RADIUS) / SPACING);

        for (let k = kLo; k <= kHi; k++) {
          const jitter = (Math.sin(k * 12.9898) * 43758.5453 % 1) * 2.6 - 1.3;
          const linePos = k * SPACING + jitter;
          const dist = Math.abs(pn - linePos);
          if (dist >= RADIUS) continue;

          const t = 1 - dist / RADIUS;
          const ease = t * t;
          const alpha = f.baseAlpha + ease * (0.95 - f.baseAlpha);
          const width = 1 + ease * 1.6;

          const ax = nx * linePos, ay = ny * linePos;
          glowCtx.strokeStyle = hexToRgbString(hex, alpha);
          glowCtx.lineWidth = width;
          glowCtx.beginPath();
          glowCtx.moveTo(ax - dx * half, ay - dy * half);
          glowCtx.lineTo(ax + dx * half, ay + dy * half);
          glowCtx.stroke();
        }
      });
    }

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      sizeCanvas(base, baseCtx);
      sizeCanvas(glow, glowCtx);
      computeGeometry();
      drawBase();
      drawGlow();
    }

    readColors();
    resize();

    if (reduceMotion) return; // static pattern only, no pointer tracking at all

    let resizeRaf = null;
    window.addEventListener("resize", () => {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(resize);
    });

    let moveRaf = null;
    function queueGlow(x, y, active) {
      pointer.x = x;
      pointer.y = y;
      pointer.active = active;
      if (moveRaf) return;
      moveRaf = requestAnimationFrame(() => {
        moveRaf = null;
        drawGlow();
      });
    }

    window.addEventListener("pointermove", (e) => queueGlow(e.clientX, e.clientY, true), { passive: true });
    window.addEventListener("pointerdown", (e) => queueGlow(e.clientX, e.clientY, true), { passive: true });
    window.addEventListener("pointerleave", () => queueGlow(pointer.x, pointer.y, false), { passive: true });

    const mo = new MutationObserver(() => {
      readColors();
      drawBase();
      drawGlow();
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }

  if ("requestIdleCallback" in window) {
    requestIdleCallback(initWeave, { timeout: 800 });
  } else {
    window.addEventListener("load", () => setTimeout(initWeave, 50));
  }
});
