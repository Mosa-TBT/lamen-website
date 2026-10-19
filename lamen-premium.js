/* LAMEN — premium motion layer.
   One IntersectionObserver drives every scroll reveal; one rAF-throttled
   passive scroll handler drives header state, progress, parallax and the
   journey spine. Nothing here hides content unless it can also reveal it. */
(() => {
  "use strict";

  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canObserve = "IntersectionObserver" in window;
  const header = document.querySelector(".site-header");

  root.classList.add("lx-js");
  /* ---------- Header: scroll state, hide on fast scroll down, progress ---------- */
  const progress = document.createElement("div");
  progress.className = "lx-progress";
  progress.setAttribute("aria-hidden", "true");
  header?.append(progress);

  const menu = document.getElementById("mobileMenu");
  const toggle = document.getElementById("menuToggle");
  toggle?.addEventListener("click", () => {
    // The original script toggles .open; mirror it so the header stays put.
    requestAnimationFrame(() => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      if (menu) menu.hidden = !open;
      header?.classList.toggle("menu-open", open);
    });
  });
  const closeMenu = () => {
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    menu.classList.remove("open");
    toggle?.setAttribute("aria-expanded", "false");
    toggle?.setAttribute("aria-label", "Open navigation");
    header?.classList.remove("menu-open");
  };
  menu?.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu && !menu.hidden) {
      closeMenu();
      toggle?.focus();
    }
  });

  /* ---------- Primary CTA sheen ---------- */
  document
    .querySelectorAll(
      ".hero .btn-primary, .nav-cta, .mobile-cta, #lamen-purpose a.group, #contact button[type='submit'], .impact-cta",
    )
    .forEach((el) => el.classList.add("lx-btn-sheen"));

  /* ---------- Aurora layers for dark gradient panels ---------- */
  [
    ...["#trust .bg-\\[\\#126344\\]", "#contact .bg-\\[\\#0b3827\\]", "#lamen-in-numbers", "#site-footer"].map(
      (sel) => document.querySelector(sel),
    ),
    ...document.querySelectorAll("[data-lx-aurora]"),
  ].forEach(
    (host) => {
      if (!host) return;
      const a = document.createElement("div");
      a.className = "lx-aurora";
      a.setAttribute("aria-hidden", "true");
      host.prepend(a);
      if (getComputedStyle(host).position === "static") host.style.position = "relative";
    },
  );

  /* ---------- Count-up for genuine small figures in "At a glance" ---------- */
  const counters = [...document.querySelectorAll("#lamen-in-numbers .text-7xl")].filter((el) =>
    /^\d{1,3}$/.test(el.textContent.trim()),
  );

  if (reduced || !canObserve) return;

  /* ---------- Reveal tagging ---------- */
  // Areas that already run their own choreography are left alone.
  const SKIP =
    ".hero, #how-it-works, #lamen-branches-map, .ll-stage, .ll-modal, #ll-profile-modal, #lamen-branch-modal, .lamen-achievements, [class*='-reveal'], .lp-product";
  const skip = (el) => !!el.closest(SKIP);
  const tag = (el, kind, i = 0) => {
    if (!el || el.hasAttribute("data-lx") || skip(el)) return;
    el.setAttribute("data-lx", kind);
    el.style.setProperty("--lx-i", i);
  };

  const sections = document.querySelectorAll(
    "main > section, body > section, #site-footer",
  );
  sections.forEach((section) => {
    if (skip(section)) return;

    // Heading group: eyebrow → masked headline → supporting text, staggered.
    section.querySelectorAll("h2").forEach((h2) => {
      if (skip(h2)) return;
      const group = h2.parentElement;
      let i = 0;
      [...group.children].forEach((child) => {
        if (child === h2) tag(h2, "mask", i++);
        else if (!child.querySelector("h2, img")) tag(child, "rise", i++);
      });
      // A companion intro beside the heading block (split headers).
      const sib = group.nextElementSibling;
      if (sib && !sib.querySelector("h2, img, article") && sib.textContent.trim().length < 600)
        tag(sib, "right", 2);
    });

    // Card collections: stagger direct children of grids / lists.
    section.querySelectorAll(".grid, .space-y-10, ul").forEach((grid) => {
      const kids = [...grid.children].filter(
        (k) => !k.querySelector("h2") && !k.closest("form") && k.offsetHeight > 40,
      );
      if (kids.length < 2) return;
      kids.forEach((k, i) => {
        if (k.querySelector("[data-lx]")) return;
        const big = k.querySelector("img") && k.offsetWidth > 320;
        tag(k, big ? "image" : "rise", i % 4);
      });
    });

    // Large photographs: frame-opening reveal.
    section.querySelectorAll("img").forEach((img) => {
      if (skip(img) || img.closest("[data-lx]")) return;
      const frame = img.parentElement;
      if (!frame || frame.offsetWidth < 320) return;
      if (getComputedStyle(frame).overflow !== "hidden") return;
      tag(frame, "image");
    });
  });

  // Hairline accents draw in.
  document
    .querySelectorAll("#journey .h-px.w-16, #lamen-purpose .border-t")
    .forEach((el) => el.matches(".h-px") && tag(el, "line"));

  root.classList.add("lx-motion");

  // Clipped elements have zero visible area to IntersectionObserver, so
  // masked headings and image frames are watched through their parent.
  const watchers = new Map();
  const revealIO = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        (watchers.get(e.target) || []).forEach((el) => el.classList.add("lx-in"));
        revealIO.unobserve(e.target);
      }),
    { threshold: 0.04, rootMargin: "0px 0px -10% 0px" },
  );
  const tagged = document.querySelectorAll("[data-lx]");
  tagged.forEach((el) => {
    const clipped = /^(mask|image|line)$/.test(el.dataset.lx);
    const proxy = clipped && el.parentElement ? el.parentElement : el;
    if (!watchers.has(proxy)) watchers.set(proxy, []);
    watchers.get(proxy).push(el);
    revealIO.observe(proxy);
  });

  // Safety net: anything already scrolled past (anchor jumps, restored
  // scroll position) or still hidden after a while becomes visible.
  const flushAbove = () =>
    tagged.forEach((el) => {
      if (!el.classList.contains("lx-in") && el.getBoundingClientRect().top < innerHeight)
        el.classList.add("lx-in");
    });
  addEventListener("hashchange", () => setTimeout(flushAbove, 60));
  setTimeout(flushAbove, 400);

  /* ---------- Count-up ---------- */
  const countIO = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        countIO.unobserve(e.target);
        const el = e.target;
        const final = el.textContent.trim();
        const target = parseInt(final, 10);
        const pad = final.length;
        el.setAttribute("aria-label", final);
        const t0 = performance.now();
        const dur = 1100;
        const step = (t) => {
          const p = Math.min(1, (t - t0) / dur);
          const v = Math.round(target * (1 - Math.pow(1 - p, 3)));
          el.textContent = String(v).padStart(pad, "0");
          if (p < 1) requestAnimationFrame(step);
          else el.textContent = final;
        };
        requestAnimationFrame(step);
      }),
    { threshold: 0.6 },
  );
  counters.forEach((el) => countIO.observe(el));

  /* ---------- Pause off-screen ambient animation ---------- */
  const ambientIO = new IntersectionObserver((entries) =>
    entries.forEach((e) => e.target.classList.toggle("lx-paused", !e.isIntersecting)),
  );
  document
    .querySelectorAll(".lx-aurora")
    .forEach((a) => ambientIO.observe(a.parentElement));

  /* ---------- Scroll-linked effects ---------- */
  const hero = document.querySelector(".hero-premium");
  const heroBg = hero?.querySelector(".hero-background");
  const heroVisual = hero?.querySelector(".hero-visual");
  const spine = document.querySelector("#journey .relative > .absolute.w-px");
  const spineHost = spine?.parentElement;
  const heroContent = hero?.querySelector(".hero-content");
  const parallaxImgs = [...document.querySelectorAll("#lamen-purpose .group.relative.overflow-hidden img")];
  const slab = document.querySelector("#lamen-purpose .relative.order-1");
  const wide = matchMedia("(min-width: 768px)");

  /* Hero depth: layers drift against each other with the pointer. */
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  if (hero && finePointer.matches) {
    let px = 0, py = 0, raf = 0;
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      px = ((e.clientX - r.left) / r.width - 0.5) * 2;
      py = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        hero.style.setProperty("--lx-px", px.toFixed(3));
        hero.style.setProperty("--lx-py", py.toFixed(3));
      });
    });
    hero.addEventListener("pointerleave", () => {
      hero.style.setProperty("--lx-px", 0);
      hero.style.setProperty("--lx-py", 0);
    });
  }

  /* Journey chapters light up once the visitor reaches them. */
  const chapterIO = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("lx-reached");
        chapterIO.unobserve(e.target);
      }),
    { rootMargin: "0px 0px -45% 0px" },
  );
  document.querySelectorAll("#journey .space-y-10 > *").forEach((li) => chapterIO.observe(li));

  let lastY = scrollY;
  let ticking = false;

  const update = () => {
    ticking = false;
    const y = scrollY;
    const vh = innerHeight;

    if (header) {
      header.classList.toggle("is-scrolled", y > 40);
      const goingDown = y > lastY + 4;
      const goingUp = y < lastY - 4;
      if (goingDown && y > vh * 0.9 && !header.classList.contains("menu-open"))
        header.classList.add("is-hidden");
      else if (goingUp || y < vh * 0.5) header.classList.remove("is-hidden");
      const max = root.scrollHeight - vh;
      progress.style.setProperty("--lx-progress", max > 0 ? (y / max).toFixed(4) : 0);
    }
    lastY = y;

    if (hero && y < vh * 1.2) {
      heroBg?.style.setProperty("--lx-hero-shift", `${(y * 0.28).toFixed(1)}px`);
      if (wide.matches) heroVisual?.style.setProperty("--lx-visual-shift", `${(y * -0.08).toFixed(1)}px`);
      // Copy lifts and softens as the hero leaves, so the exit feels deliberate.
      const t = Math.min(1, y / vh);
      heroContent?.style.setProperty("--lx-hero-exit", `${(t * -70).toFixed(1)}px`);
      heroContent?.style.setProperty("--lx-hero-fade", (1 - t * 0.85).toFixed(3));
    }

    if (spine && spineHost) {
      const r = spineHost.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) {
        const p = Math.min(1, Math.max(0, (vh * 0.6 - r.top) / r.height));
        spine.style.setProperty("--lx-spine", p.toFixed(3));
      }
    }

    if (wide.matches)
      parallaxImgs.forEach((img) => {
        const r = img.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const c = (r.top + r.height / 2 - vh / 2) / vh; // -1 … 1
        img.style.setProperty("--lx-par", `${(c * -28).toFixed(1)}px`);
        slab?.style.setProperty("--lx-slab", `${(c * 36).toFixed(1)}px`);
      });
  };

  let flushTimer;
  addEventListener(
    "scroll",
    () => {
      // Timer-based safety net in case observer callbacks are delayed.
      clearTimeout(flushTimer);
      flushTimer = setTimeout(flushAbove, 180);
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  addEventListener("resize", update, { passive: true });
  update();
})();

