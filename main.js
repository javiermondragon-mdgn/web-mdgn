/* MDGN — interacciones del sitio. Script clásico (sin módulos): el contenido está en el HTML, aquí solo se enriquece. */
(function () {
  "use strict";
  window.__MDGN__ = true;

  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* Desplazamiento con inercia (Lenis). Para volver al scroll nativo del navegador, cambiar a false. */
  var SMOOTH_SCROLL = true;
  var lenis = null;

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[MDGN] " + name + " falló:", e); }
  }

  /* Un solo listener de scroll, sincronizado con requestAnimationFrame.
     Cada efecto declara read() (solo mide) y write() (solo escribe): primero se mide todo y después se escribe,
     así el navegador no recalcula el diseño varias veces por cuadro. */
  var scrollFns = [];
  var view = { y: 0, vh: window.innerHeight, max: 1 };
  function onScroll(fx) { scrollFns.push(fx); }
  function measure() {
    view.vh = window.innerHeight;
    view.max = Math.max(1, document.documentElement.scrollHeight - view.vh);
  }
  function frame() {
    view.y = window.scrollY;
    scrollFns.forEach(function (fx) { if (fx.read) safe(fx.read, "scroll read"); });
    scrollFns.forEach(function (fx) { if (fx.write) safe(fx.write, "scroll write"); });
  }
  function initScrollLoop() {
    var ticking = false, idle = null, root = document.documentElement;
    measure();
    window.addEventListener("scroll", function () {
      if (!root.classList.contains("is-scrolling")) root.classList.add("is-scrolling");
      clearTimeout(idle);
      idle = setTimeout(function () { root.classList.remove("is-scrolling"); }, 160);
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; frame(); });
    }, { passive: true });
    window.addEventListener("resize", function () { measure(); frame(); });
    window.addEventListener("load", function () { measure(); frame(); });
    if ("ResizeObserver" in window) new ResizeObserver(function () { measure(); }).observe(document.body);
    requestAnimationFrame(frame);
  }

  /* Inercia al desplazar con mouse o trackpad (en táctiles queda el scroll nativo) */
  function initSmoothScroll() {
    if (!SMOOTH_SCROLL || !finePointer || typeof window.Lenis !== "function") return;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    lenis = new window.Lenis({ lerp: reduced ? 0.2 : 0.1, smoothWheel: true, wheelMultiplier: 1 });
    window.__lenis = lenis;
    var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    /* Enlaces a secciones de la misma página: deslizamiento suave descontando la cabecera */
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href*="#"]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
      var url = new URL(a.href, location.href);
      if (url.pathname !== location.pathname || !url.hash || url.hash === "#") return;
      var el = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!el) return;
      e.preventDefault();
      var header = document.querySelector("[data-header]");
      lenis.scrollTo(el, { offset: -(header ? header.offsetHeight : 0), duration: 1.2 });
      history.pushState(null, "", url.hash);
    });
  }

  /* Header transparente sobre la portada, sólido al hacer scroll */
  function initHeader() {
    var header = document.querySelector("[data-header]");
    if (!header) return;
    var on = null;
    onScroll({ write: function () {
      var next = view.y > 40;
      if (next !== on) { on = next; header.classList.toggle("is-scrolled", on); }
    } });
  }

  /* Barra de avance de lectura */
  function initProgress() {
    var bar = document.querySelector(".progress");
    if (!bar) return;
    onScroll({ write: function () {
      bar.style.transform = "scaleX(" + Math.min(1, view.y / view.max).toFixed(4) + ")";
    } });
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
      if (lenis) { if (open) lenis.stop(); else lenis.start(); }
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
    }, { threshold: 0, rootMargin: "0px 0px 8% 0px" });
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
    var fill = document.createElement("span");
    fill.className = "steps-fill";
    fill.setAttribute("aria-hidden", "true");
    steps.appendChild(fill);
    var top = 0, lit = -1;
    onScroll({
      read: function () { top = steps.getBoundingClientRect().top; },
      write: function () {
        var p = Math.max(0, Math.min(1, (view.vh * 0.85 - top) / (view.vh * 0.5)));
        fill.style.transform = "scaleX(" + p.toFixed(3) + ")";
        var n = 0;
        items.forEach(function (li, i) { if (p > i / items.length + 0.01) n = i + 1; });
        if (n !== lit) {
          lit = n;
          items.forEach(function (li, i) { li.classList.toggle("is-on", i < n); });
        }
      }
    });
  }

  /* Foto de portada: leve desplazamiento con el scroll y con el mouse, en una sola transformación */
  var heroMove = { el: null, sy: 0, mx: 0, my: 0 };
  function applyHeroMove() {
    if (!heroMove.el) return;
    heroMove.el.style.transform = "translate3d(" + (heroMove.mx * -18).toFixed(1) + "px," +
      (heroMove.sy + heroMove.my * -12).toFixed(1) + "px,0)";
  }
  function initParallax() {
    heroMove.el = document.querySelector(".hero-move");
    if (!heroMove.el) return;
    heroMove.sy = 0;
    onScroll({ write: function () {
      if (view.y > view.vh * 1.2) return;
      heroMove.sy = Math.min(view.y * 0.06, 36);
      applyHeroMove();
    } });
  }

  /* Luz que sigue al mouse en la portada y reacción de la foto */
  function initSpotlight() {
    if (!finePointer) return;
    var hero = document.querySelector("[data-spotlight]");
    if (!hero) return;
    var light = document.createElement("div");
    light.className = "hero-light";
    light.setAttribute("aria-hidden", "true");
    hero.insertBefore(light, hero.querySelector(".hero-inner"));
    var px = 0, py = 0, rect = null, queued = false;
    var paint = function () {
      queued = false;
      if (!rect) rect = hero.getBoundingClientRect();
      light.style.transform = "translate3d(" + px.toFixed(0) + "px," + py.toFixed(0) + "px,0)";
      heroMove.mx = px / rect.width - 0.5;
      heroMove.my = py / rect.height - 0.5;
      applyHeroMove();
    };
    hero.addEventListener("mouseenter", function () { rect = hero.getBoundingClientRect(); hero.classList.add("is-lit"); });
    hero.addEventListener("mousemove", function (e) {
      if (!rect) rect = hero.getBoundingClientRect();
      px = e.clientX - rect.left;
      py = e.clientY - rect.top;
      if (!queued) { queued = true; requestAnimationFrame(paint); }
    });
    hero.addEventListener("mouseleave", function () {
      hero.classList.remove("is-lit");
      rect = null;
      heroMove.mx = heroMove.my = 0;
      applyHeroMove();
    });
    window.addEventListener("scroll", function () { rect = null; }, { passive: true });
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

  /* Carrusel de fotos: al abrir una foto se recorren todas las del mismo proyecto */
  function initLightbox() {
    var dlg = document.querySelector(".lightbox");
    if (!dlg || typeof dlg.showModal !== "function") return;
    var img = dlg.querySelector(".lb-stage img");
    var cap = dlg.querySelector(".lb-caption");
    var count = dlg.querySelector(".lb-count");
    var thumbs = dlg.querySelector(".lb-thumbs");
    var prev = dlg.querySelector(".lb-prev");
    var next = dlg.querySelector(".lb-next");
    var items = [], index = 0;

    var describe = function (el) {
      var src = el.querySelector("img");
      var fig = el.closest("figure");
      var h3 = fig && fig.querySelector("h3"), p = fig && fig.querySelector("figcaption p");
      return {
        src: src.getAttribute("src"),
        alt: src.alt,
        title: el.dataset.title || (h3 ? h3.textContent : ""),
        sub: el.dataset.sub || (p ? p.textContent : "")
      };
    };

    var show = function (i, dir) {
      index = (i + items.length) % items.length;
      var it = items[index];
      var apply = function () {
        img.src = it.src;
        img.alt = it.alt;
        cap.innerHTML = "";
        cap.appendChild(document.createTextNode(it.title));
        if (it.sub) { var s = document.createElement("span"); s.textContent = it.sub; cap.appendChild(s); }
        count.textContent = items.length > 1 ? (index + 1) + " / " + items.length : "";
        thumbs.querySelectorAll("button").forEach(function (b, k) { b.setAttribute("aria-selected", k === index ? "true" : "false"); });
        img.classList.remove("is-out");
      };
      if (dir && dlg.open) {
        img.style.setProperty("--dir", dir > 0 ? "-24px" : "24px");
        img.classList.add("is-out");
        setTimeout(apply, 180);
      } else apply();
      [index - 1, index + 1].forEach(function (k) {
        var n = items[(k + items.length) % items.length];
        if (n) { var pre = new Image(); pre.src = n.src; }
      });
    };

    var open = function (trigger) {
      var gallery = trigger.closest(".project-gallery");
      var els = gallery ? Array.prototype.slice.call(gallery.querySelectorAll("[data-lightbox]")) : [trigger];
      items = els.map(describe);
      /* Fichas de la portada: las demás fotos del proyecto vienen en una lista oculta junto a la foto principal */
      var fig = trigger.closest("figure");
      if (!gallery && fig) {
        Array.prototype.forEach.call(fig.querySelectorAll(".work-more [data-src]"), function (li) {
          items.push({ src: li.dataset.src, alt: li.dataset.alt || "", title: items[0].title, sub: li.dataset.sub || "" });
        });
      }
      var multi = items.length > 1;
      prev.hidden = next.hidden = !multi;
      thumbs.innerHTML = "";
      if (multi) {
        items.forEach(function (it, k) {
          var b = document.createElement("button");
          b.type = "button";
          b.setAttribute("role", "tab");
          b.setAttribute("aria-label", "Foto " + (k + 1) + " de " + items.length);
          var t = document.createElement("img");
          t.src = it.src; t.alt = "";
          b.appendChild(t);
          b.addEventListener("click", function () { if (k !== index) show(k, k > index ? 1 : -1); });
          thumbs.appendChild(b);
        });
      }
      show(els.indexOf(trigger));
      dlg.showModal();
      if (lenis) lenis.stop();
    };

    document.querySelectorAll("[data-lightbox]").forEach(function (el) {
      el.addEventListener("click", function () { open(el); });
      el.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(el); } });
    });
    prev.addEventListener("click", function () { show(index - 1, -1); });
    next.addEventListener("click", function () { show(index + 1, 1); });
    dlg.addEventListener("keydown", function (e) {
      if (items.length < 2) return;
      if (e.key === "ArrowRight") { e.preventDefault(); show(index + 1, 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); show(index - 1, -1); }
    });
    var startX = null;
    var stage = dlg.querySelector(".lb-stage");
    stage.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener("touchend", function (e) {
      if (startX === null || items.length < 2) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
      startX = null;
    });
    dlg.querySelector(".lightbox-close").addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("close", function () { if (lenis) lenis.start(); });
    dlg.addEventListener("click", function (e) {
      if (e.target === dlg || e.target === stage || e.target.matches(".lb-stage figure")) dlg.close();
    });
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

  /* Portada: carrusel de obras con avance automático; se pausa con el mouse encima */
  function initSlider() {
    var hero = document.querySelector("[data-slider]");
    if (!hero) return;
    var slides = Array.prototype.slice.call(hero.querySelectorAll(".slide"));
    var dotsBox = hero.querySelector(".slide-dots");
    var cap = hero.querySelector(".slide-caption");
    var counter = hero.querySelector(".slide-counter");
    var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var DUR = 6000;
    var i = 0, timer = null, paused = false, left = DUR, started = 0;
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };

    var dots = slides.map(function (s, k) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-label", s.dataset.name);
      b.style.setProperty("--dur", DUR + "ms");
      b.addEventListener("click", function () { go(k); });
      dotsBox.appendChild(b);
      return b;
    });

    var render = function () {
      var s = slides[i];
      slides.forEach(function (el, k) { el.classList.toggle("is-active", k === i); });
      dots.forEach(function (d, k) {
        d.classList.remove("is-active");
        d.classList.toggle("is-done", k < i);
        d.setAttribute("aria-selected", k === i ? "true" : "false");
      });
      void dots[i].offsetWidth;
      dots[i].classList.add("is-active");
      counter.innerHTML = "<b>" + pad(i + 1) + "</b> / " + pad(slides.length);
      cap.classList.add("is-changing");
      setTimeout(function () {
        cap.href = s.dataset.href;
        cap.querySelector(".slide-tag").textContent = s.dataset.tag;
        cap.querySelector(".slide-name").textContent = s.dataset.name;
        cap.querySelector(".slide-line").textContent = s.dataset.line;
        cap.querySelector(".slide-cta").firstChild.textContent = s.dataset.href.charAt(0) === "#" ? "Ver obra " : "Ver caso ";
        cap.classList.remove("is-changing");
      }, 300);
    };
    var schedule = function (ms) {
      clearTimeout(timer);
      if (still) return;
      left = ms; started = Date.now();
      timer = setTimeout(function () { go(i + 1); }, ms);
    };
    var go = function (k) {
      i = (k + slides.length) % slides.length;
      render();
      schedule(DUR);
    };

    hero.querySelector(".slide-prev").addEventListener("click", function () { go(i - 1); });
    hero.querySelector(".slide-next").addEventListener("click", function () { go(i + 1); });
    hero.addEventListener("mouseenter", function () {
      if (paused || still) return;
      paused = true; hero.classList.add("is-paused");
      clearTimeout(timer); left -= Date.now() - started;
    });
    hero.addEventListener("mouseleave", function () {
      if (!paused) return;
      paused = false; hero.classList.remove("is-paused");
      schedule(Math.max(left, 300));
    });
    var startX = null;
    hero.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener("touchend", function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) go(i + (dx < 0 ? 1 : -1));
      startX = null;
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) clearTimeout(timer); else if (!paused) schedule(DUR);
    });

    render();
    schedule(DUR);
  }

  /* Logos de clientes: se duplica la lista para que la franja avance sin cortes */
  function initLogos() {
    var track = document.querySelector(".logos-track");
    if (!track) return;
    Array.prototype.slice.call(track.children).forEach(function (li) {
      var c = li.cloneNode(true);
      c.setAttribute("aria-hidden", "true");
      c.querySelector("img").alt = "";
      track.appendChild(c);
    });
  }

  function initYear() {
    var y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();
  }

  function boot() {
    safe(initSmoothScroll, "smooth scroll");
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
    safe(initSlider, "slider");
    safe(initLogos, "logos");
    safe(initYear, "year");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
