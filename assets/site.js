/* Markadia — shared behaviour: fitted headlines, cursor, scroll progress,
   word reveal, counters, the work rail and the velocity marquee.
   Every piece checks for its own elements, so a page that lacks one is
   simply skipped rather than throwing. */
(() => {
"use strict";
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine   = matchMedia("(hover: hover) and (pointer: fine)").matches;
if (fine && !reduce) document.documentElement.classList.add("fine");

/* ── set each headline line to fill its measure exactly ──
   A knockout only works when the letters are the composition, and one
   font-size cannot fill the width for lines of different lengths. */
function textWidth(el) {
  /* A block-level span reports its container's width, so measure the text. */
  const r = document.createRange();
  r.selectNodeContents(el);
  return r.getBoundingClientRect().width;
}
function fitAll() {
  document.querySelectorAll("[data-fit-group]").forEach((g) => {
    const avail = g.clientWidth;
    if (!avail) return;
    const lines = [...g.querySelectorAll("[data-fit]")];
    const sizes = [];

    lines.forEach((el) => {
      /* Two passes: the first can be measured against a fallback face of a
         different width, so the second corrects against the real one. */
      let size = 100;
      for (let pass = 0; pass < 2; pass++) {
        el.style.fontSize = size + "px";
        const w = textWidth(el);
        if (w <= 4) { size = 0; break; }
        size = size * avail / w;
      }
      sizes.push(size);
      if (size) el.style.fontSize = size.toFixed(1) + "px";
    });

    /* Filling the width can overrun the height, which would put the headline
       under the footer. Scale the whole block back to the room it has. */
    const room = Number(g.dataset.fitHeight || 0);
    if (room > 0) {
      const h = g.getBoundingClientRect().height;
      if (h > room) {
        const k = room / h;
        lines.forEach((el, i) => {
          if (sizes[i]) el.style.fontSize = (sizes[i] * k).toFixed(1) + "px";
        });
      }
    }
  });
}
/* The hero headline may use the viewport height minus the nav and the foot. */
function setHeroRoom() {
  const h1 = document.querySelector(".ko-plate [data-fit-group]");
  const ko = document.querySelector(".ko");
  if (h1 && ko) h1.dataset.fitHeight =
    Math.max(170, ko.clientHeight - (innerWidth <= 760 ? 240 : 196));
}
setHeroRoom();
addEventListener("resize", setHeroRoom);

if (document.fonts && document.fonts.load) {
  document.fonts.load('900 100px "Barlow Condensed"').then(fitAll).catch(fitAll);
}
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);
addEventListener("load", fitAll);
addEventListener("resize", fitAll);
const yrEl = document.getElementById("yr");
if (yrEl) yrEl.textContent = new Date().getFullYear();

/* ── cursor ──────────────────────────────────────────── */
if (fine && !reduce) {
  const c = document.getElementById("cursor");
  let cx = innerWidth / 2, cy = innerHeight / 2, px = cx, py = cy, tick = null;
  const run = () => {
    px += (cx - px) * .22; py += (cy - py) * .22;
    c.style.transform = `translate(${px}px,${py}px) translate(-50%,-50%)`;
    tick = Math.abs(cx - px) + Math.abs(cy - py) > .4 ? requestAnimationFrame(run) : null;
  };
  addEventListener("pointermove", (e) => {
    cx = e.clientX; cy = e.clientY;
    if (!tick) tick = requestAnimationFrame(run);
  }, { passive: true });
  addEventListener("pointerover", (e) => {
    c.classList.toggle("big", !!e.target.closest("a,button,.card"));
  });
}

/* ── the headline film: fetched only when it is on screen ── */
function film(id, src) {
  const v = document.getElementById(id);
  if (!v || reduce) return;              /* reduced motion keeps the still */
  new IntersectionObserver((es) => es.forEach(e => {
    if (e.isIntersecting) { if (!v.src) { v.src = src; v.load(); } v.play().catch(() => {}); }
    else v.pause();
  }), { rootMargin: "150px" }).observe(v);
}
film("koFilm", "assets/video/ai/smoothie-ice.mp4");

/* ── split the statement into words so each can land on its own beat ── */
document.querySelectorAll("[data-split]").forEach((el) => {
  const walk = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((t) => {
          if (!t.trim()) return frag.appendChild(document.createTextNode(t));
          const s = document.createElement("span");
          s.className = "w"; s.textContent = t;
          frag.appendChild(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
  };
  walk(el);
  const words = el.querySelectorAll(".w");
  const show = (stagger) => words.forEach((w, i) => {
    w.style.transitionDelay = (stagger ? i * 42 : 0) + "ms";
    w.classList.add("in");
  });
  const obs = new IntersectionObserver((es, o) => es.forEach(e => {
    if (!e.isIntersecting) return;
    show(true); o.disconnect(); clearTimeout(failsafe);
  }), { threshold: .25 });
  obs.observe(el);
  /* These words start at zero opacity, so nothing may leave them there. If the
     observer has not fired by now, show them and drop the effect. */
  const failsafe = setTimeout(() => { show(false); obs.disconnect(); }, 4000);
});

/* ── scroll progress ─────────────────────────────────── */
const prog = document.getElementById("progress");
if (prog) {
  const draw = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    prog.style.transform = "scaleX(" + (max > 0 ? Math.min(1, scrollY / max) : 0) + ")";
  };
  addEventListener("scroll", draw, { passive: true });
  addEventListener("resize", draw);
  draw();
}

/* ── figures count up once, when they arrive ─────────────── */
document.querySelectorAll("[data-count]").forEach((el) => {
  const target = Number(el.dataset.count);
  if (!Number.isFinite(target)) return;
  if (reduce) { el.textContent = target; return; }
  el.textContent = "0";
  new IntersectionObserver((es, o) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    o.disconnect();
    const t0 = performance.now(), ms = 1100;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / ms);
      el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }), { threshold: .6 }).observe(el);
  /* never leave a zero on screen if the observer never fires */
  setTimeout(() => { if (el.textContent === "0") el.textContent = target; }, 4000);
});

