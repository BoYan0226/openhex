'use client';

import { useEffect, useRef } from 'react';
import { HONEYCOMB_LIGHT_STYLE, HONEYCOMB_STYLE } from '@/components/ui/textures';

const PATHS = {
  hidden: 'M 0 100 V 100 Q 50 100 100 100 V 100 z',
  curve: 'M 0 100 V 42 Q 50 -10 100 42 V 100 z',
  full: 'M 0 100 V 0 Q 50 0 100 0 V 100 z',
};

const PATH_NUMBER_PATTERN = /-?\d*\.?\d+/g;

function interpolatePath(from: string, to: string, progress: number) {
  const fromNumbers = from.match(PATH_NUMBER_PATTERN)?.map(Number) ?? [];
  const toNumbers = to.match(PATH_NUMBER_PATTERN)?.map(Number) ?? [];
  let index = 0;

  return from.replace(PATH_NUMBER_PATTERN, () => {
    const current = fromNumbers[index] ?? 0;
    const next = toNumbers[index] ?? current;
    index += 1;
    return (current + (next - current) * progress).toFixed(3).replace(/\.?0+$/, '');
  });
}

function easeOutQuart(value: number) {
  return 1 - (1 - value) ** 4;
}

function getPathForProgress(progress: number) {
  if (progress < 0.58) {
    return interpolatePath(PATHS.hidden, PATHS.curve, easeOutQuart(progress / 0.58));
  }

  return interpolatePath(PATHS.curve, PATHS.full, easeOutQuart((progress - 0.58) / 0.42));
}

export function PathTransitionSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const path = pathRef.current;
    const root = document.querySelector<HTMLElement>('[data-landing-scroll-root]');

    if (!section || !path || !root) return undefined;

    const update = () => {
      const viewportHeight = root.clientHeight || window.innerHeight;
      const rawProgress = (root.scrollTop - section.offsetTop + viewportHeight * 0.16) / viewportHeight;
      const progress = Math.min(Math.max(rawProgress, 0), 1);
      path.setAttribute('d', getPathForProgress(progress));
    };

    const requestUpdate = () => {
      if (frameRef.current !== null) return;

      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        update();
      });
    };

    update();
    root.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
      root.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen snap-start overflow-hidden bg-night"
      aria-hidden="true"
    >
      <div className="absolute inset-0" style={HONEYCOMB_STYLE} />
      <div className="absolute inset-x-0 bottom-0 h-[58vh] bg-paper" style={HONEYCOMB_LIGHT_STYLE} />
      <div className="absolute left-1/2 top-1/2 h-[420px] w-[820px] max-w-[94vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-honey/20 blur-[140px]" />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        focusable="false"
      >
        <path ref={pathRef} d={PATHS.hidden} fill="var(--color-paper)" />
      </svg>
      <div className="absolute inset-x-0 bottom-0 h-[58vh]" style={HONEYCOMB_LIGHT_STYLE} />
    </section>
  );
}
