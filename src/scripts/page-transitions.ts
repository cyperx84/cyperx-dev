/**
 * GSAP Page Transitions — layered on Astro View Transitions.
 *
 * Flow:
 *   1. User clicks link
 *   2. astro:before-preparation → GSAP animates content OUT
 *   3. Astro View Transition snapshot + CSS animation (existing glitch/slice/chaos)
 *   4. astro:page-load → GSAP animates content IN
 *
 * Does NOT replace View Transitions — enhances them.
 */
import { gsap } from 'gsap';

type Theme = 'dark' | 'light' | 'extreme';

function getTheme(): Theme {
  const cls = document.documentElement.classList;
  if (cls.contains('theme-extreme')) return 'extreme';
  if (cls.contains('theme-light')) return 'light';
  return 'dark';
}

// ── Selectors for animatable content ──
const CONTENT_SELECTOR = [
  'main > section',
  '.shard-hero',
  '.parallax-hero',
  'article',
  '[data-reveal]',
  '[data-stagger-grid] > *',
  '.site-footer',
].join(', ');

// Don't animate persistent elements
const PERSIST_IDS = ['three-bg', 'cursor-canvas', 'scroll-progress', 'crt-layer', 'mobile-menu'];

function getAnimatableElements(): HTMLElement[] {
  const els = Array.from(document.querySelectorAll<HTMLElement>(CONTENT_SELECTOR));
  return els.filter(el => {
    if (PERSIST_IDS.includes(el.id)) return false;
    // Skip hidden theme variants
    const parent = el.closest('.variant-dark, .variant-light, .variant-extreme');
    if (parent && getComputedStyle(parent).display === 'none') return false;
    return true;
  });
}

// ── Exit animations (before page swap) ──
function animateOut(): Promise<void> {
  const theme = getTheme();
  const els = getAnimatableElements();

  if (!els.length) return Promise.resolve();

  // Kill any running entrance animations
  els.forEach(el => gsap.killTweensOf(el));

  return new Promise((resolve) => {
    const tl = gsap.timeline({
      onComplete: resolve,
      defaults: { ease: 'power2.in' },
    });

    switch (theme) {
      case 'dark':
        // Glitch scatter — elements fly in random directions
        tl.to(els, {
          opacity: 0,
          y: () => gsap.utils.random(-30, 30),
          x: () => gsap.utils.random(-15, 15),
          scale: 0.97,
          filter: 'blur(3px)',
          stagger: { each: 0.02, from: 'center' },
          duration: 0.25,
        });
        break;

      case 'light':
        // Clean slide down + fade
        tl.to(els, {
          opacity: 0,
          y: 30,
          stagger: { each: 0.02, from: 'start' },
          duration: 0.2,
        });
        break;

      case 'extreme':
        // Chaotic scatter — each element warps differently
        tl.to(els, {
          opacity: 0,
          y: () => gsap.utils.random(-50, 50),
          x: () => gsap.utils.random(-30, 30),
          rotation: () => gsap.utils.random(-5, 5),
          scale: () => gsap.utils.random(0.85, 1.1),
          filter: 'blur(4px) hue-rotate(90deg)',
          stagger: { each: 0.015, from: 'random' },
          duration: 0.3,
        });
        break;
    }
  });
}

// ── Entrance animations (after page swap) ──
function animateIn() {
  const theme = getTheme();
  const els = getAnimatableElements();

  if (!els.length) return;

  // Reset any leftover inline styles from exit
  gsap.set(els, { clearProps: 'all' });

  // Small delay to let Astro View Transition finish + DOM settle
  const tl = gsap.timeline({
    delay: 0.1,
    defaults: { ease: 'power3.out' },
  });

  switch (theme) {
    case 'dark':
      // Elements materialize from glitch positions
      gsap.set(els, { opacity: 0, y: 25, filter: 'blur(2px)' });
      tl.to(els, {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        stagger: { each: 0.04, from: 'start' },
        duration: 0.5,
      });
      break;

    case 'light':
      // Clean rise from below
      gsap.set(els, { opacity: 0, y: 40 });
      tl.to(els, {
        opacity: 1,
        y: 0,
        stagger: { each: 0.05, from: 'start' },
        duration: 0.5,
      });
      break;

    case 'extreme':
      // Chaotic assembly — pieces snap into place
      gsap.set(els, {
        opacity: 0,
        y: () => gsap.utils.random(-40, 40),
        x: () => gsap.utils.random(-20, 20),
        rotation: () => gsap.utils.random(-3, 3),
        scale: 0.95,
      });
      tl.to(els, {
        opacity: 1,
        y: 0,
        x: 0,
        rotation: 0,
        scale: 1,
        stagger: { each: 0.03, from: 'edges' },
        duration: 0.45,
        ease: 'back.out(1.2)',
      });
      break;
  }
}

// ── Wire up Astro lifecycle ──
export function initPageTransitions() {
  // Before navigation — animate content out, then let Astro proceed
  document.addEventListener('astro:before-preparation', (e: any) => {
    // Don't block same-page hash links
    const from = new URL(e.from);
    const to = new URL(e.to);
    if (from.pathname === to.pathname) return;

    // Tell Astro to wait for our animation
    const originalLoader = e.loader;
    e.loader = async () => {
      await animateOut();
      await originalLoader();
    };
  });

  // After page loads — animate content in
  document.addEventListener('astro:page-load', () => {
    // Slight RAF delay so scroll-animations don't conflict
    requestAnimationFrame(() => {
      animateIn();
    });
  });
}
