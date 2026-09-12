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
    if (lampLabel)
      lampLabel.textContent = theme === "light" ? "Lamp On" : "Lamp Off";
  }

  const mediaQueryReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );

  function animateCounters(scope) {
    scope.querySelectorAll(".ledger-num").forEach(function (el) {
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

  // =============================================
  // GENERIC VIEW CAROUSEL ENGINE (per-section pagination)
  // =============================================
  // Each .view-carousel has a .view-carousel-viewport containing
  // .view-slide children. Slides page horizontally via scroll-snap;
  // this controller drives arrows/dots/counter and keeps them synced.

  const viewCarousels = [];

  document.querySelectorAll(".view-carousel").forEach(function (carousel) {
    const viewport = carousel.querySelector(".view-carousel-viewport");
    const slides = Array.prototype.slice.call(
      carousel.querySelectorAll(
        ".view-slide:not(.cf-traceforge-capabilities):not(.dossier-legacy)",
      ),
    );
    if (!viewport || slides.length === 0) return;

    const prevBtn = carousel.querySelector("[data-vc-prev]");
    const nextBtn = carousel.querySelector("[data-vc-next]");
    const dotsWrap = carousel.querySelector("[data-vc-dots]");
    const counterEl = carousel.querySelector("[data-vc-counter]");

    let index = 0;
    let dots = [];

    if (dotsWrap && slides.length > 1 && slides.length <= 7) {
      slides.forEach(function (_, i) {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.setAttribute("aria-label", "Go to item " + (i + 1));
        if (i === 0) dot.classList.add("is-active");
        dot.addEventListener("click", function () {
          goTo(i);
        });
        dotsWrap.appendChild(dot);
        dots.push(dot);
      });
    } else if (dotsWrap) {
      dotsWrap.style.display = "none";
    }

    function updateUI() {
      if (prevBtn) prevBtn.disabled = index === 0;
      if (nextBtn) nextBtn.disabled = index === slides.length - 1;
      dots.forEach(function (d, i) {
        d.classList.toggle("is-active", i === index);
      });
      if (counterEl) {
        counterEl.innerHTML =
          "<strong>" +
          String(index + 1).padStart(2, "0") +
          "</strong> / " +
          String(slides.length).padStart(2, "0");
      }
    }

    function goTo(i, opts) {
      opts = opts || {};
      if (i < 0) i = 0;
      if (i > slides.length - 1) i = slides.length - 1;
      index = i;
      viewport.scrollTo({
        left: slides[index].offsetLeft,
        behavior:
          opts.instant || mediaQueryReducedMotion.matches ? "auto" : "smooth",
      });
      updateUI();
    }

    if (prevBtn)
      prevBtn.addEventListener("click", function () {
        goTo(index - 1);
      });
    if (nextBtn)
      nextBtn.addEventListener("click", function () {
        goTo(index + 1);
      });

    carousel.setAttribute("tabindex", "0");
    carousel.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goTo(index - 1);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goTo(index + 1);
      }
    });

    let scrollTimer = null;
    viewport.addEventListener(
      "scroll",
      function () {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(function () {
          const width = viewport.clientWidth || 1;
          const nearest = Math.round(viewport.scrollLeft / width);
          if (nearest !== index && nearest >= 0 && nearest < slides.length) {
            index = nearest;
            updateUI();
          }
        }, 80);
      },
      { passive: true },
    );

    updateUI();

    viewCarousels.push({
      carousel: carousel,
      goTo: goTo,
      reset: function () {
        goTo(0, { instant: true });
      },
    });
  });

  window.addEventListener("resize", function () {
    viewCarousels.forEach(function (vc) {
      vc.reset();
    });
  });

  // =============================================
  // APP SHELL — VIEW SWITCHING
  // =============================================

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
  const sidebarHandle = document.getElementById("sidebarHandle");

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
      const isMatch = b.getAttribute("data-view") === id;
      b.classList.toggle("is-active", isMatch);
      b.setAttribute("aria-current", isMatch ? "page" : "false");
    });

    if (topbarViewTitle) topbarViewTitle.textContent = labelFor(id);

    currentView = id;

    const activeView = document.getElementById(id);
    if (activeView) {
      // Reset any carousels inside this view to their first slide so
      // returning to a section always starts from the beginning.
      viewCarousels.forEach(function (vc) {
        if (activeView.contains(vc.carousel)) vc.reset();
      });

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

  const initialId = location.hash.replace("#", "") || DEFAULT_VIEW;
  showView(initialId, { updateHash: false });

  // =============================================
  // SIDEBAR COLLAPSE (desktop ruler-tab handle)
  // =============================================

  if (sidebarHandle && appShell) {
    const savedCollapsed =
      localStorage.getItem("draftingRoomSidebarCollapsed") === "true";
    appShell.classList.toggle("is-collapsed", savedCollapsed);

    sidebarHandle.addEventListener("click", function () {
      const collapsed = appShell.classList.toggle("is-collapsed");
      localStorage.setItem("draftingRoomSidebarCollapsed", collapsed);
      viewCarousels.forEach(function (vc) {
        vc.reset();
      });
    });
  }

  // =============================================
  // CASE FILE IMAGE CAROUSEL (e.g. TraceForge screenshots)
  // =============================================

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

    function goTo(i) {
      if (i < 0) i = slides.length - 1;
      if (i >= slides.length) i = 0;
      slides[current].classList.remove("is-active");
      if (dots[current]) dots[current].classList.remove("is-active");
      current = i;
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
      prevBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        prev();
        startAuto();
      });
    if (nextBtn)
      nextBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        next();
        startAuto();
      });

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function (e) {
        e.stopPropagation();
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

    startAuto();
  });

  // Technology marks use Simple Icons' CDN. Brand names stay as text, so the
  // visual marks remain decorative and do not reduce accessibility.
  const toolIconSlugs = {
    "React & React-Native": "react",
    HTML: "html5",
    CSS: "css",
    "Tailwind CSS": "tailwindcss",
    Bootstrap: "bootstrap",
    JavaScript: "javascript",
    Django: "django",
    PostgreSQL: "postgresql",
    "RESTful API": "fastapi",
    "Cisco Packet Tracer": "cisco",
    "VLAN Configuration": "cisco",
    "Basic Routing": "cisco",
    "Basic Switching": "cisco",
    "Network Simulation": "cisco",
    Wireshark: "wireshark",
    Metasploit: "metasploit",
    "Burp Suite": "burpsuite",
    "GoBuster / Nikto / SQLMap": "owasp",
    "Hydra / John / Hashcat": "kalilinux",
    "Nmap / Nessus": "nmap",
    "Radare2 / Ghidra": "gnometerminal",
    "Git & Github": "github",
    Canva: "canva",
    Photoshop: "adobephotoshop",
    AutoCAD: "autodesk",
    "MS Office": "microsoftoffice",
    Blender: "blender",
  };

  document.querySelectorAll(".tool-tag").forEach(function (tag) {
    const label = tag.textContent.trim();
    const slug = toolIconSlugs[label];
    if (!slug) return;
    const icon = document.createElement("img");
    icon.className = "tool-tag-icon";
    icon.src = "https://cdn.simpleicons.org/" + slug + "?viewbox=auto";
    icon.alt = "";
    icon.width = 18;
    icon.height = 18;
    icon.loading = "lazy";
    icon.decoding = "async";
    icon.addEventListener("error", function () {
      icon.remove();
    });
    tag.prepend(icon);
  });

  const primaryInstrument = document.querySelector(".instrument-name");
  if (primaryInstrument) {
    const icon = document.createElement("img");
    icon.className = "instrument-name-icon";
    icon.src = "https://cdn.simpleicons.org/python?viewbox=auto";
    icon.alt = "";
    icon.width = 28;
    icon.height = 28;
    icon.decoding = "async";
    icon.addEventListener("error", function () {
      icon.remove();
    });
    primaryInstrument.prepend(icon);
  }

  const caseStackIconSlugs = {
    Python: "python",
    Django: "django",
    PostgreSQL: "postgresql",
    JavaScript: "javascript",
    "LLM Integration": "openai",
    "Python / Django": "django",
    "HTML / CSS / JavaScript": "html5",
    "HTML / CSS / JS": "html5",
    "IDS/IPS Integration": "owasp",
    "Port Mirroring": "cisco",
    BioBERT: "huggingface",
    BioGPT: "openai",
    RAG: "openai",
    "Vector Search": "weaviate",
    RBAC: "keycloak",
    "RESTful API": "fastapi",
    reportlab: "python",
    "Netlify Deployment": "netlify",
    HTML: "html5",
    CSS: "css",
    "Hono.js": "hono",
    "React Native": "react",
    SQLite: "sqlite",
    "OpenAI API": "openai",
    "Visual Basic": "dotnet",
    "XAMPP MySQL": "mysql",
  };

  document.querySelectorAll(".cf-tech-strip span").forEach(function (tag) {
    const shortCode = tag.querySelector("b");
    if (shortCode) shortCode.remove();
    const label = tag.textContent.trim();
    const slug = caseStackIconSlugs[label];
    if (!slug) return;
    const icon = document.createElement("img");
    icon.className = "cf-tech-icon";
    icon.src = "https://cdn.simpleicons.org/" + slug + "?viewbox=auto";
    icon.alt = "";
    icon.width = 18;
    icon.height = 18;
    icon.loading = "lazy";
    icon.decoding = "async";
    icon.addEventListener("error", function () {
      icon.remove();
    });
    tag.prepend(icon);
  });

  document.querySelectorAll(".drawer").forEach(function (drawer) {
    drawer.addEventListener("mouseenter", function () {
      const smudge = document.createElement("div");
      smudge.style.cssText =
        "position:absolute;border-radius:50%;pointer-events:none;background:radial-gradient(circle,rgba(139,111,71,0.12) 0%,transparent 70%);width:120px;height:120px;transform:translate(-50%,-50%);transition:opacity .5s;z-index:0;";
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
