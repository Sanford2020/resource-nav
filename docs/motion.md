# Motion inventory (motion-prompt methodology)

This site uses [motion-prompt](https://showheyohtaki.github.io/motion-prompt/) **named effects** instead of vague “make it cooler” briefs. Each row maps a library name → where it lives → the prompt idea we implemented.

| # | motion-prompt name | Applied to | Prompt / intent |
|---|-------------------|------------|-----------------|
| [#005](https://showheyohtaki.github.io/motion-prompt/#005) | **Mask reveal** | Masthead title lines (`.motion-mask-line`) | “Bring the title in with a mask reveal from below, 0.6 s, each line slightly after the one before.” |
| [#002](https://showheyohtaki.github.io/motion-prompt/#002) | **Stagger** | Meta bar, deck, editor’s note (`.motion-stagger-in`) | “Bring in supporting copy with a stagger, ~80 ms apart.” |
| [#069](https://showheyohtaki.github.io/motion-prompt/#069) | **Skeleton screen** | `#cardGrid` while `data/resources.json` loads | “Grey blocks in the shape of cards, with a shine sweeping left to right every 0.9 s.” (`motion.js` → `renderSkeletonGrid`) |
| [#074](https://showheyohtaki.github.io/motion-prompt/#074) | **Fade-in on scroll** | Resource cards (`.motion-scroll-reveal`) | “Fade in cards on scroll: up from ~28 px below, over 0.6 s.” `IntersectionObserver`, unobserve after first reveal. |
| [#081](https://showheyohtaki.github.io/motion-prompt/#081) | **Hover lift** | `.card` | “Up ~8 px with a deeper shadow, over 0.3 s.” |
| [#153](https://showheyohtaki.github.io/motion-prompt/#153) | **3D tilt on hover** | `.card` (pointer, delegated) | “Tilt up to ~6° following the cursor, with a moving glare” — toned down from 18° for editorial calm. |
| [#050](https://showheyohtaki.github.io/motion-prompt/#050) | **Drawer (Off-canvas)** | `#detailDrawer` panel | “Slide in from the side over ~0.4 s with spring ease; dim backdrop ~36%.” |
| [#061](https://showheyohtaki.github.io/motion-prompt/#061) | **Filter chips** | Category / subcategory / advanced chips | “Clicked chip gets feedback; list filters smoothly.” Active chip pulse + FLIP on grid. |
| — | **FLIP layout** (web perf pattern; pairs with filter UX) | `#cardGrid` on filter/search/sort | Capture `data-resource-key` positions before render, invert/play on shared keys (`motion.js` → `flipGrid`). |
| [#007](https://showheyohtaki.github.io/motion-prompt/#007) | **Count-up** | `#resultCount` | “Count the figure to the new filtered total, easing out at the end.” |

## Files

- `motion.js` — observers, skeleton, FLIP, tilt, count-up, drawer timing
- `styles.css` — tokens, reveal/hover/skeleton/drawer CSS
- `app.js` — hooks on load, `refresh()`, chips, drawer

## Deliberately skipped

| Name | Reason |
|------|--------|
| [#073 Parallax scrolling](https://showheyohtaki.github.io/motion-prompt/#073) | Competes with sticky filter rail; little gain on a directory page. |
| [#084 Magnetic button](https://showheyohtaki.github.io/motion-prompt/#084) | Poor fit with 300+ cards; reserved for single CTAs. |
| [#083 Cursor follower](https://showheyohtaki.github.io/motion-prompt/#083) | Too playful for warm-paper editorial tone. |
| [#089 Preloader](https://showheyohtaki.github.io/motion-prompt/#089) | JSON fetch is fast; skeleton is enough. |
| [#092 Page transition](https://showheyohtaki.github.io/motion-prompt/#092) | Single-page app; no route changes. |
| [#095 Animated gradient](https://showheyohtaki.github.io/motion-prompt/#095) | User rejected neon / flashy backgrounds. |

## `prefers-reduced-motion`

All effects respect `prefers-reduced-motion: reduce`: transitions collapse, scroll reveals show immediately, skeleton shine stops, card tilt is not bound, count-up is skipped.
