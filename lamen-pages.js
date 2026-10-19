/* LAMEN — behaviour shared by the standalone pages (About, Contact).
   Mirrors the homepage's inline menu script; lamen-premium.js then adds
   the header scroll states, reveals and Escape-to-close. */
(() => {
  "use strict";
  const toggle = document.getElementById("menuToggle");
  const menu = document.getElementById("mobileMenu");
  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      const open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    });
    menu.querySelectorAll("a").forEach((link) =>
      link.addEventListener("click", () => {
        menu.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }),
    );
  }

  // Footer year stays current without editing the markup each January.
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });
})();
