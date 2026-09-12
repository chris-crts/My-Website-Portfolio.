document.addEventListener("DOMContentLoaded", function () {
  const root = document.documentElement;
  const themeToggles = document.querySelectorAll(".theme-toggle");
  const loaderStatus = document.getElementById("loaderStatus");
  const sunIcon =
    '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
  const moonIcon =
    '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"/>';

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

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const mediaQueryReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    localStorage.setItem("draftingRoomTheme", theme);
  }

  function spawnIconSparks(container, theme) {
    if (!container || prefersReducedMotion) return;
    const color = theme === "light" ? "var(--accent)" : "var(--accent-light)";
    const count = 6;
    for (let i = 0; i < count; i++) {
      const spark = document.createElement("span");
      spark.className = "icon-spark";
      spark.style.setProperty("--ang", (360 / count) * i + "deg");
      spark.style.setProperty("--dist", theme === "light" ? "20px" : "16px");
      spark.style.background = color;
      container.appendChild(spark);
      spark.addEventListener("animationend", function () {
        spark.remove();
      });
    }
  }

  function updateThemeToggles(theme, opts) {
    opts = opts || {};
    themeToggles.forEach(function (toggle) {
      const iconWrap = toggle.querySelector(".lamp-icon");
      const svg = toggle.querySelector(".theme-toggle-svg");
      const label = toggle.querySelector(".lamp-label");
      const nextMarkup = theme === "light" ? sunIcon : moonIcon;

      if (opts.animate && svg && !prefersReducedMotion) {
        svg.classList.remove("icon-in");
        svg.classList.add("icon-out");
        spawnIconSparks(iconWrap, theme);

        setTimeout(function () {
          svg.innerHTML = nextMarkup;
          svg.classList.remove("icon-out");
          svg.classList.add("icon-in");
          svg.addEventListener(
            "animationend",
            function () {
              svg.classList.remove("icon-in");
            },
            { once: true },
          );
        }, 150);
      } else if (svg) {
        svg.innerHTML = nextMarkup;
      }

      if (label) label.textContent = theme === "light" ? "Light" : "Dark";
    });
  }

  function spawnThemeRing(x, y) {
    const ring = document.createElement("div");
    ring.className = "theme-pulse-ring";
    ring.style.left = x + "px";
    ring.style.top = y + "px";
    document.body.appendChild(ring);
    ring.addEventListener("animationend", function () {
      ring.remove();
    });
  }

  const savedTheme = localStorage.getItem("draftingRoomTheme") || "light";
  applyTheme(savedTheme);
  updateThemeToggles(savedTheme);

  themeToggles.forEach(function (toggle) {
    toggle.addEventListener("click", function () {
      const next =
        root.getAttribute("data-theme") === "light" ? "dark" : "light";
      const rect = toggle.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      root.style.setProperty("--theme-x", x + "px");
      root.style.setProperty("--theme-y", y + "px");
      spawnThemeRing(x, y);
      updateThemeToggles(next, { animate: true });

      if (document.startViewTransition && !prefersReducedMotion) {
        document.startViewTransition(function () {
          applyTheme(next);
        });
      } else {
        applyTheme(next);
      }
    });
  });

  const viewCarousels = [];

  const fbTabs = document.querySelectorAll(".fb-tab");
  const fbFeed = document.querySelector(".fb-feed");

  if (fbTabs.length && fbFeed) {
    const fbCards = Array.prototype.map.call(fbTabs, function (tab) {
      return document.getElementById(tab.getAttribute("data-fb-target"));
    });

    var setActiveTab = function (id) {
      fbTabs.forEach(function (tab) {
        tab.classList.toggle(
          "is-active",
          tab.getAttribute("data-fb-target") === id,
        );
      });
    };

    fbTabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        const target = document.getElementById(
          tab.getAttribute("data-fb-target"),
        );
        if (!target) return;
        target.scrollIntoView({
          behavior: mediaQueryReducedMotion.matches ? "auto" : "smooth",
          block: "start",
        });
        setActiveTab(tab.getAttribute("data-fb-target"));
      });
    });

    const scrollRoot = document.querySelector("#profile .fb-profile");
    const spyObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setActiveTab(entry.target.id);
        });
      },
      {
        root: scrollRoot || null,
        rootMargin: "-53px 0px -70% 0px",
        threshold: 0,
      },
    );
    fbCards.forEach(function (card) {
      if (card) spyObserver.observe(card);
    });
  }

  document.querySelectorAll(".view-carousel").forEach(function (carousel) {
    const viewport = carousel.querySelector(".view-carousel-viewport");
    const slides = Array.prototype.slice.call(
      carousel.querySelectorAll(".view-slide:not(.cf-traceforge-capabilities)"),
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

  const appShell = document.getElementById("appShell");
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
    ? "profile"
    : viewIds[0];

  let currentView = null;

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
      viewCarousels.forEach(function (vc) {
        if (activeView.contains(vc.carousel)) vc.reset();
      });
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