/* ── the work rail ───────────────────────────────────────
   Thumbnails the studio already has: designs in 4:5, clips in 9:16. */
const WORK = [
  ["assets/portfolio/smash-burger-01-thumb.jpg", "Smash Burger", "Food & Beverage", 0],
  ["assets/video/ai/smoothie-ice-poster.jpg",    "Matcha splash", "AI ad video", 1],
  ["assets/portfolio/sama-school-02-thumb.jpg",  "Sama School", "Education", 0],
  ["assets/portfolio/glowy-03-thumb.jpg",        "Glowy", "Beauty", 0],
  ["assets/video/ai/cup-on-dark-poster.jpg",     "Iced hibiscus", "AI ad video", 1],
  ["assets/portfolio/smash-burger-05-thumb.jpg", "Smash Burger", "Food & Beverage", 0],
  ["assets/video/ai/v60-pour-poster.jpg",        "Iced pour-over", "AI ad video", 1],
  ["assets/portfolio/sama-school-07-thumb.jpg",  "Sama School", "Education", 0],
  ["assets/portfolio/glowy-06-thumb.jpg",        "Glowy", "Beauty", 0],
  ["assets/video/ai/ice-cream-crumbs-poster.jpg","Lotus ice cream", "AI ad video", 1],
  ["assets/portfolio/smash-burger-08-thumb.jpg", "Smash Burger", "Food & Beverage", 0],
  ["assets/video/ai/barista-pour-poster.jpg",    "Latte pour", "AI ad video", 1],
];
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const track = document.getElementById("railTrack");
if (track) track.innerHTML = WORK.map(([src, name, cat, tall]) => `
  <a class="card${tall ? " tall" : ""}" href="portfolio.html${tall ? "#ai-video" : "#design"}">
    ${tall ? '<span class="tag">Video</span>' : ""}
    <img src="${src}" alt="${esc(name)} — ${esc(cat)}" loading="lazy" decoding="async">
    <figcaption>${esc(name)} · ${esc(cat)}</figcaption>
  </a>`).join("");

/* Pin the rail and walk it sideways with the scroll. Off on narrow screens and
   under reduced motion, where it is an ordinary swipe strip instead. */
const rail = document.getElementById("rail");
const bar  = document.getElementById("railBar");
if (rail && track) {
let pinned = false, travel = 0;

function measure() {
  pinned = innerWidth > 860 && !reduce;
  if (!pinned) {
    rail.style.height = "";
    track.style.transform = "";
    return;
  }
  travel = Math.max(0, track.scrollWidth - innerWidth);
  /* the taller the overflow, the longer the pin lasts */
  rail.style.height = innerHeight + travel + "px";
  onScroll();
}
function onScroll() {
  if (!pinned) return;
  const top = rail.offsetTop;
  const p = Math.min(1, Math.max(0, (scrollY - top) / (rail.offsetHeight - innerHeight)));
  track.style.transform = `translate3d(${-p * travel}px,0,0)`;
  if (bar) bar.style.transform = `translateX(${p * (100 / 0.12 - 100)}%)`;
}
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", measure);
  addEventListener("load", measure);
  measure();
}

/* ── marquee, carried by the scroll ───────────────────── */
const mq = document.getElementById("mqTrack");
if (mq && !reduce) {
  let x = 0, last = scrollY, half = 0, raf = null;
  const sync = () => { half = mq.scrollWidth / 2; };
  sync(); addEventListener("resize", sync);
  const step = () => {
    const d = scrollY - last; last = scrollY;
    x -= 0.55 + Math.min(Math.abs(d) * 0.25, 14) * (d < 0 ? -0.35 : 1);
    if (half) { if (x <= -half) x += half; if (x > 0) x -= half; }
    mq.style.transform = `translate3d(${x}px,0,0)`;
    raf = requestAnimationFrame(step);
  };
  new IntersectionObserver((es) => es.forEach(e => {
    if (e.isIntersecting) { if (!raf) raf = requestAnimationFrame(step); }
    else if (raf) { cancelAnimationFrame(raf); raf = null; }
  })).observe(mq.parentElement);
}

/* ── FAQ, on the pages that have one ──────────────────── */
document.querySelectorAll(".faq-q").forEach((btn) => {
  btn.addEventListener("click", () => {
    const panel = document.getElementById(btn.getAttribute("aria-controls"));
    const open = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", open ? "false" : "true");
    if (panel) panel.hidden = open;
  });
});
})();

