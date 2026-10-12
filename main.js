/* MDGN — interacciones del sitio. Script clásico (sin módulos): el contenido está en el HTML, aquí solo se enriquece. */
(function () {
  "use strict";
  window.__MDGN__ = true;

  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[MDGN] " + name + " falló:", e); }
  }

  /* Un solo listener de scroll, sincronizado con requestAnimationFrame */
  var scrollFns = [];
  function onScroll(fn) { scrollFns.push(fn); fn(); }
  function initScrollLoop() {
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        scrollFns.forEach(function (fn) { safe(fn, "scroll"); });
      });
    }, { passive: true });
    window.addEventListener("resize", function () { scrollFns.forEach(function (fn) { safe(fn, "resize"); }); });
  }

  /* Header transparente sobre la portada, sólido al hacer scroll */
  function initHeader() {
    var header = document.querySelector("[data-header]");
    if (!header) return;
    onScroll(function () { header.classList.toggle("is-scrolled", window.scrollY > 40); });
  }

  /* Barra de avance de lectura */
  function initProgress() {
    var bar = document.querySelector(".progress");
    if (!bar) return;
    onScroll(function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.setProperty("--p", max > 0 ? (window.scrollY / max).toFixed(4) : 0);
    });
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

  /* Divide los títulos en palabras para que suban una a una */
  function initSplit() {
    document.querySelectorAll("[data-split]").forEach(function (el) {
      if (el.dataset.splitDone) return;
      el.dataset.splitDone = "1";
      el.setAttribute("aria-label", el.textContent.trim().replace(/\s+/g, " "));
      var i = 0;
      var wrap = function (text) {
        return text.split(/(\s+)/).map(function (w) {
          if (!w || /^\s+$/.test(w)) return w;
          var esc = w.replace(/&/g, "&amp;").replace(/</g, "&lt;");
          return '<span class="sw" aria-hidden="true"><span style="--i:' + (i++) + '">' + esc + "</span></span>";
        }).join("");
      };
      el.innerHTML = Array.prototype.map.call(el.childNodes, function (node) {
        if (node.nodeType === 3) return wrap(node.textContent);
        if (node.nodeName === "BR") return "<br>";
        return node.outerHTML;
      }).join("");
      if (el.hasAttribute("data-split-now")) {
        setTimeout(function () { el.classList.add("is-revealed"); }, 150);
      }
    });
  }

  /* Escalonado automático dentro de grillas */
  function initStagger() {
    var groups = [[".items > [data-reveal]", 3, 0.08], [".ledger-row[data-reveal]", 99, 0.03]];
    groups.forEach(function (g) {
      document.querySelectorAll(g[0]).forEach(function (el, idx) {
        if (!el.style.getPropertyValue("--d")) el.style.setProperty("--d", ((idx % g[1]) * g[2]).toFixed(2) + "s");
      });
    });
    document.querySelectorAll(".clients li").forEach(function (li, idx) { li.style.setProperty("--i", idx); });
  }

  /* Aparición al hacer scroll, con red de seguridad */
  function initReveals() {
    var sel = "[data-reveal], [data-split]:not([data-split-now])";
    var els = document.querySelectorAll(sel);
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
      document.querySelectorAll("[data-reveal]:not(.is-revealed), [data-split]:not(.is-revealed)").forEach(function (el) {
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

  /* Línea de avance del proceso e hitos que se encienden */
  function initSteps() {
    var steps = document.querySelector("[data-steps]");
    if (!steps) return;
    var items = steps.querySelectorAll("li");
    onScroll(function () {
      var r = steps.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = Math.max(0, Math.min(1, (vh * 0.85 - r.top) / (vh * 0.5)));
      steps.style.setProperty("--progress", p.toFixed(3));
      items.forEach(function (li, i) { li.classList.toggle("is-on", p > i / items.length + 0.01); });
    });
  }

  /* Leve desplazamiento de la foto de portada al hacer scroll */
  function initParallax() {
    var img = document.querySelector("[data-parallax]");
    if (!img) return;
    onScroll(function () {
      var y = window.scrollY;
      if (y > window.innerHeight * 1.2) return;
      img.style.translate = "0 " + Math.min(y * 0.06, 36).toFixed(1) + "px";
    });
  }

  /* Luz que sigue al mouse en la portada */
  function initSpotlight() {
    if (!finePointer) return;
    var hero = document.querySelector("[data-spotlight]");
    if (!hero) return;
    hero.addEventListener("mousemove", function (e) {
      var r = hero.getBoundingClientRect();
      hero.style.setProperty("--mx", (e.clientX - r.left) + "px");
      hero.style.setProperty("--my", (e.clientY - r.top) + "px");
      hero.classList.add("is-lit");
    });
    hero.addEventListener("mouseleave", function () { hero.classList.remove("is-lit"); });
  }

  /* Botones que se acercan levemente al cursor */
  function initMagnetic() {
    if (!finePointer) return;
    document.querySelectorAll("[data-magnetic]").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        btn.style.translate = (dx * 0.22).toFixed(1) + "px " + (dy * 0.32).toFixed(1) + "px";
      });
      btn.addEventListener("mouseleave", function () { btn.style.translate = "0 0"; });
    });
  }

  /* Cursor propio: círculo que crece sobre enlaces y muestra "Ver" sobre las obras */
  function initCursor() {
    if (!finePointer) return;
    var cursor = document.querySelector(".cursor");
    if (!cursor) return;
    document.documentElement.classList.add("has-cursor");
    var x = 0, y = 0, cx = 0, cy = 0, ready = false, running = false;
    var loop = function () {
      cx += (x - cx) * 0.2;
      cy += (y - cy) * 0.2;
      cursor.style.transform = "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0)";
      if (Math.abs(x - cx) > 0.1 || Math.abs(y - cy) > 0.1) requestAnimationFrame(loop);
      else running = false;
    };
    window.addEventListener("mousemove", function (e) {
      x = e.clientX; y = e.clientY;
      if (!ready) {
        ready = true; cx = x; cy = y;
        cursor.classList.add("is-ready");
      }
      if (!running) { running = true; requestAnimationFrame(loop); }
    }, { passive: true });
    document.addEventListener("mouseover", function (e) {
      var view = e.target.closest("[data-cursor]");
      var link = e.target.closest("a, button");
      cursor.classList.toggle("is-view", !!view);
      cursor.classList.toggle("is-link", !view && !!link);
    });
    document.addEventListener("mouseleave", function () { cursor.classList.remove("is-ready"); ready = false; });
  }

  /* Foto ampliada al hacer clic en una obra */
  function initLightbox() {
    var dlg = document.querySelector(".lightbox");
    if (!dlg || typeof dlg.showModal !== "function") return;
    var img = dlg.querySelector("img");
    var cap = dlg.querySelector("figcaption");
    var open = function (trigger) {
      var src = trigger.querySelector("img");
      var fig = trigger.closest("figure");
      img.src = src.getAttribute("src");
      img.alt = src.alt;
      var h3 = fig.querySelector("h3"), p = fig.querySelector("figcaption p");
      cap.innerHTML = "";
      if (h3) cap.appendChild(document.createTextNode(h3.textContent));
      if (p) { var s = document.createElement("span"); s.textContent = p.textContent; cap.appendChild(s); }
      dlg.showModal();
    };
    document.querySelectorAll("[data-lightbox]").forEach(function (el) {
      el.addEventListener("click", function () { open(el); });
      el.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(el); } });
    });
    dlg.querySelector(".lightbox-close").addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
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
    safe(initScrollLoop, "scroll loop");
    safe(initHeader, "header");
    safe(initProgress, "progress");
    safe(initMenu, "menu");
    safe(initSplit, "split");
    safe(initStagger, "stagger");
    safe(initReveals, "reveals");
    safe(initCounters, "counters");
    safe(initSteps, "steps");
    safe(initParallax, "parallax");
    safe(initSpotlight, "spotlight");
    safe(initMagnetic, "magnetic");
    safe(initCursor, "cursor");
    safe(initLightbox, "lightbox");
    safe(initScrollSpy, "scrollspy");
    safe(initYear, "year");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
