'use client';

import { useEffect, useRef } from 'react';

const PATHS = {
  step1: {
    unfilled: 'M 0 100 V 100 Q 50 100 100 100 V 100 z',
    curve1: 'M 0 100 V 50 Q 50 0 100 50 V 100 z',
    curve2: 'M 0 100 V 50 Q 50 100 100 50 V 100 z',
    filled: 'M 0 100 V 0 Q 50 0 100 0 V 100 z',
  },
  step2: {
    filled: 'M 0 0 V 100 Q 50 100 100 100 V 0 z',
    curve1: 'M 0 0 V 50 Q 50 0 100 50 V 0 z',
    curve2: 'M 0 0 V 50 Q 50 100 100 50 V 0 z',
    unfilled: 'M 0 0 V 0 Q 50 0 100 0 V 0 z',
  },
};

const TRANSITION_LAYERS = [
  { id: 'yellow', fill: '#ffde4a', delay: 0 },
  { id: 'ink', fill: '#202124', delay: 120 },
] as const;

const PATH_NUMBER_PATTERN = /-?\d*\.?\d+/g;
const FIRST_SCREEN_INDEX = 0;
const SECOND_SCREEN_INDEX = 1;
const SCREEN_TOLERANCE = 0.16;

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

function power4In(value: number) {
  return value ** 4;
}

function power4Out(value: number) {
  return 1 - (1 - value) ** 4;
}

function sineIn(value: number) {
  return 1 - Math.cos((value * Math.PI) / 2);
}

function wait(ms: number) {
  return new Promise(resolve => window.setTimeout(resolve, ms));
}

export function ScrollPathTransition() {
  const overlayRef = useRef<SVGSVGElement>(null);
  const pathRefs = useRef<Array<SVGPathElement | null>>([]);
  const frameRef = useRef<number | null>(null);
  const isAnimatingRef = useRef(false);
  const touchStartYRef = useRef<number | null>(null);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-landing-scroll-root]');
    const overlay = overlayRef.current;

    if (!root || !overlay || pathRefs.current.some(path => !path)) return undefined;

    let isDisposed = false;

    const getViewportHeight = () => root.clientHeight || window.innerHeight;
    const getScreenTop = (screenIndex: number) => screenIndex * getViewportHeight();
    const isNearScreen = (screenIndex: number) => {
      const tolerance = getViewportHeight() * SCREEN_TOLERANCE;
      return Math.abs(root.scrollTop - getScreenTop(screenIndex)) <= tolerance;
    };

    const setOverlayVisible = (visible: boolean) => {
      overlay.style.opacity = visible ? '1' : '0';
    };

    const jumpToScreen = (screenIndex: number) => {
      root.scrollTo({ top: getScreenTop(screenIndex), behavior: 'auto' });
    };

    const restoreScroll = () => {
      root.style.overflowY = '';
      root.style.scrollSnapType = '';
      root.style.scrollBehavior = '';
    };

    const animatePath = (
      path: SVGPathElement,
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

    const revealLayer = async (path: SVGPathElement, delay: number, shouldSwitch: boolean) => {
      await wait(delay);
      await animatePath(path, PATHS.step1.unfilled, PATHS.step1.curve1, 800, power4In);
      await animatePath(path, PATHS.step1.curve1, PATHS.step1.filled, 200, value => value);
      if (shouldSwitch) {
        jumpToScreen(SECOND_SCREEN_INDEX);
      }
      await animatePath(path, PATHS.step2.filled, PATHS.step2.curve1, 200, sineIn);
      await animatePath(path, PATHS.step2.curve1, PATHS.step2.unfilled, 1000, power4Out);
    };

    const unrevealLayer = async (path: SVGPathElement, delay: number, shouldSwitch: boolean) => {
      await wait(delay);
      await animatePath(path, PATHS.step2.unfilled, PATHS.step2.curve2, 800, power4In);
      await animatePath(path, PATHS.step2.curve2, PATHS.step2.filled, 200, value => value);
      if (shouldSwitch) {
        jumpToScreen(FIRST_SCREEN_INDEX);
      }
      await animatePath(path, PATHS.step1.filled, PATHS.step1.curve2, 200, sineIn);
      await animatePath(path, PATHS.step1.curve2, PATHS.step1.unfilled, 1000, power4Out);
    };

    const runTransition = async (direction: 'forward' | 'back') => {
      if (isAnimatingRef.current) return;

      isAnimatingRef.current = true;
      root.style.overflowY = 'hidden';
      root.style.scrollSnapType = 'none';
      root.style.scrollBehavior = 'auto';
      jumpToScreen(direction === 'forward' ? FIRST_SCREEN_INDEX : SECOND_SCREEN_INDEX);
      setOverlayVisible(true);

      const layerTasks = TRANSITION_LAYERS.map((layer, index) => {
        const path = pathRefs.current[index];
        if (!path) return Promise.resolve();

        return direction === 'forward'
          ? revealLayer(path, layer.delay, index === TRANSITION_LAYERS.length - 1)
          : unrevealLayer(path, layer.delay, index === TRANSITION_LAYERS.length - 1);
      });

      await Promise.all(layerTasks);
      setOverlayVisible(false);
      restoreScroll();
      isAnimatingRef.current = false;
    };

    const onWheel = (event: WheelEvent) => {
      if (isAnimatingRef.current) {
        event.preventDefault();
        return;
      }

      if (event.deltaY > 0 && isNearScreen(FIRST_SCREEN_INDEX)) {
        event.preventDefault();
        void runTransition('forward');
        return;
      }

      if (event.deltaY < 0 && isNearScreen(SECOND_SCREEN_INDEX)) {
        event.preventDefault();
        void runTransition('back');
      }
    };

    const onTouchStart = (event: TouchEvent) => {
      touchStartYRef.current = event.touches[0]?.clientY ?? null;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (isAnimatingRef.current) {
        event.preventDefault();
        return;
      }

      const startY = touchStartYRef.current;
      const currentY = event.touches[0]?.clientY;
      if (startY === null || currentY === undefined) return;

      const deltaY = startY - currentY;
      if (deltaY > 24 && isNearScreen(FIRST_SCREEN_INDEX)) {
        event.preventDefault();
        touchStartYRef.current = null;
        void runTransition('forward');
        return;
      }

      if (deltaY < -24 && isNearScreen(SECOND_SCREEN_INDEX)) {
        event.preventDefault();
        touchStartYRef.current = null;
        void runTransition('back');
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (isAnimatingRef.current) {
        event.preventDefault();
        return;
      }

      if (['ArrowDown', 'PageDown', ' ', 'Spacebar'].includes(event.key) && isNearScreen(FIRST_SCREEN_INDEX)) {
        event.preventDefault();
        void runTransition('forward');
        return;
      }

      if (['ArrowUp', 'PageUp'].includes(event.key) && isNearScreen(SECOND_SCREEN_INDEX)) {
        event.preventDefault();
        void runTransition('back');
      }
    };

    root.addEventListener('wheel', onWheel, { passive: false, capture: true });
    root.addEventListener('touchstart', onTouchStart, { passive: true });
    root.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      isDisposed = true;
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
      root.removeEventListener('wheel', onWheel, { capture: true });
      root.removeEventListener('touchstart', onTouchStart);
      root.removeEventListener('touchmove', onTouchMove, { capture: true });
      window.removeEventListener('keydown', onKeyDown);
      restoreScroll();
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
          d={PATHS.step1.unfilled}
          fill={layer.fill}
        />
      ))}
    </svg>
  );
}
