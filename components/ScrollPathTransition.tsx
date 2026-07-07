'use client';

import { useEffect, useRef } from 'react';

const PATHS = {
  hiddenFromBottom: 'M 0 100 V 100 Q 50 100 100 100 V 100 z',
  enterCurve: 'M 0 100 V 48 Q 50 -18 100 48 V 100 z',
  fullFromBottom: 'M 0 100 V 0 Q 50 0 100 0 V 100 z',
  fullFromTop: 'M 0 0 V 100 Q 50 100 100 100 V 0 z',
  exitCurve: 'M 0 0 V 52 Q 50 118 100 52 V 0 z',
  hiddenFromTop: 'M 0 0 V 0 Q 50 0 100 0 V 0 z',
};

const PATH_NUMBER_PATTERN = /-?\d*\.?\d+/g;
const TRANSITION_LAYERS = [
  { id: 'yellow', fill: '#ffde4a', start: 0, end: 0.82 },
  { id: 'ink', fill: '#202124', start: 0.1, end: 0.92 },
  { id: 'paper', fill: '#fbf7ee', start: 0.2, end: 1 },
] as const;

function clamp(value: number, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

function easeOutQuart(value: number) {
  return 1 - (1 - value) ** 4;
}

function easeInQuart(value: number) {
  return value ** 4;
}

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

function segment(progress: number, start: number, end: number) {
  return clamp((progress - start) / (end - start));
}

function remapProgress(progress: number, start: number, end: number) {
  return clamp((progress - start) / (end - start));
}

function getPathForProgress(progress: number) {
  if (progress < 0.46) {
    return interpolatePath(
      PATHS.hiddenFromBottom,
      PATHS.enterCurve,
      easeInQuart(segment(progress, 0, 0.46))
    );
  }

  if (progress < 0.62) {
    return interpolatePath(
      PATHS.enterCurve,
      PATHS.fullFromBottom,
      easeOutQuart(segment(progress, 0.46, 0.62))
    );
  }

  if (progress < 0.72) {
    return PATHS.fullFromTop;
  }

  if (progress < 0.84) {
    return interpolatePath(
      PATHS.fullFromTop,
      PATHS.exitCurve,
      segment(progress, 0.72, 0.84)
    );
  }

  return interpolatePath(
    PATHS.exitCurve,
    PATHS.hiddenFromTop,
    easeOutQuart(segment(progress, 0.84, 1))
  );
}

export function ScrollPathTransition() {
  const overlayRef = useRef<SVGSVGElement>(null);
  const pathRefs = useRef<Array<SVGPathElement | null>>([]);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-landing-scroll-root]');
    const overlay = overlayRef.current;

    if (!root || !overlay || pathRefs.current.some(path => !path)) return undefined;

    const update = () => {
      const viewportHeight = root.clientHeight || window.innerHeight;
      const progress = clamp(root.scrollTop / viewportHeight);
      const isActive = progress > 0.015 && progress < 0.985;

      overlay.style.opacity = isActive ? '1' : '0';
      TRANSITION_LAYERS.forEach((layer, index) => {
        pathRefs.current[index]?.setAttribute(
          'd',
          getPathForProgress(remapProgress(progress, layer.start, layer.end))
        );
      });
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
    <svg
      ref={overlayRef}
      className="pointer-events-none fixed inset-0 z-[9999] h-screen w-screen opacity-0"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {TRANSITION_LAYERS.map((layer, index) => (
        <path
          key={layer.id}
          ref={node => {
            pathRefs.current[index] = node;
          }}
          d={PATHS.hiddenFromBottom}
          fill={layer.fill}
        />
      ))}
    </svg>
  );
}
