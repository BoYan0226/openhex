'use client';

import { useEffect, useRef } from 'react';
import { HONEYCOMB_STYLE } from '@/components/ui/textures';

const PATHS = {
  hidden: 'M 0 100 V 100 Q 50 100 100 100 V 100 z',
  curve: 'M 0 100 V 46 Q 50 -16 100 46 V 100 z',
  full: 'M 0 100 V 0 Q 50 0 100 0 V 100 z',
  exitCurve: 'M 0 0 V 58 Q 50 116 100 58 V 0 z',
  exitHidden: 'M 0 0 V 0 Q 50 0 100 0 V 0 z',
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
  const hasPlayedRef = useRef(false);

  useEffect(() => {
    const section = sectionRef.current;
    const path = pathRef.current;
    const root = document.querySelector<HTMLElement>('[data-landing-scroll-root]');

    if (!section || !path || !root) return undefined;

    let isDisposed = false;

    const getViewportHeight = () => root.clientHeight || window.innerHeight;

    const scrollToHero = () => {
      root.scrollTo({ top: section.offsetTop + getViewportHeight(), behavior: 'smooth' });
    };

    const animatePath = (
      from: string,
      to: string,
      duration: number,
      easing: (value: number) => number
    ) =>
      new Promise<void>(resolve => {
        const start = performance.now();
        path.setAttribute('d', from);

        const tick = (now: number) => {
          if (isDisposed) {
            resolve();
            return;
          }

          const progress = Math.min((now - start) / duration, 1);
          path.setAttribute('d', interpolatePath(from, to, easing(progress)));

          if (progress < 1) {
            frameRef.current = window.requestAnimationFrame(tick);
            return;
          }

          resolve();
        };

        frameRef.current = window.requestAnimationFrame(tick);
      });

    const playTransition = async () => {
      if (hasPlayedRef.current) return;

      hasPlayedRef.current = true;
      root.style.scrollSnapType = 'none';
      root.style.overflowY = 'hidden';
      root.style.scrollBehavior = 'auto';

      await animatePath(PATHS.hidden, PATHS.curve, 650, value => value ** 4);
      await animatePath(PATHS.curve, PATHS.full, 220, value => value);
      await new Promise(resolve => window.setTimeout(resolve, 90));
      scrollToHero();
      await animatePath(PATHS.full, PATHS.exitCurve, 210, value => 1 - Math.cos((value * Math.PI) / 2));
      await animatePath(PATHS.exitCurve, PATHS.exitHidden, 720, easeOutQuart);

      root.style.overflowY = '';
      root.style.scrollSnapType = '';
      root.style.scrollBehavior = '';
    };

    const requestUpdate = () => {
      if (frameRef.current !== null) return;

      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        const viewportHeight = getViewportHeight();
        const distanceFromSection = Math.abs(root.scrollTop - section.offsetTop);

        if (distanceFromSection < viewportHeight * 0.35) {
          void playTransition();
        } else if (root.scrollTop < section.offsetTop - viewportHeight * 0.6) {
          hasPlayedRef.current = false;
          path.setAttribute('d', PATHS.hidden);
        }
      });
    };

    path.setAttribute('d', PATHS.hidden);
    root.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
      isDisposed = true;
      root.style.overflowY = '';
      root.style.scrollSnapType = '';
      root.style.scrollBehavior = '';
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
      <div className="absolute left-1/2 top-1/2 h-[420px] w-[820px] max-w-[94vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-honey/18 blur-[140px]" />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        focusable="false"
      >
        <path ref={pathRef} d={PATHS.hidden} fill="var(--color-paper)" />
      </svg>
    </section>
  );
}
