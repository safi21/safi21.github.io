function toggleMenu() {
  document.querySelector(".nav-links").classList.toggle("active");
}

// Close menu when clicking outside
document.addEventListener("click", function (e) {
  const menu = document.querySelector(".nav-links");
  const toggle = document.querySelector(".menu-toggle");

  if (
    menu &&
    toggle &&
    menu.classList.contains("active") &&
    !menu.contains(e.target) &&
    !toggle.contains(e.target)
  ) {
    menu.classList.remove("active");
  }
});

// Close menu after clicking a link
document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    const navLinks = document.querySelector(".nav-links");
    if (navLinks) navLinks.classList.remove("active");
  });
});

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ===== Theme Toggle ===== */
document.addEventListener("DOMContentLoaded", function () {
  const toggleBtn = document.getElementById("themeToggle");
  const root = document.documentElement;
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "dark") {
    root.setAttribute("data-theme", "dark");
  } else {
    root.setAttribute("data-theme", "light");
  }

  if (toggleBtn) {
    toggleBtn.addEventListener("click", function () {
      const currentTheme = root.getAttribute("data-theme");

      if (currentTheme === "dark") {
        root.setAttribute("data-theme", "light");
        localStorage.setItem("theme", "light");
      } else {
        root.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark");
      }
    });
  }
});
