// ---------------------------------------------------------------------------
// Lenis smooth-scroll for the public website. Native scrolling is intentionally
// left untouched in the client portal and admin (where dense, fast scrolling is
// preferable). Disabled for prefers-reduced-motion users and on touch-heavy
// mobile where native scrolling is better for battery/latency.
// ---------------------------------------------------------------------------
import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useSmoothScroll(enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    if (reduce || coarse) return;

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
    });

    // Keep GSAP ScrollTrigger animations in sync with Lenis.
    lenis.on('scroll', ScrollTrigger.update);

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.off('scroll', ScrollTrigger.update);
      lenis.destroy();
    };
  }, [enabled]);
}
