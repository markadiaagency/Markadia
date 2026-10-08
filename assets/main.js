/* Markadia — shared behaviour for every page.
   Blocks that drive one particular section check for it first and stop if
   it is not there, so this single file is safe to load on every page. */

  /* ══════════════════════════════════════
     1. PAGE LOADER
  ══════════════════════════════════════ */
  (() => {
  const loader = document.getElementById('loader');
  if (!loader) return;   // this section is not on every page
    document.body.style.overflow = 'hidden';
    function hideLoader() {
      clearTimeout(loaderFallback);
      setTimeout(() => {
        loader.classList.add('hidden');
        document.body.style.overflow = '';
      }, 1600);
    }
    // Fallback: force-hide after 4s even if fonts/resources stall
    const loaderFallback = setTimeout(() => {
      loader.classList.add('hidden');
      document.body.style.overflow = '';
    }, 4000);
    window.addEventListener('load', hideLoader);
})();

  /* 2. CURSOR SPOTLIGHT — removed for performance */

  /* ══════════════════════════════════════
     3. TYPED TEXT HERO
  ══════════════════════════════════════ */
  (() => {
  const typedEl = document.getElementById('typed-word');
  if (!typedEl) return;   // this section is not on every page
    const words = [
      'Content Strategy',
      'Visual Design',
      'Copywriting',
      'Community Management',
      'Analytics & Reporting'
    ];
    let wIdx = 0, cIdx = 0, deleting = false;
  
    function typeLoop() {
      const word = words[wIdx];
      if (!deleting) {
        typedEl.textContent = word.slice(0, ++cIdx);
        if (cIdx === word.length) {
          deleting = true;
          setTimeout(typeLoop, 1800);
          return;
        }
        setTimeout(typeLoop, 65);
      } else {
        typedEl.textContent = word.slice(0, --cIdx);
        if (cIdx === 0) {
          deleting = false;
          wIdx = (wIdx + 1) % words.length;
          setTimeout(typeLoop, 350);
          return;
        }
        setTimeout(typeLoop, 35);
      }
    }
    setTimeout(typeLoop, 2000);
})();

  /* ══════════════════════════════════════
     4. SCROLL REVEAL
  ══════════════════════════════════════ */
  const reveals = document.querySelectorAll('.reveal');
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), 80);
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  reveals.forEach(el => revealObs.observe(el));

  /* ══════════════════════════════════════
     5. ANIMATED COUNTERS
  ══════════════════════════════════════ */
  const counters = document.querySelectorAll('.stat-num[data-target]');
  const counterObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const target = +el.dataset.target;
      const suffix = el.dataset.suffix || '';
      const dur    = 1400;
      const step   = 16;
      const steps  = dur / step;
      let current  = 0;
      const inc = target / steps;
      const tick = setInterval(() => {
        current = Math.min(current + inc, target);
        el.textContent = Math.round(current) + suffix;
        if (current >= target) clearInterval(tick);
      }, step);
      counterObs.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(el => counterObs.observe(el));

  /* ══════════════════════════════════════
     6 + 8. PARALLAX + NAV SHRINK + SCROLL PROGRESS (combined for performance)
  ══════════════════════════════════════ */
  const orb1   = document.querySelector('.orb-1');
  const orb2   = document.querySelector('.orb-2');
  const hGrid  = document.querySelector('.hero-grid');
  const heroBg = document.querySelector('.hero-bg');
  const nav    = document.querySelector('nav');
  const progressBar = document.getElementById('progress-bar');
  const backTopBtn  = document.getElementById('back-top');

  /* Cached so the scroll handler never forces a layout recalculation. */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let cachedDocH = document.documentElement.scrollHeight - window.innerHeight;
  let cachedIsMobile = window.innerWidth <= 768;
  let lastNavShrunk = null;
  const remeasure = () => {
    cachedDocH = document.documentElement.scrollHeight - window.innerHeight;
    cachedIsMobile = window.innerWidth <= 768;
  };
  window.addEventListener('resize', remeasure, { passive: true });
  if (window.ResizeObserver) new ResizeObserver(remeasure).observe(document.body);


  window.addEventListener('scroll', () => {
    const y = window.scrollY;

    // Parallax orbs (skipped when the visitor asks for reduced motion)
    if (!reduceMotion.matches) {
      if (orb1)   orb1.style.transform   = `translateY(${y * 0.18}px) scale(1)`;
      if (orb2)   orb2.style.transform   = `translateY(${y * 0.28}px) scale(1)`;
      if (hGrid)  hGrid.style.transform  = `translateY(${y * 0.12}px)`;
      if (heroBg) heroBg.style.transform = `translateY(${y * 0.06}px)`;
    }

    // Nav shrink (mobile-aware)
    if (nav) {
      const shrunk = y > 60;
      if (shrunk !== lastNavShrunk) {
        lastNavShrunk = shrunk;
        nav.style.padding = shrunk
          ? (cachedIsMobile ? '10px 24px' : '14px 60px')
          : (cachedIsMobile ? '14px 24px' : '20px 60px');
      }
    }

    // Scroll progress bar
    if (progressBar) progressBar.style.width = (cachedDocH > 0 ? (y / cachedDocH) * 100 : 0) + '%';

    // Back-to-top visibility
    if (backTopBtn) backTopBtn.classList.toggle('visible', y > 400);
  }, { passive: true });

  /* ══════════════════════════════════════
     9. SMOOTH ANCHOR SCROLL
  ══════════════════════════════════════ */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ══════════════════════════════════════
     FAQ ACCORDION
  ══════════════════════════════════════ */
  function toggleFaq(btn) {
    const item = btn.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  }
  /* ══════════════════════════════════════
     10. CONTACT FORM
  ══════════════════════════════════════ */
  function handleForm(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('.form-submit');
    btn.textContent = 'Sending...';
    btn.style.opacity = '0.7';

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    }).then(res => {
      if (res.ok) {
        btn.textContent = 'Message Sent!';
        btn.style.background = 'linear-gradient(135deg, #0a9e5c, #07c274)';
        btn.style.boxShadow = '0 4px 20px rgba(10,158,92,0.4)';
        btn.style.opacity = '1';
        form.reset();
        setTimeout(() => {
          btn.innerHTML = 'Send Message <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
          btn.style.background = '';
          btn.style.boxShadow = '';
        }, 4000);
      } else {
        btn.textContent = 'Error — Try Again';
        btn.style.background = 'linear-gradient(135deg, #c0392b, #e74c3c)';
        btn.style.opacity = '1';
        setTimeout(() => {
          btn.innerHTML = 'Send Message <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
          btn.style.background = '';
        }, 3000);
      }
    }).catch(() => {
      btn.textContent = 'Error — Try Again';
      btn.style.opacity = '1';
    });
  }

  /* ══════════════════════════════════════
     11. MOBILE NAV
  ══════════════════════════════════════ */
  function toggleMobileNav() {
    const nav = document.getElementById('mobileNav');
    const btn = document.getElementById('hamburger');
    nav.classList.toggle('open');
    btn.classList.toggle('open');
    const isOpen = nav.classList.contains('open');
  btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    document.body.style.overflow = isOpen ? 'hidden' : '';
    // Hide back-to-top when mobile nav is open
    const backTopEl = document.getElementById('back-top');
    if (backTopEl) backTopEl.style.display = isOpen ? 'none' : '';
  }

  function closeMobileNav() {
    document.getElementById('mobileNav').classList.remove('open');
    document.getElementById('hamburger').classList.remove('open');
  document.getElementById('hamburger').setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    const backTopEl = document.getElementById('back-top');
    if (backTopEl) backTopEl.style.display = '';
  }

  /* ══════════════════════════════════════
     11b. SERVICE CARD AUTO-CYCLE PROGRESS
  ══════════════════════════════════════ */
  (function() {
    const cards = document.querySelectorAll('.service-card');
    if (!cards.length) return;

    const DURATION = 3200; // ms per card
    const TICK = 80;
    let current = 0;
    let elapsed = 0;
    let paused = false;

    function setBar(card, pct) {
      const bar = card.querySelector('.service-card-progress');
      if (bar) bar.style.width = pct + '%';
    }

    function activate(index) {
      cards.forEach((c, i) => {
        c.classList.toggle('active', i === index);
        setBar(c, 0);
      });
    }

    function tick() {
      if (paused) return;
      elapsed += TICK;
      const pct = Math.min((elapsed / DURATION) * 100, 100);
      setBar(cards[current], pct);
      if (elapsed >= DURATION) {
        elapsed = 0;
        current = (current + 1) % cards.length;
        activate(current);
      }
    }

    cards.forEach((card, i) => {
      card.addEventListener('mouseenter', () => {
        paused = true;
        cards.forEach(c => { c.classList.remove('active'); setBar(c, 0); });
        card.classList.add('active');
        current = i;
        elapsed = 0;
      });
      card.addEventListener('mouseleave', () => {
        paused = false;
        elapsed = 0;
      });
    });

    activate(0);
    setInterval(tick, TICK);
  })();

  /* ══════════════════════════════════════
     14. ACTIVE NAV ON SCROLL
  ══════════════════════════════════════ */
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  const sections = [...navLinks].map(a => {
    const el = document.querySelector(a.getAttribute('href'));
    return { link: a, el };
  }).filter(x => x.el);

  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(l => l.classList.remove('active'));
        const active = sections.find(s => s.el === entry.target);
        if (active) active.link.classList.add('active');
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px' });

  sections.forEach(s => navObserver.observe(s.el));

  /* ══════════════════════════════════════
     16. 3D TILT — SERVICE & PACKAGE CARDS
  ══════════════════════════════════════ */
  if (window.innerWidth > 768) (function() {
    const tiltEls = document.querySelectorAll('.service-card, .pkg-card');
    const MAX = 12;

    tiltEls.forEach(el => {
      el.style.transformStyle = 'preserve-3d';
      el.style.transition = 'transform 0.08s ease, background 0.3s, box-shadow 0.3s, border-color 0.25s';
      let rafId = null;

      el.addEventListener('mousemove', e => {
        if (rafId) return; // throttle to 1 frame
        rafId = requestAnimationFrame(() => {
          rafId = null;
          const r  = el.getBoundingClientRect();
          const x  = (e.clientX - r.left) / r.width  - 0.5;
          const y  = (e.clientY - r.top)  / r.height - 0.5;
          const rx = -y * MAX;
          const ry =  x * MAX;
          el.style.transform = `perspective(600px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.03)`;
          const shine = (x + 0.5) * 100;
          el.style.backgroundImage = `radial-gradient(circle at ${shine}% ${(y+0.5)*100}%, rgba(6,47,248,0.12) 0%, transparent 70%)`;
        });
      });

      el.addEventListener('mouseleave', () => {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        el.style.transform = '';
        el.style.backgroundImage = '';
        el.style.transition = 'transform 0.5s ease, background 0.3s, box-shadow 0.3s, border-color 0.25s, background-image 0.4s';
        setTimeout(() => {
          el.style.transition = 'transform 0.08s ease, background 0.3s, box-shadow 0.3s, border-color 0.25s';
        }, 500);
      });
    });
  })();

  /* ══════════════════════════════════════
     17. GLITCH ON HOVER — HERO HEADLINE
  ══════════════════════════════════════ */
  (function() {
    const gw = document.querySelector('.glitch-word');
    if (!gw) return;
    let glitchInterval = null;

    function triggerGlitch() {
      gw.classList.add('glitch-active');
      let count = 0;
      glitchInterval = setInterval(() => {
        // Randomise slight offset via inline style to layer on top of CSS anim
        const dx = (Math.random() - 0.5) * 8;
        const dy = (Math.random() - 0.5) * 4;
        gw.style.textShadow = `${dx}px ${dy}px 0 rgba(142,249,251,0.9), ${-dx}px ${-dy}px 0 rgba(6,47,248,0.9)`;
        if (++count > 6) {
          clearInterval(glitchInterval);
          gw.style.textShadow = '';
          gw.classList.remove('glitch-active');
        }
      }, 60);
    }

    gw.closest('.hero-h1') && gw.closest('.hero-h1').addEventListener('mouseenter', triggerGlitch);
    gw.addEventListener('mouseenter', triggerGlitch);
  })();
  /* ══════════════════════════════════════
     19. SMOOTH SECTION TRANSITIONS
  ══════════════════════════════════════ */
  (function() {
    // Staggered children reveal inside each section
    const sectionChildren = document.querySelectorAll(
      '.service-card, .pkg-card, .who-card, .faq-item, .market-card, .value-pill, .wyg-item'
    );

    sectionChildren.forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(28px)';
      el.style.transition = `opacity 0.4s ease, transform 0.4s ease`;
    });

    const staggerObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        // Find siblings to stagger
        const parent = el.parentElement;
        const siblings = Array.from(parent.children).filter(c =>
          c.classList.contains(el.classList[0])
        );
        const idx = siblings.indexOf(el);
        setTimeout(() => {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }, idx * 55);
        staggerObs.unobserve(el);
      });
    }, { threshold: 0.12 });

    sectionChildren.forEach(el => staggerObs.observe(el));
  })();

  /* ══════════════════════════════════════
     DASHBOARD — COUNTERS + BARS
  ══════════════════════════════════════ */
  (function() {
    const dashNums = document.querySelectorAll('.dash-metric-val[data-dash-target]');
    const dashBars = document.querySelectorAll('.dash-bar-fill[data-width]');

    const dashObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        // Animate metric counters
        dashNums.forEach(el => {
          const target  = parseFloat(el.dataset.dashTarget);
          const suffix  = el.dataset.dashSuffix || '';
          const isFloat = target % 1 !== 0;
          const dur = 1800, step = 16;
          const steps = dur / step;
          let current = 0;
          const inc = target / steps;
          const tick = setInterval(() => {
            current = Math.min(current + inc, target);
            el.textContent = (isFloat ? current.toFixed(1) : Math.round(current)) + suffix;
            if (current >= target) clearInterval(tick);
          }, step);
        });

        // Animate bars
        setTimeout(() => {
          dashBars.forEach(bar => {
            bar.style.width = bar.dataset.width;
          });
        }, 600);

        dashObs.disconnect();
      });
    }, { threshold: 0.4 });

    const dashCard = document.querySelector('.dash-card');
    if (dashCard) dashObs.observe(dashCard);
  })();

  /* F1. CUSTOM CURSOR — removed for performance */

  /* ══════════════════════════════════════
     F2. HERO ORBS ANIMATION
  ══════════════════════════════════════ */
  (function() {
    const hero = document.getElementById('hero');
    if (!hero) return;
    const orbs = hero.querySelectorAll('.orb');
    orbs.forEach((orb, i) => {
      orb.style.animation = `orb-float ${7 + i * 2}s ease-in-out infinite ${i * 1.5}s`;
    });
  })();

  /* ══════════════════════════════════════
     VOICES TICKER — TOUCH PAUSE
  ══════════════════════════════════════ */
  (function() {
    const track = document.querySelector('.voices-track');
    if (!track) return;
    track.addEventListener('touchstart', () => track.classList.add('touch-paused'), { passive: true });
    track.addEventListener('touchend',   () => track.classList.remove('touch-paused'), { passive: true });
  })();

  /* ══════════════════════════════════════
     F4. SCROLL-TRIGGERED SECTION AMBIENT — disabled for performance
  ══════════════════════════════════════ */
  /* removed */

  /* ══════════════════════════════════════
     F5. PACKAGES INTERACTIVE COMPARISON
  ══════════════════════════════════════ */
  (function() {
    const pkgCards = document.querySelectorAll('.pkg-card');
    if (pkgCards.length < 2) return;

    // Tag features by package index
    pkgCards.forEach((card, cardIdx) => {
      card.querySelectorAll('.pkg-feature').forEach((feat, fi) => {
        // Features unique to higher tiers = exclusive
        if (cardIdx === 1 && fi >= 1 && fi <= 2) feat.classList.add('exclusive');
        if (cardIdx === 2 && fi >= 1 && fi <= 3) feat.classList.add('exclusive');
      });
    });

    pkgCards.forEach((card, i) => {
      card.addEventListener('mouseenter', () => {
        pkgCards.forEach((c, j) => {
          if (j !== i) c.classList.add('compare-dim');
          else c.classList.add('compare-highlight');
        });
      });
      card.addEventListener('mouseleave', () => {
        pkgCards.forEach(c => {
          c.classList.remove('compare-dim', 'compare-highlight');
        });
      });
    });
  })();

  /* ══════════════════════════════════════
     F6. FLOATING SECTION ORBS (motion)
  ══════════════════════════════════════ */
  if (window.innerWidth > 768) (function() {
    const orbSections = ['about','why','packages','contact'];
    orbSections.forEach((id, i) => {
      const sec = document.getElementById(id);
      if (!sec) return;
      if (getComputedStyle(sec).position === 'static') sec.style.position = 'relative';
      sec.style.overflow = 'hidden';

      const orb = document.createElement('div');
      orb.className = 'section-orb';
      const size = 280 + i * 40;
      const color = i % 2 === 0 ? 'rgba(6,47,248,0.15)' : 'rgba(142,249,251,0.08)';
      Object.assign(orb.style, {
        width: size + 'px',
        height: size + 'px',
        background: color,
        top: (30 + i * 10) + '%',
        right: i % 2 === 0 ? '-80px' : 'auto',
        left: i % 2 !== 0 ? '-80px' : 'auto',
        animationDelay: (i * 1.8) + 's',
        animationDuration: (8 + i * 1.5) + 's',
      });
      sec.appendChild(orb);
    });
  })();


  /* ══════════════════════════════════════
     MARKETING IN MOTION — JS
  ══════════════════════════════════════ */
  (function() {
    const section = document.getElementById('inmotion');
    if (!section) return;

    let started = false;

    // Typing text for post
    const lines = [
      { el: 'im-type-1', text: '🚀 Ready to grow your brand in Egypt & GCC?' },
      { el: 'im-type-2', text: 'Strategy. Content. Results. — Markadia.' }
    ];

    function typeText(elId, text, cb) {
      const el = document.getElementById(elId);
      if (!el) return;
      el.style.background = 'none';
      el.style.height = 'auto';
      el.style.fontSize = '11px';
      el.style.color = 'rgba(255,255,255,0.75)';
      el.style.lineHeight = '1.5';
      el.textContent = '';
      let i = 0;
      const t = setInterval(() => {
        el.textContent += text[i++];
        if (i >= text.length) { clearInterval(t); if (cb) cb(); }
      }, 38);
    }

    // Metric counters
    function animateMetrics() {
      document.querySelectorAll('.im-metric-val[data-im-target]').forEach(el => {
        const target = parseFloat(el.dataset.imTarget);
        const suffix = el.dataset.imSuffix || '';
        const isFloat = target % 1 !== 0;
        const dur = 2200, step = 16;
        const steps = dur / step;
        let current = 0;
        const inc = target / steps;
        const tick = setInterval(() => {
          current = Math.min(current + inc, target);
          const val = isFloat ? current.toFixed(1) : Math.round(current);
          el.textContent = val >= 1000
            ? (val >= 100000 ? Math.round(val/1000)+'K' : Math.round(val/100)/10+'K')
            : val + suffix;
          if (current >= target) {
            el.textContent = isFloat ? target.toFixed(1)+suffix : (target>=1000 ? (target>=100000?Math.round(target/1000)+'K':target/1000+'K') : target+suffix);
            clearInterval(tick);
          }
        }, step);
      });
    }

    // Platform bars + numbers
    function animatePlatforms() {
      document.querySelectorAll('.im-plat-bar').forEach(bar => {
        setTimeout(() => { bar.style.width = bar.style.getPropertyValue('--w') || '0%'; }, 300);
      });
      document.querySelectorAll('.im-plat-num[data-im-target]').forEach(el => {
        const target = parseInt(el.dataset.imTarget);
        const suffix = el.dataset.imSuffix || '';
        let cur = 0;
        const inc = target / (1800 / 16);
        const tick = setInterval(() => {
          cur = Math.min(cur + inc, target);
          el.textContent = Math.round(cur) + suffix;
          if (cur >= target) { el.textContent = target + suffix; clearInterval(tick); }
        }, 16);
      });
    }

    // Notifications
    function showNotifs() {
      const notifs = ['im-notif-1','im-notif-2','im-notif-3'];
      notifs.forEach((id, i) => {
        setTimeout(() => {
          const el = document.getElementById(id);
          if (el) el.classList.add('show');
        }, 800 + i * 1200);
      });
    }

    // Like button
    function setupLike() {
      const likeBtn = document.querySelector('.im-action-like');
      const likeCount = document.querySelector('.im-like-count');
      if (!likeBtn) return;
      let likes = 0, liked = false;
      likeBtn.style.cursor = 'pointer';
      likeBtn.addEventListener('click', () => {
        liked = !liked;
        likes += liked ? 1 : -1;
        likeCount.textContent = likes;
        likeBtn.classList.toggle('liked', liked);
      });
    }

    // Publish button
    function setupPublish() {
      const btn = document.getElementById('im-publish-btn');
      if (!btn) return;
      btn.addEventListener('click', () => {
        if (btn.classList.contains('sent')) return;
        btn.classList.add('sent');
        btn.querySelector('.im-publish-text').textContent = 'Campaign Sent! ✓';
        // Re-trigger metrics
        animateMetrics();
        animatePlatforms();
        showNotifs();
      });
    }

    // Start everything when section is visible
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !started) {
          started = true;
          // Typing
          setTimeout(() => {
            typeText('im-type-1', lines[0].text, () => {
              setTimeout(() => typeText('im-type-2', lines[1].text), 300);
            });
          }, 400);
          // Metrics
          setTimeout(animateMetrics, 600);
          // Platforms
          setTimeout(animatePlatforms, 800);
          // Notifications
          setTimeout(showNotifs, 2000);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    obs.observe(section);
    setupLike();
    setupPublish();
  })();
