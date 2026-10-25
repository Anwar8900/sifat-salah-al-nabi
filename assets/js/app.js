/* صفة صلاة النبي — app scripts (theme, font scale, search, index drawer) */
(function () {
  "use strict";

  var root = document.documentElement;
  var LS = {
    theme: "salat.theme",
    scale: "salat.scale",
    lang: "salat.lang"
  };

  /* ---------- icons (defined first: used by applyTheme) ---------- */
  var icons = {
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>'
  };

  /* ---------- theme ---------- */
  function applyTheme(t) {
    root.setAttribute("data-theme", t);
    document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
      var label = t === "dark"
        ? (btn.getAttribute("data-label-light") || "Light mode")
        : (btn.getAttribute("data-label-dark") || "Dark mode");
      btn.setAttribute("aria-label", label);
      btn.setAttribute("title", label);
      btn.setAttribute("aria-pressed", t === "dark" ? "true" : "false");
      btn.innerHTML = t === "dark" ? icons.sun : icons.moon;
    });
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", t === "dark" ? "#14120F" : "#1D6B50");
  }
  var stored = null;
  try { stored = localStorage.getItem(LS.theme); } catch (e) {}
  var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(stored || (prefersDark ? "dark" : "light"));

  /* ---------- font scale ---------- */
  var scales = [0.9, 1, 1.12, 1.25];
  var idx = 1;
  try {
    var s = localStorage.getItem(LS.scale);
    if (s !== null) {
      idx = scales.indexOf(parseFloat(s));
      if (idx < 0) idx = 1;
    }
  } catch (e) {}
  function applyScale() {
    root.style.setProperty("--scale", scales[idx]);
    document.querySelectorAll("[data-scale-down]").forEach(function (b) { b.disabled = idx === 0; });
    document.querySelectorAll("[data-scale-up]").forEach(function (b) { b.disabled = idx === scales.length - 1; });
    try { localStorage.setItem(LS.scale, scales[idx]); } catch (e) {}
  }
  applyScale();

  /* ---------- drawer (mobile index) ---------- */
  var drawer = document.getElementById("mobile-index");
  var backdrop = document.getElementById("backdrop");
  var drawerBtn = document.querySelector("[data-drawer-toggle]");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("open", open);
    if (backdrop) backdrop.classList.toggle("open", open);
    document.body.style.overflow = open ? "hidden" : "";
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    if (drawerBtn) drawerBtn.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      var first = drawer.querySelector("a, button");
      if (first) first.focus({ preventScroll: true });
    } else if (drawer.contains(document.activeElement) && drawerBtn) {
      drawerBtn.focus({ preventScroll: true });
    }
  }
  if (drawer) drawer.setAttribute("aria-hidden", "true");
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-drawer-toggle]")) { setDrawer(!drawer.classList.contains("open")); return; }
    if (e.target.closest("[data-drawer-close]")) { setDrawer(false); return; }
    if (e.target.closest("#backdrop")) { setDrawer(false); return; }
    if (drawer && drawer.classList.contains("open") && drawer.contains(e.target)) {
      if (e.target.closest("a")) setDrawer(false);
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setDrawer(false);
  });

  /* ---------- side index active state + current reading position ---------- */
  var sections = Array.prototype.slice.call(document.querySelectorAll(".intro-block[id], section.chapter[id]"));
  var readingNow = document.querySelector("#reading-now strong");
  var indexLinks = [];
  var indexMap = {};
  document.querySelectorAll(".side ol a, .mobile-index a, .toc-list a").forEach(function (a) {
    var href = a.getAttribute("href") || "";
    if (href.charAt(0) !== "#") return;
    var id = href.slice(1);
    indexLinks.push(a);
    if (!indexMap[id]) indexMap[id] = [];
    indexMap[id].push(a);
  });

  function localizeDigits(n) {
    var s = String(n);
    if (root.lang !== "ar") return s;
    var map = { "0": "٠", "1": "١", "2": "٢", "3": "٣", "4": "٤", "5": "٥", "6": "٦", "7": "٧", "8": "٨", "9": "٩" };
    return s.replace(/[0-9]/g, function (d) { return map[d]; });
  }

  function linkTitle(id) {
    var a = indexMap[id] && indexMap[id][0];
    if (a) {
      var spans = a.querySelectorAll("span");
      if (spans.length) return spans[spans.length - 1].textContent.trim();
    }
    var sec = document.getElementById(id);
    var h = sec && sec.querySelector("h1, h2");
    return h ? h.textContent.trim() : "";
  }

  function updateActive() {
    var header = document.querySelector(".site-header");
    var offset = (header ? header.getBoundingClientRect().height : 58) + 18;
    var current = null;
    var firstVisible = null;
    sections.forEach(function (sec) {
      if (sec.hidden || sec.offsetParent === null) return;
      if (!firstVisible) firstVisible = sec;
      if (sec.getBoundingClientRect().top <= offset) current = sec;
    });
    if (!current) current = firstVisible;
    indexLinks.forEach(function (a) {
      a.classList.remove("active");
      a.removeAttribute("aria-current");
    });
    if (current) {
      (indexMap[current.id] || []).forEach(function (a) {
        a.classList.add("active");
        a.setAttribute("aria-current", "location");
      });
      if (readingNow) readingNow.textContent = linkTitle(current.id);
    }
  }

  var activeTimer = null;
  function scheduleActive() {
    if (activeTimer) return;
    activeTimer = window.setTimeout(function () {
      activeTimer = null;
      updateActive();
    }, 70);
  }
  if (sections.length) {
    window.addEventListener("scroll", scheduleActive, { passive: true });
    window.addEventListener("resize", scheduleActive);
    updateActive();
  }

  /* ---------- search ---------- */
  var input = document.getElementById("q");
  var head = document.getElementById("results-head");
  var blocks = Array.prototype.slice.call(document.querySelectorAll(".prose p, .prose li"));
  var notes = Array.prototype.slice.call(document.querySelectorAll(".prose .explain"));

  // Normalise text nodes only, so inline labels and other markup stay intact.
  blocks.forEach(function (el) {
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
    var node;
    while ((node = walker.nextNode())) {
      try { node.nodeValue = node.nodeValue.normalize("NFC"); } catch (e) {}
    }
  });

  function clearMarks(el) {
    var marks = el.querySelectorAll("mark");
    if (!marks.length) return;
    for (var i = 0; i < marks.length; i++) {
      var mark = marks[i];
      mark.parentNode.replaceChild(document.createTextNode(mark.textContent), mark);
    }
    el.normalize();
  }

  function highlight(el, needle) {
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
    var node;
    while ((node = walker.nextNode())) {
      var text = node.nodeValue;
      var idx = text.toLowerCase().indexOf(needle);
      if (idx >= 0) {
        node.splitText(idx + needle.length);
        var mid = node.splitText(idx);
        var mark = document.createElement("mark");
        mark.textContent = mid.nodeValue;
        mid.parentNode.replaceChild(mark, mid);
        return true;
      }
    }
    return false;
  }

  var searchClear = document.querySelector("[data-search-clear]");
  var searchReset = document.querySelector("[data-search-reset]");

  function setSideState() {
    document.querySelectorAll(".side ol li, .toc-list li").forEach(function (li) {
      var a = li.querySelector("a");
      if (!a) return;
      var sec = document.getElementById(a.getAttribute("href").slice(1));
      li.hidden = !!(sec && sec.hidden);
    });
    updateActive();
  }

  function showAll(preserveInput) {
    if (head) head.textContent = "";
    blocks.forEach(function (el) {
      el.hidden = false;
      clearMarks(el);
    });
    notes.forEach(function (n) { n.hidden = false; });
    document.querySelectorAll("section.chapter, .intro-block").forEach(function (c) { c.hidden = false; });
    if (!preserveInput && input) input.value = "";
    if (searchClear) searchClear.hidden = !(input && input.value);
    if (searchReset) searchReset.hidden = true;
    setSideState();
  }

  function resetSearch(focus) {
    showAll(false);
    if (focus && input) input.focus({ preventScroll: true });
  }

  if (input) {
    input.addEventListener("input", function () {
      var q = input.value.trim();
      if (searchClear) searchClear.hidden = q.length === 0;
      if (q.length < 2) {
        showAll(true);
        return;
      }
      if (searchReset) searchReset.hidden = false;
      var needle = q;
      try { needle = needle.normalize("NFC"); } catch (e) {}
      needle = needle.toLowerCase();
      var hits = 0;
      blocks.forEach(function (el) {
        clearMarks(el);
        if (highlight(el, needle)) {
          hits++;
          el.hidden = false;
        } else {
          el.hidden = true;
        }
      });
      if (head) {
        head.textContent = hits
          ? (localizeDigits(hits) + " " + (hits === 1 ? (head.dataset.hitsOne || "result") : (head.dataset.hitsMany || "results")))
          : (head.dataset.none || "No results");
      }
      notes.forEach(function (n) {
        n.hidden = !Array.prototype.some.call(n.querySelectorAll("p, li"), function (block) {
          return !block.hidden;
        });
      });
      document.querySelectorAll("section.chapter, .intro-block").forEach(function (c) {
        c.hidden = (c.querySelectorAll(".prose p:not([hidden]), .prose li:not([hidden])").length === 0);
      });
      setSideState();
    });

    input.addEventListener("search", function () {
      if (!input.value) resetSearch(false);
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        e.preventDefault();
        resetSearch(true);
      }
    });
  }

  if (searchClear) {
    searchClear.addEventListener("click", function () { resetSearch(true); });
  }
  if (searchReset) {
    searchReset.addEventListener("click", function () { resetSearch(true); });
  }

  /* ---------- toast ---------- */
  function toast(msg) {
    var t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._t);
    t._t = setTimeout(function () { t.classList.remove("show"); }, 2400);
  }

  /* ---------- install app (PWA) ---------- */
  var installButtons = Array.prototype.slice.call(document.querySelectorAll("[data-install]"));
  var deferredInstall = null;
  var standalone = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;
  function showInstall(show) {
    installButtons.forEach(function (b) { b.hidden = !show; });
  }
  if (standalone) showInstall(false);
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredInstall = e;
    root.setAttribute("data-install-ready", "true");
    showInstall(true);
  });
  window.addEventListener("appinstalled", function () {
    deferredInstall = null;
    root.removeAttribute("data-install-ready");
    showInstall(false);
    toast((document.body.dataset && document.body.dataset.msgInstallDone) || "تم تثبيت التطبيق بنجاح");
  });
  function installApp() {
    if (deferredInstall) {
      deferredInstall.prompt();
      var choice = deferredInstall.userChoice;
      deferredInstall = null;
      if (choice && choice.then) {
        choice.then(function (result) {
          if (result && result.outcome === "accepted") showInstall(false);
        }).catch(function () {});
      }
      return;
    }
    var ua = navigator.userAgent || "";
    var isIos = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    var ds = document.body.dataset || {};
    toast(isIos
      ? (ds.msgInstallIos || "على iPhone أو iPad: اضغط زر المشاركة ثم «إضافة إلى الشاشة الرئيسية».")
      : (ds.msgInstall || "لتثبيت التطبيق: افتح قائمة المتصفح واختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية»."));
  }

  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-install]")) {
      installApp();
      return;
    }
    var soon = e.target.closest("[data-soon]");
    if (soon) {
      e.preventDefault();
      toast(soon.getAttribute("data-soon") || "سوف يتم في مرحلة قادمة");
      return;
    }
    if (e.target.closest("[data-theme-toggle]")) {
      var cur = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(cur);
      try { localStorage.setItem(LS.theme, cur); } catch (er) {}
      return;
    }
    if (e.target.closest("[data-scale-up]")) {
      if (idx < scales.length - 1) { idx++; applyScale(); toast((document.body.dataset.msgUp || "Larger text")); }
      return;
    }
    if (e.target.closest("[data-scale-down]")) {
      if (idx > 0) { idx--; applyScale(); toast((document.body.dataset.msgDown || "Smaller text")); }
      return;
    }
    if (e.target.closest("[data-copy]")) {
      var sel = window.getSelection();
      if (sel && sel.toString()) {
        navigator.clipboard.writeText(sel.toString()).then(function () { toast("Copied"); });
      }
      return;
    }
  });

  /* ---------- print ---------- */
  document.querySelectorAll("[data-print]").forEach(function (b) {
    b.addEventListener("click", function () { window.print(); });
  });

  /* ---------- language switch keeps the same page ---------- */
  document.querySelectorAll(".lang-switch a").forEach(function (a) {
    a.addEventListener("click", function () {
      if (a.hasAttribute("data-soon")) return;
      try { localStorage.setItem(LS.lang, a.dataset.lang); } catch (e) {}
    });
  });
})();
