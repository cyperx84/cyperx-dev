/**
 * GSAP Page Transitions — layered on Astro View Transitions.
 *
 * Strategy: animate a SINGLE wrapper (#page-content) in/out.
 * Individual element animations are handled by scroll-animations.ts.
 * This avoids conflicts where both systems fight over the same elements.
 */
import { gsap } from 'gsap';

type Theme = 'dark' | 'light' | 'extreme';

function getTheme(): Theme {
  const cls = document.documentElement.classList;
  if (cls.contains('theme-extreme')) return 'extreme';
  if (cls.contains('theme-light')) return 'light';
  return 'dark';
}

function getWrapper(): HTMLElement | null {
  return document.getElementById('page-content');
}

// ── Exit animation (before page swap) ──
function animateOut(): Promise<void> {
  const wrapper = getWrapper();
  if (!wrapper) return Promise.resolve();

  const theme = getTheme();

  return new Promise((resolve) => {
    const tl = gsap.timeline({ onComplete: resolve });

    switch (theme) {
      case 'dark':
        tl.to(wrapper, {
          opacity: 0,
          y: -15,
          filter: 'blur(3px)',
          duration: 0.2,
          ease: 'power2.in',
        });
        break;

      case 'light':
        tl.to(wrapper, {
          opacity: 0,
          y: 20,
          duration: 0.2,
          ease: 'power2.in',
        });
        break;

      case 'extreme':
        tl.to(wrapper, {
          opacity: 0,
          scale: 0.97,
          rotation: gsap.utils.random(-1.5, 1.5),
          filter: 'blur(4px) hue-rotate(60deg)',
          duration: 0.25,
          ease: 'power2.in',
        });
        break;
    }
  });
}

// ── Entrance animation (after page swap) ──
function animateIn() {
  const wrapper = getWrapper();
  if (!wrapper) return;

  const theme = getTheme();

  // Ensure wrapper starts hidden
  gsap.killTweensOf(wrapper);

  switch (theme) {
    case 'dark':
      gsap.fromTo(wrapper,
        { opacity: 0, y: 20, filter: 'blur(3px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.4, ease: 'power3.out', delay: 0.05,
          onComplete: () => gsap.set(wrapper, { clearProps: 'all' }) }
      );
      break;

    case 'light':
      gsap.fromTo(wrapper,
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out', delay: 0.05,
          onComplete: () => gsap.set(wrapper, { clearProps: 'all' }) }
      );
      break;

    case 'extreme':
      gsap.fromTo(wrapper,
        { opacity: 0, scale: 1.03, y: -10, filter: 'blur(3px) hue-rotate(60deg)' },
        { opacity: 1, scale: 1, y: 0, rotation: 0, filter: 'blur(0px) hue-rotate(0deg)',
          duration: 0.4, ease: 'back.out(1.1)', delay: 0.05,
          onComplete: () => gsap.set(wrapper, { clearProps: 'all' }) }
      );
      break;
  }
}

// ── Wire up Astro lifecycle ──
export function initPageTransitions() {
  let hasNavigated = false;

  // Before navigation — animate wrapper out, then let Astro proceed
  document.addEventListener('astro:before-preparation', (e: any) => {
    const from = new URL(e.from);
    const to = new URL(e.to);
    if (from.pathname === to.pathname) return;

    hasNavigated = true;

    const originalLoader = e.loader;
    e.loader = async () => {
      await animateOut();
      await originalLoader();
    };
  });

  // After page loads — animate wrapper in (only on client-side nav, not first load)
  document.addEventListener('astro:page-load', () => {
    if (!hasNavigated) return; // Skip first load — content is already visible
    requestAnimationFrame(() => animateIn());
  });
}
