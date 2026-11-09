(function (global) {
  "use strict";

  const REDUCED =
    typeof matchMedia !== "undefined" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;

  const EASE_OUT = "cubic-bezier(0.2, 0, 0, 1)";
  const EASE_SPRING = "cubic-bezier(0.34, 1.12, 0.64, 1)";

  function initMaskReveal(root) {
    if (!root || REDUCED) {
      root?.querySelectorAll(".motion-mask-line").forEach((el) => el.classList.add("is-revealed"));
      return;
    }
    root.querySelectorAll(".motion-mask-line").forEach((el, i) => {
      window.setTimeout(() => el.classList.add("is-revealed"), 80 + i * 120);
    });
  }

  function initMastheadStagger(root) {
    if (!root || REDUCED) {
      root?.querySelectorAll(".motion-stagger-in").forEach((el) => el.classList.add("is-in"));
      return;
    }
    root.querySelectorAll(".motion-stagger-in").forEach((el, i) => {
      window.setTimeout(() => el.classList.add("is-in"), 200 + i * 80);
    });
  }

  let revealObserver = null;

  function observeScrollReveal(container) {
    if (!container) return () => {};
    container.querySelectorAll(".motion-scroll-reveal").forEach((el) => {
      el.classList.remove("is-visible");
    });

    if (REDUCED) {
      container.querySelectorAll(".motion-scroll-reveal").forEach((el) => el.classList.add("is-visible"));
      return () => {};
    }

    if (revealObserver) revealObserver.disconnect();

    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );

    container.querySelectorAll(".motion-scroll-reveal").forEach((el) => revealObserver.observe(el));

    return () => revealObserver?.disconnect();
  }

  function renderSkeletonGrid(host, count) {
    if (!host) return;
    const n = Math.min(count || 12, 18);
  const blocks = Array.from({ length: n }, (_, i) => {
      const wide = i % 5 === 0 ? " skeleton-card--wide" : "";
      return `<div class="skeleton-card${wide}" aria-hidden="true"><span class="skeleton-shine"></span><span class="skeleton-stripe"></span><span class="skeleton-body"><span class="skeleton-line skeleton-line--short"></span><span class="skeleton-line skeleton-line--title"></span><span class="skeleton-line"></span><span class="skeleton-line"></span></span></div>`;
    }).join("");
    host.innerHTML = `<div class="skeleton-grid" aria-busy="true" aria-label="正在加载资源列表">${blocks}</div>`;
  }

  /**
   * FLIP: animate cards that share data-resource-key between layouts.
   */
  function flipGrid(container, prevRects) {
    if (!container || REDUCED || !prevRects?.size) return;

    const cards = container.querySelectorAll(".card[data-resource-key]");
    requestAnimationFrame(() => {
      cards.forEach((card) => {
        const key = card.dataset.resourceKey;
        const prev = prevRects.get(key);
        if (!prev) return;
        const next = card.getBoundingClientRect();
        const dx = prev.left - next.left;
        const dy = prev.top - next.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
        card.style.transition = "none";
        card.style.transform = `translate(${dx}px, ${dy}px)`;
        card.style.opacity = "0.92";
        requestAnimationFrame(() => {
          card.style.transition = `transform 0.38s ${EASE_OUT}, opacity 0.28s ${EASE_OUT}`;
          card.style.transform = "";
          card.style.opacity = "";
          const clear = () => {
            card.style.transition = "";
            card.removeEventListener("transitionend", clear);
          };
          card.addEventListener("transitionend", clear);
        });
      });
    });
  }

  function captureCardRects(container) {
    const map = new Map();
    if (!container) return map;
    container.querySelectorAll(".card[data-resource-key]").forEach((card) => {
      map.set(card.dataset.resourceKey, card.getBoundingClientRect());
    });
    return map;
  }

  let tiltCard = null;

  function bindCardTilt(grid, hero) {
    if (REDUCED) return;

    const maxDeg = 6;
    const hosts = [grid, hero].filter(Boolean);

    function resetTilt() {
      if (!tiltCard) return;
      tiltCard.style.setProperty("--tilt-x", "0deg");
      tiltCard.style.setProperty("--tilt-y", "0deg");
      tiltCard.classList.remove("card--tilt-active");
      tiltCard = null;
    }

    hosts.forEach((host) => {
      host.addEventListener("pointermove", (e) => {
        const card = e.target.closest(".card");
        if (!card || !host.contains(card)) return;
        if (tiltCard && tiltCard !== card) resetTilt();
        tiltCard = card;
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        const ry = px * maxDeg;
        const rx = -py * maxDeg;
        card.classList.add("card--tilt-active");
        card.style.setProperty("--tilt-x", `${rx}deg`);
        card.style.setProperty("--tilt-y", `${ry}deg`);
        card.style.setProperty("--glare-x", `${(px + 0.5) * 100}%`);
        card.style.setProperty("--glare-y", `${(py + 0.5) * 100}%`);
      });

      host.addEventListener("pointerleave", resetTilt);
    });
  }

  function pulseChip(chip) {
    if (!chip || REDUCED) return;
    chip.classList.remove("chip--pulse");
    void chip.offsetWidth;
    chip.classList.add("chip--pulse");
  }

  let countFrame = null;
  let countGen = 0;

  function animateCount(el, nextValue) {
    if (!el) return;
    const target = Number(nextValue);
    if (REDUCED || Number.isNaN(target)) {
      return;
    }
    const text = el.textContent || "";
    const match = text.match(/显示\s*(\d+)/);
    if (!match) return;
    const from = Number(match[1]);
    if (from === target) return;

    countGen += 1;
    const gen = countGen;
    if (countFrame) cancelAnimationFrame(countFrame);
    const start = performance.now();
    const dur = Math.min(520, 180 + Math.abs(target - from) * 4);

    const suffixMatch = text.match(/(\s*\/\s*\d+\s*条.*)$/);
    const suffix = suffixMatch ? suffixMatch[1] : "";

    function tick(now) {
      if (gen !== countGen) return;
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - (1 - t) ** 3;
      const val = Math.round(from + (target - from) * eased);
      el.textContent = `显示 ${val}${suffix}`;
      if (t < 1) countFrame = requestAnimationFrame(tick);
      else {
        countFrame = null;
        el.textContent = `显示 ${target}${suffix}`;
      }
    }
    countFrame = requestAnimationFrame(tick);
  }

  function openDrawerSpring(drawer) {
    if (!drawer || REDUCED) return;
    const panel = drawer.querySelector(".drawer-panel");
    if (panel) {
      panel.style.transitionTimingFunction = EASE_SPRING;
    }
  }

  function closeDrawerSpring(drawer) {
    const panel = drawer?.querySelector(".drawer-panel");
    if (panel) panel.style.transitionTimingFunction = "";
  }

  global.MotionNav = {
    REDUCED,
    EASE_SPRING,
    initMaskReveal,
    initMastheadStagger,
    observeScrollReveal,
    renderSkeletonGrid,
    flipGrid,
    captureCardRects,
    bindCardTilt,
    pulseChip,
    animateCount,
    openDrawerSpring,
    closeDrawerSpring,
  };
})(typeof window !== "undefined" ? window : globalThis);
