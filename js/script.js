function toggleMenu() {
  document.querySelector('.nav-links').classList.toggle('active');
}

// Close menu when clicking/touching outside of it
document.addEventListener("click", function (e) {
  const menu = document.querySelector(".nav-links");
  const toggle = document.querySelector(".menu-toggle");
  if (menu.classList.contains("active") &&
      !menu.contains(e.target) &&
      !toggle.contains(e.target)) {
    menu.classList.remove("active");
  }
});

// Close menu after selecting a link
document.querySelectorAll(".nav-links a").forEach(link => {
  link.addEventListener("click", () => {
    document.querySelector(".nav-links").classList.remove("active");
  });
});

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
