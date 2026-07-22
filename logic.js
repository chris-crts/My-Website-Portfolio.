document.addEventListener('DOMContentLoaded', function () {

  const root = document.documentElement;
  const header = document.getElementById('siteHeader');
  const navToggle = document.getElementById('navToggle');
  const mobileNav = document.getElementById('mobileNav');
  const lampToggle = document.getElementById('lampToggle');
  const lampLabel = document.getElementById('lampLabel');
  const loaderStatus = document.getElementById('loaderStatus');

  const loaderMessages = [
    'Opening Drafting Room...',
    'Retrieving Blueprints...',
    'Preparing Archive...',
    'Loading Case Files...',
    'Ready.'
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
    const loader = document.getElementById('loader');
    if (loader) loader.remove();
  }, 5500);

  const savedTheme = localStorage.getItem('draftingRoomTheme') || 'light';
  root.setAttribute('data-theme', savedTheme);
  updateLampLabel(savedTheme);

  lampToggle.addEventListener('click', function () {
    const current = root.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    localStorage.setItem('draftingRoomTheme', next);
    updateLampLabel(next);
  });

  function updateLampLabel(theme) {
    if (lampLabel) {
      lampLabel.textContent = theme === 'light' ? 'Lamp On' : 'Lamp Off';
    }
  }

  window.addEventListener('scroll', function () {
    header.classList.toggle('raised', window.scrollY > 60);
  }, { passive: true });

  navToggle.addEventListener('click', function () {
    mobileNav.classList.toggle('open');
  });

  mobileNav.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      mobileNav.classList.remove('open');
    });
  });

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.pageYOffset - 70;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });

  const revealObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        const el = entry.target;
        const delay = el.dataset.delay || 0;
        setTimeout(function () {
          el.classList.add('visible');
        }, parseInt(delay));
        revealObs.unobserve(el);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal-up').forEach(function (el, i) {
    el.dataset.delay = (i % 4) * 80;
    revealObs.observe(el);
  });

  const statsObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        animateCounters();
        statsObs.disconnect();
      }
    });
  }, { threshold: 0.4 });

  const ledger = document.querySelector('.fp-ledger');
  if (ledger) statsObs.observe(ledger);

  function animateCounters() {
    document.querySelectorAll('.ledger-num').forEach(function (el) {
      const target = parseInt(el.getAttribute('data-target'), 10);
      let n = 0;
      const step = Math.max(1, Math.ceil(target / 30));
      const tick = setInterval(function () {
        n = Math.min(n + step, target);
        el.textContent = n;
        if (n >= target) clearInterval(tick);
      }, 50);
    });
  }

  document.querySelectorAll('.case-file').forEach(function (card, i) {
    card.classList.toggle('cf-flip', i % 2 === 1); // even index (0-based) = normal, odd = flipped
  });
  
  document.querySelectorAll('.case-file').forEach(function (card) {
    card.addEventListener('mouseenter', function () {
      card.style.transition = 'box-shadow 0.3s, border-color 0.3s, transform 0.3s';
    });
    card.addEventListener('mouseleave', function () {
      card.style.transform = '';
    });
  });

  document.querySelectorAll('.drawer').forEach(function (drawer) {
    drawer.addEventListener('mouseenter', function () {
      const smudge = document.createElement('div');
      smudge.style.cssText = 'position:absolute;border-radius:50%;pointer-events:none;background:radial-gradient(circle,rgba(139,111,71,0.12) 0%,transparent 70%);width:140px;height:140px;transform:translate(-50%,-50%);transition:opacity .5s;z-index:0;';
      drawer.style.position = 'relative';
      drawer.appendChild(smudge);
      drawer.addEventListener('mousemove', function (e) {
        const rect = drawer.getBoundingClientRect();
        smudge.style.left = (e.clientX - rect.left) + 'px';
        smudge.style.top = (e.clientY - rect.top) + 'px';
      });
      drawer.addEventListener('mouseleave', function () {
        smudge.style.opacity = '0';
        setTimeout(function () { if (smudge.parentNode) smudge.parentNode.removeChild(smudge); }, 500);
      }, { once: true });
    });
  });

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mediaQuery.matches) {
    document.querySelectorAll('.reveal-up').forEach(function (el) {
      el.classList.add('visible');
    });
  }

  

});
