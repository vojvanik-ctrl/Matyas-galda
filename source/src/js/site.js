/* Matyáš Galda — mobile menu and gently paced drawing loop. */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  /* ---------- Mobile menu ---------- */
  var nav = document.querySelector(".site-nav");
  var toggle = nav && nav.querySelector(".menu-toggle");
  var mobile = window.matchMedia("(max-width: 719px)");

  function setOpen(open, focusToggle) {
    if (!toggle) return;
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    if (!open && focusToggle) toggle.focus();
  }

  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") !== "true";
      setOpen(open, false);
      if (open) {
        var first = nav.querySelector("ul a");
        if (first) first.focus();
      }
    });
    nav.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false, true);
      }
    });
    nav.querySelectorAll("ul a").forEach(function (a) {
      a.addEventListener("click", function () { setOpen(false, false); });
    });
    document.addEventListener("click", function (e) {
      if (nav.classList.contains("is-open") && !nav.contains(e.target)) setOpen(false, false);
    });
    document.addEventListener("focusin", function (e) {
      if (nav.classList.contains("is-open") && !nav.contains(e.target)) setOpen(false, false);
    });
    var onChange = function () { if (!mobile.matches) setOpen(false, false); };
    if (mobile.addEventListener) mobile.addEventListener("change", onChange);
    else if (mobile.addListener) mobile.addListener(onChange);
  }

  /* ---------- Selected work carousel ----------
     Native horizontal scroll with snap points does the moving (touch, trackpad,
     keyboard focus); the buttons only call scrollBy. No autoplay. */
  (function () {
    var root = document.querySelector("[data-carousel]");
    if (!root) return;
    var track = root.querySelector(".work-track");
    var controls = root.querySelector(".carousel-controls");
    var slides = Array.prototype.slice.call(track.children);
    if (!track || !controls || slides.length < 2) return;
    var prev = controls.querySelector('[data-step="-1"]');
    var next = controls.querySelector('[data-step="1"]');
    var count = controls.querySelector(".carousel-count");
    var status = root.querySelector("[data-carousel-status]");
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    var announce = false;
    var ticking = false;

    function visibleRange() {
      var box = track.getBoundingClientRect();
      var first = -1, last = -1;
      slides.forEach(function (s, i) {
        var r = s.getBoundingClientRect();
        if (r.left >= box.left - 2 && r.right <= box.right + 2) {
          if (first < 0) first = i;
          last = i;
        }
      });
      if (first < 0) {             // nothing fully visible (very narrow): use the nearest
        var best = 0, bestD = Infinity;
        slides.forEach(function (s, i) {
          var d = Math.abs(s.getBoundingClientRect().left - box.left);
          if (d < bestD) { bestD = d; best = i; }
        });
        first = last = best;
      }
      return [first, last];
    }

    function update() {
      ticking = false;
      var max = track.scrollWidth - track.clientWidth;
      var atStart = track.scrollLeft <= 2;
      var atEnd = track.scrollLeft >= max - 2;
      prev.setAttribute("aria-disabled", String(atStart));
      next.setAttribute("aria-disabled", String(atEnd));
      var r = visibleRange();
      var n = slides.length;
      count.textContent = (r[0] === r[1] ? r[0] + 1 : (r[0] + 1) + "–" + (r[1] + 1)) + " / " + n;
      if (announce && status) {
        status.textContent = r[0] === r[1]
          ? "Showing project " + (r[0] + 1) + " of " + n
          : "Showing projects " + (r[0] + 1) + " to " + (r[1] + 1) + " of " + n;
        announce = false;
      }
    }

    function go(dir) {
      var stepPx = slides[1].getBoundingClientRect().left - slides[0].getBoundingClientRect().left;
      announce = true;
      track.scrollBy({ left: dir * stepPx, behavior: reduce.matches ? "auto" : "smooth" });
    }

    [prev, next].forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (btn.getAttribute("aria-disabled") === "true") return;
        go(Number(btn.getAttribute("data-step")));
      });
    });
    track.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener("resize", update);
    controls.hidden = false;
    update();
  })();

  /* ---------- Hero drawing loop ----------
     The still is always available. Load one compact video only when visible,
     pause off screen and retain the still for reduced motion or playback errors. */
  var video = document.querySelector(".hero-video[data-src]");
  if (!video) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var inView = true;
  var loaded = false;

  video.addEventListener("playing", function () { video.classList.add("is-ready"); });
  video.addEventListener("error", function () { video.classList.remove("is-ready"); });

  function update() {
    if (reduce.matches || !inView || document.hidden) {
      video.pause();
      if (reduce.matches) {
        video.currentTime = 0;
        video.classList.remove("is-ready");
      }
      return;
    }
    if (!loaded) {
      video.src = video.getAttribute("data-src");
      video.removeAttribute("data-src");
      video.load();
      loaded = true;
    }
    var playing = video.play();
    if (playing && playing.catch) playing.catch(function () {
      video.classList.remove("is-ready");
    });
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      update();
    }, { threshold: 0.05 }).observe(video);
  }
  document.addEventListener("visibilitychange", update);
  if (reduce.addEventListener) reduce.addEventListener("change", update);
  else if (reduce.addListener) reduce.addListener(update);
  // Let the still, fonts and first thumbnails load before fetching the video.
  if (document.readyState === "complete") update();
  else window.addEventListener("load", update);
})();
