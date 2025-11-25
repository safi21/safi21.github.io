function toggleMenu() {
  document.querySelector(".nav-links").classList.toggle("active");
}

// Close menu when clicking/touching outside of it
document.addEventListener("click", function (e) {
  const menu = document.querySelector(".nav-links");
  const toggle = document.querySelector(".menu-toggle");
  if (
    menu.classList.contains("active") &&
    !menu.contains(e.target) &&
    !toggle.contains(e.target)
  ) {
    menu.classList.remove("active");
  }
});

// Close menu after selecting a link
document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelector(".nav-links").classList.remove("active");
  });
});

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ==============================
   Night/Day THEME (auto + toggle + persist)
   ============================== */
const THEME_STORAGE_KEY = "safi-theme";

function applyTheme(theme) {
  if (theme) document.documentElement.setAttribute("data-theme", theme);
  else document.documentElement.removeAttribute("data-theme");
  // Update button label if present
  const btn = document.querySelector(".theme-toggle");
  if (btn) {
    const isDark = (document.documentElement.getAttribute("data-theme") || "")
      .toLowerCase() === "dark";
    btn.querySelector("span").textContent = isDark ? "Night" : "Day";
    btn.setAttribute("aria-label", isDark ? "Switch to day mode" : "Switch to night mode");
  }
}

function currentSystemPrefersDark() {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getInitialTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return currentSystemPrefersDark() ? "dark" : "light";
}

function toggleTheme() {
  const now = document.documentElement.getAttribute("data-theme") || getInitialTheme();
  const next = now === "dark" ? "light" : "dark";
  localStorage.setItem(THEME_STORAGE_KEY, next);
  applyTheme(next);
}

// Inject a toggle button without changing HTML structure
function injectThemeToggle() {
  const nav = document.querySelector("nav");
  const ul = nav && nav.querySelector(".nav-links");
  if (!nav || !ul) return;

  // Avoid duplicates
  if (nav.querySelector(".theme-toggle")) return;

  const btn = document.createElement("button");
  btn.className = "theme-toggle";
  btn.type = "button";
  btn.innerHTML = '<div class="dot" aria-hidden="true"></div><span>Day</span>';
  btn.addEventListener("click", toggleTheme);

  // Place toggle after the nav links for desktop; on mobile it floats via CSS
  ul.insertAdjacentElement("afterend", btn);
}

document.addEventListener("DOMContentLoaded", () => {
  // Apply theme on load
  applyTheme(getInitialTheme());

  // Listen to OS theme changes (only if user hasn't explicitly chosen)
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener?.("change", (e) => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (!saved) {
      applyTheme(e.matches ? "dark" : "light");
    }
  });

  injectThemeToggle();
});
