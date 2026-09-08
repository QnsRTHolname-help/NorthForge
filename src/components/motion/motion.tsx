// ---------------------------------------------------------------------------
// NorthForge motion primitives — one coherent motion architecture built on
// GSAP + ScrollTrigger. Public surfaces use these; portal/admin stay native.
//
// Every primitive:
//   * respects prefers-reduced-motion
//   * cleans up its own tweens / ScrollTriggers
//   * never hides content if the browser can't run animation safely
// ---------------------------------------------------------------------------
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { cx } from '@/utils/format';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

export function useMobileDevice(): boolean {
  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    const onChange = () => setMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return mobile;
}

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
  as?: 'div' | 'section' | 'span' | 'li';
}

/**
 * Fade + rise a block into view when it enters the viewport.
 * Default: plays once, requires content to remain accessible if motion is off.
 */
export function ScrollReveal({ children, className, delay = 0, y = 26, once = true, as = 'div' }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const Tag = as as any;

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(el,
        { autoAlpha: 0, y },
        {
          autoAlpha: 1, y: 0, duration: 0.85, delay, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once },
        }
      );
    }, ref);
    return () => ctx.revert();
  }, [reduced, delay, y, once]);

  return (
    <Tag ref={ref} className={cx(reduced ? '' : 'will-change-transform', className)}>
      {children}
    </Tag>
  );
}

interface StaggerRevealProps {
  items: ReactNode[];
  className?: string;
  itemClassName?: string;
  delay?: number;
  stagger?: number;
  y?: number;
}

/** Reveals a list of children one after another as the container scrolls in. */
export function StaggerReveal({ items, className, itemClassName, delay = 0, stagger = 0.1, y = 22 }: StaggerRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const stable = useCallback(() => items, [items]);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const children = Array.from(el.children);
    const ctx = gsap.context(() => {
      gsap.set(children, { autoAlpha: 0, y });
      gsap.to(children, {
        autoAlpha: 1, y: 0, duration: 0.7, stagger, delay, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      });
    }, ref);
    return () => ctx.revert();
  }, [reduced, delay, stagger, y, stable]);

  return (
    <div ref={ref} className={className}>
      {items.map((item, i) => (
        <div key={i} className={itemClassName}>{item}</div>
      ))}
    </div>
  );
}

interface ParallaxProps {
  children: ReactNode;
  className?: string;
  /** Positive speed moves slower than scroll; negative moves faster. Keep small. */
  speed?: number;
}

/** Subtle scroll parallax. Disabled on touch + reduced motion. */
export function Parallax({ children, className, speed = 12 }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const mobile = useMobileDevice();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || mobile) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(el, { y: speed }, {
        y: -speed, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
      });
    }, ref);
    return () => ctx.revert();
  }, [reduced, mobile, speed]);

  return (
    <div ref={ref} className={cx(reduced || mobile ? '' : 'will-change-transform', className)}>
      {children}
    </div>
  );
}

interface AnimatedCounterProps {
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

/** Counts from 0 to `value` when scrolled into view. */
export function AnimatedCounter({ value, className, prefix = '', suffix = '', decimals = 0 }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced) {
      el.textContent = `${prefix}${value.toLocaleString('en-IN', { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}${suffix}`;
      return;
    }
    const obj = { v: 0 };
    const ctx = gsap.context(() => {
      gsap.to(obj, {
        v: value, duration: 1.4, ease: 'power2.out',
        onUpdate: () => {
          el.textContent = `${prefix}${obj.v.toLocaleString('en-IN', { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}${suffix}`;
        },
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    }, ref);
    return () => ctx.revert();
  }, [value, prefix, suffix, decimals, reduced]);

  return <span ref={ref} className={className}>{prefix}0{suffix}</span>;
}

interface MarqueeProps {
  children: ReactNode;
  className?: string;
  speed?: number;
  decorative?: boolean;
}

/** CSS-driven seamless marquee. Lightweight, safe under reduced motion. */
export function Marquee({ children, className, speed = 28, decorative = false }: MarqueeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const strip = el.querySelector('[data-marquee-strip]') as HTMLElement | null;
    if (!strip) return;
    const distance = strip.scrollWidth / 2;
    const tween = gsap.to(strip, {
      x: -distance,
      duration: distance / speed,
      ease: 'none',
      repeat: -1,
    });
    return () => { tween.kill(); };
  }, [reduced, speed]);

  return (
    <div ref={ref} className={cx('overflow-hidden', className)} aria-hidden={decorative ? true : undefined}>
      <div className="flex w-max whitespace-nowrap" data-marquee-strip>
        <div className="flex items-center" aria-hidden="true">{children}</div>
        <div className="flex items-center" aria-hidden="true">{children}</div>
      </div>
    </div>
  );
}

interface ScrollProgressProps {
  className?: string;
}

/** Thin fixed progress bar tied to page scroll. */
export function ScrollProgress({ className }: ScrollProgressProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const ctx = gsap.context(() => {
      gsap.set(el, { scaleX: 0, transformOrigin: 'left center' });
      gsap.to(el, {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: { trigger: document.documentElement, start: 'top top', end: 'bottom bottom', scrub: 0.3 },
      });
    }, ref);
    return () => ctx.revert();
  }, [reduced]);

  if (reduced) return null;
  return <div ref={ref} className={cx('fixed top-0 left-0 right-0 z-[90] h-0.5 bg-gradient-to-r from-brand to-clay-violet', className)} />;
}
