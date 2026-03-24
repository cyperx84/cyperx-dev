/**
 * GSAP ScrollTrigger animations — replaces the old IntersectionObserver reveal system.
 * Syncs with Lenis for butter-smooth scroll-triggered animations.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Connect Lenis to ScrollTrigger
export function connectLenis(lenis: any) {
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time: number) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);
}

// Kill all ScrollTrigger instances (for page transitions)
export function killScrollAnimations() {
  ScrollTrigger.getAll().forEach(st => st.kill());
}

// ── Main init ──
export function initScrollAnimations() {
  // Kill previous triggers (Astro page transitions)
  killScrollAnimations();

  // Small delay to let DOM settle after transition
  requestAnimationFrame(() => {
    initReveals();
    initSplitHeadings();
    initParallaxHeroes();
    initStaggerCards();
    ScrollTrigger.refresh();
  });
}

// ── Scroll reveal for [data-reveal] elements ──
function initReveals() {
  const isExtreme = document.documentElement.classList.contains('theme-extreme');
  const allReveals = document.querySelectorAll<HTMLElement>('[data-reveal]');

  allReveals.forEach((el) => {
    // Skip elements inside hidden variants
    const parent = el.closest('.variant-dark, .variant-light, .variant-extreme');
    if (parent && getComputedStyle(parent).display === 'none') return;
    if (el.dataset.gsapDone) return;

    const variant = el.dataset.reveal || 'slide-up';

    let fromVars: gsap.TweenVars = { opacity: 0, y: 50, duration: 0.8 };

    if (variant === 'slide-left') {
      fromVars = { opacity: 0, x: -60, duration: 0.8 };
    } else if (variant === 'slide-right') {
      fromVars = { opacity: 0, x: 60, duration: 0.8 };
    } else if (variant === 'scale') {
      fromVars = { opacity: 0, scale: 0.85, duration: 0.8 };
    }

    gsap.from(el, {
      ...fromVars,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        toggleActions: 'play none none none',
        once: true,
      },
      onComplete: () => {
        el.dataset.gsapDone = '1';
        if (isExtreme) {
          el.classList.add('reveal-glitch');
          setTimeout(() => el.classList.remove('reveal-glitch'), 300);
        }
      },
    });
  });
}

// ── Split text headings — character-by-character reveal ──
function initSplitHeadings() {
  const headings = document.querySelectorAll<HTMLElement>('[data-split-text]');

  headings.forEach((heading) => {
    if (heading.dataset.splitDone) return;
    heading.dataset.splitDone = '1';

    const text = heading.textContent || '';
    heading.textContent = '';
    heading.style.overflow = 'hidden';

    // Create spans for each character
    const chars: HTMLSpanElement[] = [];
    for (const char of text) {
      const span = document.createElement('span');
      span.textContent = char === ' ' ? '\u00A0' : char;
      span.style.display = 'inline-block';
      heading.appendChild(span);
      chars.push(span);
    }

    gsap.from(chars, {
      opacity: 0,
      y: 40,
      rotateX: -60,
      stagger: 0.025,
      duration: 0.6,
      ease: 'back.out(1.5)',
      scrollTrigger: {
        trigger: heading,
        start: 'top 85%',
        toggleActions: 'play none none none',
        once: true,
      },
    });
  });
}

// ── Parallax heroes — smooth GSAP-driven parallax ──
function initParallaxHeroes() {
  const heroes = document.querySelectorAll<HTMLElement>('.parallax-hero, .shard-hero');

  heroes.forEach((hero) => {
    gsap.to(hero, {
      y: 80,
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: 1.5,
      },
    });
  });
}

// ── Stagger card grids — cards animate in sequence ──
function initStaggerCards() {
  const grids = document.querySelectorAll<HTMLElement>('[data-stagger-grid]');

  grids.forEach((grid) => {
    const cards = grid.children;
    if (!cards.length) return;

    gsap.from(cards, {
      opacity: 0,
      y: 40,
      scale: 0.95,
      stagger: 0.12,
      duration: 0.7,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: grid,
        start: 'top 85%',
        toggleActions: 'play none none none',
        once: true,
      },
    });
  });
}