/* Header state must also work when motion is reduced (no hide-on-scroll). */
(() => {
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const header = document.querySelector(".site-header");
  const progress = header?.querySelector(".lx-progress");
  const on = () => {
    header?.classList.toggle("is-scrolled", scrollY > 40);
    const max = document.documentElement.scrollHeight - innerHeight;
    progress?.style.setProperty("--lx-progress", max > 0 ? (scrollY / max).toFixed(4) : 0);
  };
  addEventListener("scroll", on, { passive: true });
  on();
})();

/* ---------------------------------------------------------------------
   HOW IT WORKS — step stage.
   The tall .process-steps element becomes a scroll track; its cards sit in
   one sticky stage and only the current card is shown. Scroll position (or
   the prev/next/step controls, which simply scroll the track) chooses the
   step. Changing step plays one transition at a time:
     · the outgoing card is split into two inert, visual-only leaves that
       swing away on their outer hinges like a pair of doors, fading out;
     · the incoming card rises from below and settles into place.
   Reduced motion swaps cards instantly. Without JavaScript the original
   stacked layout remains.
   --------------------------------------------------------------------- */
(() => {
  "use strict";
  const section = document.getElementById("how-it-works");
  const track = document.getElementById("processSteps");
  if (!section || !track || !("IntersectionObserver" in window)) return;
  const cards = [...track.querySelectorAll(":scope > .process-step")];
  if (cards.length < 2) return;

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
  const EASE_DOOR = "cubic-bezier(0.55, 0, 0.3, 1)";
  const DOOR_MS = 920;
  const RISE_MS = 980;
  const RISE_DELAY = 140;

  /* Stage + controls ------------------------------------------------- */
  section.classList.add("lx-stage-mode");
  const stage = document.createElement("div");
  stage.className = "lx-stage";
  const deck = document.createElement("div");
  deck.className = "lx-deck";
  cards.forEach((c) => deck.append(c));
  stage.append(deck);

  const makeButton = (label, glyph) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "lx-step-arrow";
    b.setAttribute("aria-label", label);
    const g = document.createElement("span");
    g.setAttribute("aria-hidden", "true");
    g.textContent = glyph;
    b.append(g);
    return b;
  };
  const controls = document.createElement("div");
  controls.className = "lx-step-controls";
  const prev = makeButton("Previous step", "←");
  const next = makeButton("Next step", "→");
  const dots = document.createElement("div");
  dots.className = "lx-step-dots";
  const dotButtons = cards.map((card, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "lx-step-dot";
    const title = card.querySelector("h3")?.textContent.trim() || "Step " + (i + 1);
    b.setAttribute("aria-label", "Step " + (i + 1) + ": " + title);
    dots.append(b);
    return b;
  });
  const counter = document.createElement("span");
  counter.className = "lx-step-count";
  counter.setAttribute("aria-live", "polite");
  controls.append(prev, dots, next, counter);
  stage.append(controls);
  track.append(stage);

  /* Geometry: one scroll "segment" per step ---------------------------- */
  let segment = 0;
  const stickyTop = () => parseFloat(getComputedStyle(stage).top) || 0;
  const layout = () => {
    segment = Math.round(innerHeight * (innerWidth < 768 ? 0.7 : 0.75));
    track.style.setProperty("--lx-track-extra", segment * (cards.length - 1) + "px");
  };
  const trackStart = () => track.getBoundingClientRect().top + scrollY - stickyTop();
  const indexFromScroll = () => {
    const progressed = scrollY - trackStart();
    return Math.max(0, Math.min(cards.length - 1, Math.floor(progressed / segment + 0.5)));
  };
  const scrollToStep = (i) => {
    scrollTo({ top: trackStart() + i * segment, behavior: reduced ? "auto" : "smooth" });
  };

  /* State -------------------------------------------------------------- */
  let current = 0;
  let animating = false;
  let pending = null;

  const paint = () => {
    cards.forEach((c, i) => {
      const on = i === current;
      c.classList.toggle("lx-current", on);
      c.classList.toggle("is-active", on);
      c.setAttribute("aria-hidden", String(!on));
      c.inert = !on;
    });
    dotButtons.forEach((b, i) => {
      b.classList.toggle("is-on", i === current);
      if (i === current) b.setAttribute("aria-current", "step");
      else b.removeAttribute("aria-current");
    });
    prev.disabled = current === 0;
    next.disabled = current === cards.length - 1;
    counter.textContent =
      String(current + 1).padStart(2, "0") + " / " + String(cards.length).padStart(2, "0");
  };

  // Visual-only leaves cut from the outgoing card. They are inert and
  // hidden from assistive technology, and removed when the swing ends.
  const makeDoors = (card) => {
    const doors = document.createElement("div");
    doors.className = "lx-doors";
    doors.setAttribute("aria-hidden", "true");
    doors.style.top = card.offsetTop + "px";
    doors.style.left = card.offsetLeft + "px";
    doors.style.width = card.offsetWidth + "px";
    doors.style.height = card.offsetHeight + "px";
    const leaves = ["left", "right"].map((side) => {
      const leaf = document.createElement("div");
      leaf.className = "lx-door lx-door-" + side;
      const face = card.cloneNode(true);
      face.removeAttribute("id");
      face.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
      face.classList.add("lx-door-face");
      face.classList.remove("lx-current");
      face.removeAttribute("aria-hidden");
      face.inert = true;
      leaf.append(face);
      doors.append(leaf);
      return leaf;
    });
    deck.append(doors);
    return { doors, leaves };
  };

  const finish = () => {
    animating = false;
    const p = pending;
    pending = null;
    if (p !== null && p !== current) go(p);
  };

  function go(to) {
    to = Math.max(0, Math.min(cards.length - 1, to));
    if (to === current) {
      pending = null;
      return;
    }
    if (animating) {
      pending = to; // only the latest request survives
      return;
    }
    const out = cards[current];
    const incoming = cards[to];
    current = to;

    if (reduced) {
      paint();
      return;
    }
    animating = true;
    const { doors, leaves } = makeDoors(out);
    paint(); // the real outgoing card hides beneath its own leaves

    const swing = (leaf, dir) =>
      leaf.animate(
        [
          { transform: "translateX(0) rotateY(0deg)", opacity: 1, filter: "brightness(1)" },
          { opacity: 1, offset: 0.22 },
          // Leaves are gone before the incoming copy is fully legible, so
          // the two never compete; the swing itself continues to the end.
          {
            transform: "translateX(" + dir * 4.5 + "%) rotateY(" + dir * -52 + "deg)",
            opacity: 0,
            filter: "brightness(0.78)",
            offset: 0.56,
          },
          {
            transform: "translateX(" + dir * 7 + "%) rotateY(" + dir * -78 + "deg)",
            opacity: 0,
            filter: "brightness(0.75)",
          },
        ],
        { duration: DOOR_MS, easing: EASE_DOOR, fill: "forwards" },
      );
    const a1 = swing(leaves[0], -1);
    const a2 = swing(leaves[1], 1);
    const rise = incoming.animate(
      [
        { transform: "translateY(110px) scale(0.94)", opacity: 0 },
        { opacity: 0.08, offset: 0.18 },
        { opacity: 1, offset: 0.58 },
        { transform: "translateY(0) scale(1)", opacity: 1 },
      ],
      { duration: RISE_MS, delay: RISE_DELAY, easing: EASE_OUT, fill: "backwards" },
    );
    Promise.allSettled([a1.finished, a2.finished, rise.finished]).then(() => {
      doors.remove();
      finish();
    });
  }

  /* Wiring -------------------------------------------------------------- */
  prev.addEventListener("click", () => scrollToStep(current - 1));
  next.addEventListener("click", () => scrollToStep(current + 1));
  dotButtons.forEach((b, i) => b.addEventListener("click", () => scrollToStep(i)));

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      go(indexFromScroll());
    });
  };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener(
    "resize",
    () => {
      layout();
      onScroll();
    },
    { passive: true },
  );

  // First appearance: the opening card rises into the stage.
  if (!reduced) {
    const intro = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        intro.disconnect();
        if (animating) return;
        cards[current].animate(
          [
            { transform: "translateY(120px) scale(0.94)", opacity: 0 },
            { opacity: 1, offset: 0.5 },
            { transform: "translateY(0) scale(1)", opacity: 1 },
          ],
          { duration: 1100, easing: EASE_OUT, fill: "backwards" },
        );
      },
      { threshold: 0.2 },
    );
    intro.observe(stage);
  }

  layout();
  current = indexFromScroll();
  paint();
})();
