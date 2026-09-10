document.addEventListener("DOMContentLoaded", function () {
  const root = document.documentElement;
  const lampToggle = document.getElementById("lampToggle");
  const lampLabel = document.getElementById("lampLabel");
  const loaderStatus = document.getElementById("loaderStatus");

  const loaderMessages = [
    "Opening Drafting Room...",
    "Retrieving Blueprints...",
    "Preparing Archive...",
    "Loading Case Files...",
    "Ready.",
  ];

  let msgIndex = 0;
  const msgInterval = setInterval(function () {
    msgIndex++;
    if (msgIndex < loaderMessages.length && loaderStatus) {
      loaderStatus.textContent = loaderMessages[msgIndex];
    } else {
      clearInterval(msgInterval);
    }
  }, 900);

  setTimeout(function () {
    const loader = document.getElementById("loader");
    if (loader) loader.remove();
  }, 5500);

  const savedTheme = localStorage.getItem("draftingRoomTheme") || "light";
  root.setAttribute("data-theme", savedTheme);
  updateLampLabel(savedTheme);

  if (lampToggle) {
    lampToggle.addEventListener("click", function () {
      const current = root.getAttribute("data-theme");
      const next = current === "light" ? "dark" : "light";
      root.setAttribute("data-theme", next);
      localStorage.setItem("draftingRoomTheme", next);
      updateLampLabel(next);
    });
  }

  function updateLampLabel(theme) {
    if (lampLabel) {
      lampLabel.textContent = theme === "light" ? "Lamp On" : "Lamp Off";
    }
  }

  // =============================
  // REVEAL ANIMATIONS (per-view)
  // =============================
  // Views are shown/hidden rather than scrolled past, so reveal-up
  // elements animate in once when their view becomes active instead
  // of relying on scroll-based IntersectionObserver.

  document.querySelectorAll(".app-view").forEach(function (view) {
    view.querySelectorAll(".reveal-up").forEach(function (el, i) {
      el.dataset.delay = (i % 4) * 80;
    });
  });

  function playReveal(view) {
    view.querySelectorAll(".reveal-up").forEach(function (el) {
      el.classList.remove("visible");
      const delay = parseInt(el.dataset.delay || 0, 10);
      requestAnimationFrame(function () {
        setTimeout(function () {
          el.classList.add("visible");
        }, delay);
      });
    });
  }

  const mediaQueryReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );

  function animateCounters(view) {
    view.querySelectorAll(".ledger-num").forEach(function (el) {
      const target = parseInt(el.getAttribute("data-target"), 10);
      let n = 0;
      const step = Math.max(1, Math.ceil(target / 30));
      const tick = setInterval(function () {
        n = Math.min(n + step, target);
        el.textContent = n;
        if (n >= target) clearInterval(tick);
      }, 50);
    });
  }

  // =============================
  // APP SHELL — VIEW SWITCHING
  // =============================

  const appShell = document.getElementById("appShell");
  const appMain = document.getElementById("appMain");
  const views = Array.prototype.slice.call(
    document.querySelectorAll(".app-view"),
  );
  const viewIds = views.map(function (v) {
    return v.id;
  });
  const navButtons = Array.prototype.slice.call(
    document.querySelectorAll("[data-view]"),
  );
  const topbarViewTitle = document.getElementById("topbarViewTitle");
  const sidebarCollapseBtn = document.getElementById("sidebarCollapseBtn");

  const DEFAULT_VIEW = viewIds.includes("blueprint-archive")
    ? "blueprint-archive"
    : viewIds[0];

  let currentView = null;
  let hasAnimatedCounters = false;

  function labelFor(id) {
    const btn = navButtons.find(function (b) {
      return b.getAttribute("data-view") === id;
    });
    if (!btn) return "";
    const labelEl = btn.querySelector(".nav-item-label, .bottomnav-text");
    return labelEl ? labelEl.textContent : "";
  }

  function showView(id, opts) {
    opts = opts || {};
    if (!viewIds.includes(id)) id = DEFAULT_VIEW;
    if (id === currentView && !opts.force) return;

    views.forEach(function (v) {
      const active = v.id === id;
      v.classList.toggle("is-active", active);
      v.setAttribute("aria-hidden", active ? "false" : "true");
    });

    navButtons.forEach(function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-view") === id);
      b.setAttribute(
        "aria-current",
        b.getAttribute("data-view") === id ? "page" : "false",
      );
    });

    if (topbarViewTitle) topbarViewTitle.textContent = labelFor(id);

    currentView = id;

    if (appMain) appMain.scrollTop = 0;
    window.scrollTo(0, 0);

    const activeView = document.getElementById(id);
    if (activeView) {
      if (mediaQueryReducedMotion.matches) {
        activeView.querySelectorAll(".reveal-up").forEach(function (el) {
          el.classList.add("visible");
        });
      } else {
        playReveal(activeView);
      }

      if (id === "front-page" && !hasAnimatedCounters) {
        hasAnimatedCounters = true;
        setTimeout(function () {
          animateCounters(activeView);
        }, 200);
      }
    }

    if (opts.updateHash !== false) {
      history.pushState({ view: id }, "", "#" + id);
    }
  }

  navButtons.forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      showView(btn.getAttribute("data-view"));
    });
  });

  window.addEventListener("popstate", function (e) {
    const id =
      (e.state && e.state.view) ||
      location.hash.replace("#", "") ||
      DEFAULT_VIEW;
    showView(id, { updateHash: false });
  });

  // Any leftover in-page anchor links (e.g. from within body copy)
  // that point at a view id should also route through showView.
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    const targetId = anchor.getAttribute("href").slice(1);
    if (viewIds.includes(targetId) && !anchor.hasAttribute("data-view")) {
      anchor.addEventListener("click", function (e) {
        e.preventDefault();
        showView(targetId);
      });
    }
  });

  const initialId = location.hash.replace("#", "") || DEFAULT_VIEW;
  showView(initialId, { updateHash: false });

  // =============================
  // SIDEBAR COLLAPSE (desktop)
  // =============================

  if (sidebarCollapseBtn && appShell) {
    const savedCollapsed =
      localStorage.getItem("draftingRoomSidebarCollapsed") === "true";
    appShell.classList.toggle("is-collapsed", savedCollapsed);

    sidebarCollapseBtn.addEventListener("click", function () {
      const collapsed = appShell.classList.toggle("is-collapsed");
      localStorage.setItem("draftingRoomSidebarCollapsed", collapsed);
    });
  }

  // =============================
  // TOPBAR SHADOW ON SCROLL (mobile/tablet)
  // =============================

  const topbar = document.getElementById("appTopbar");
  function updateTopbarShadow() {
    if (!topbar) return;
    const scrollY = appMain ? appMain.scrollTop : window.scrollY;
    topbar.classList.toggle("raised", scrollY > 20);
  }
  window.addEventListener("scroll", updateTopbarShadow, { passive: true });
  if (appMain)
    appMain.addEventListener("scroll", updateTopbarShadow, { passive: true });

  // =============================
  // CASE FILE CAROUSELS
  // =============================

  document.querySelectorAll("[data-carousel]").forEach(function (carousel) {
    const name = carousel.getAttribute("data-carousel");
    const slides = carousel.querySelectorAll(".cf-carousel-slide");
    const dots = carousel.querySelectorAll(
      '[data-carousel-dot="' + name + '"]',
    );
    const counter = carousel.querySelector(
      '[data-carousel-current="' + name + '"]',
    );
    const prevBtn = carousel.querySelector(
      '[data-carousel-prev="' + name + '"]',
    );
    const nextBtn = carousel.querySelector(
      '[data-carousel-next="' + name + '"]',
    );
    let current = 0;
    let autoTimer = null;

    function goTo(index) {
      if (index < 0) index = slides.length - 1;
      if (index >= slides.length) index = 0;
      slides[current].classList.remove("is-active");
      if (dots[current]) dots[current].classList.remove("is-active");
      current = index;
      slides[current].classList.add("is-active");
      if (dots[current]) dots[current].classList.add("is-active");
      if (counter) counter.textContent = String(current + 1).padStart(2, "0");
    }

    function next() {
      goTo(current + 1);
    }
    function prev() {
      goTo(current - 1);
    }

    function startAuto() {
      stopAuto();
      autoTimer = setInterval(next, 5000);
    }

    function stopAuto() {
      if (autoTimer) clearInterval(autoTimer);
    }

    if (prevBtn)
      prevBtn.addEventListener("click", function () {
        prev();
        startAuto();
      });
    if (nextBtn)
      nextBtn.addEventListener("click", function () {
        next();
        startAuto();
      });

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        goTo(i);
        startAuto();
      });
    });

    carousel.addEventListener("mouseenter", stopAuto);
    carousel.addEventListener("mouseleave", startAuto);

    let touchStartX = 0;
    carousel.addEventListener(
      "touchstart",
      function (e) {
        touchStartX = e.changedTouches[0].screenX;
        stopAuto();
      },
      { passive: true },
    );

    carousel.addEventListener(
      "touchend",
      function (e) {
        const touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 40) {
          diff > 0 ? next() : prev();
        }
        startAuto();
      },
      { passive: true },
    );

    carousel.setAttribute("tabindex", "0");
    carousel.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") {
        prev();
        startAuto();
      }
      if (e.key === "ArrowRight") {
        next();
        startAuto();
      }
    });

    startAuto();
  });

  document.querySelectorAll(".drawer").forEach(function (drawer) {
    drawer.addEventListener("mouseenter", function () {
      const smudge = document.createElement("div");
      smudge.style.cssText =
        "position:absolute;border-radius:50%;pointer-events:none;background:radial-gradient(circle,rgba(139,111,71,0.12) 0%,transparent 70%);width:140px;height:140px;transform:translate(-50%,-50%);transition:opacity .5s;z-index:0;";
      drawer.style.position = "relative";
      drawer.appendChild(smudge);
      drawer.addEventListener("mousemove", function (e) {
        const rect = drawer.getBoundingClientRect();
        smudge.style.left = e.clientX - rect.left + "px";
        smudge.style.top = e.clientY - rect.top + "px";
      });
      drawer.addEventListener(
        "mouseleave",
        function () {
          smudge.style.opacity = "0";
          setTimeout(function () {
            if (smudge.parentNode) smudge.parentNode.removeChild(smudge);
          }, 500);
        },
        { once: true },
      );
    });
  });
});
