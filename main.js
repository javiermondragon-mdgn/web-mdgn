/* MDGN — interacciones del sitio. Script clásico (sin módulos): el contenido está en el HTML, aquí solo se enriquece. */
(function () {
  "use strict";
  window.__MDGN__ = true;

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[MDGN] " + name + " falló:", e); }
  }

  /* Header transparente sobre la portada, sólido al hacer scroll */
  function initHeader() {
    var header = document.querySelector("[data-header]");
    if (!header) return;
    var on = function () { header.classList.toggle("is-scrolled", window.scrollY > 40); };
    on();
    window.addEventListener("scroll", on, { passive: true });
  }

  /* Menú móvil */
  function initMenu() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("nav");
    var header = document.querySelector("[data-header]");
    if (!toggle || !nav) return;
    var set = function (open) {
      nav.classList.toggle("open", open);
      header.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", open);
      toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      document.body.style.overflow = open ? "hidden" : "";
    };
    toggle.addEventListener("click", function () { set(!nav.classList.contains("open")); });
    nav.addEventListener("click", function (e) { if (e.target.tagName === "A") set(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") set(false); });
  }

  /* Aparición al hacer scroll, con red de seguridad */
  function initReveals() {
    var els = document.querySelectorAll("[data-reveal]");
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-revealed"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-revealed"); io.unobserve(e.target); }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (el) { io.observe(el); });
    setTimeout(function () {
      document.querySelectorAll("[data-reveal]:not(.is-revealed)").forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-revealed");
      });
    }, 6000);
  }

  /* Contadores de cifras */
  function initCounters() {
    var els = document.querySelectorAll("[data-count]");
    if (!els.length || !("IntersectionObserver" in window)) return;
    var fmt = function (n) { return n.toLocaleString("es-CL"); };
    var run = function (el) {
      var target = parseInt(el.dataset.count, 10);
      var prefix = el.dataset.prefix || "";
      var start = null, dur = 1600;
      var step = function (t) {
        if (start === null) start = t;
        var p = Math.min((t - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = prefix + fmt(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.05 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* Línea de avance del proceso, ligada al scroll */
  function initSteps() {
    var steps = document.querySelector("[data-steps]");
    if (!steps) return;
    var ticking = false;
    var update = function () {
      ticking = false;
      var r = steps.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = (vh * 0.85 - r.top) / (vh * 0.5);
      steps.style.setProperty("--progress", Math.max(0, Math.min(1, p)).toFixed(3));
    };
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* Enlace activo del menú según la sección visible */
  function initScrollSpy() {
    var links = document.querySelectorAll('.nav a[href^="#"]:not(.nav-cta)');
    if (!links.length || !("IntersectionObserver" in window)) return;
    var map = {};
    links.forEach(function (a) {
      var sec = document.querySelector(a.getAttribute("href"));
      if (sec) map[sec.id] = a;
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && map[e.target.id]) {
          links.forEach(function (a) { a.classList.remove("is-active"); });
          map[e.target.id].classList.add("is-active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
  }

  function initYear() {
    var y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();
  }

  function boot() {
    safe(initHeader, "header");
    safe(initMenu, "menu");
    safe(initReveals, "reveals");
    safe(initCounters, "counters");
    safe(initSteps, "steps");
    safe(initScrollSpy, "scrollspy");
    safe(initYear, "year");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
