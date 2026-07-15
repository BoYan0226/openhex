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
  { id: 'pale-yellow', fill: '#f5eaa6', delay: 0 },
  { id: 'footer-glass', fill: '#f6f4ee', delay: 60 },
] as const;

const PATH_NUMBER_PATTERN = /-?\d*\.?\d+/g;
const FIRST_SCREEN_INDEX = 0;
const SECOND_SCREEN_INDEX = 1;
const SCREEN_TOLERANCE = 0.16;
const BACK_SCREEN_TOLERANCE = 0.05;
const BACK_TRANSITION_ARM_MS = 80;
const BACK_TRANSITION_REENTRY_GUARD_MS = 280;
const TOUCH_TRANSITION_DELTA = 1;
const MOBILE_BREAKPOINT_PX = 767;

function compilePath(path: string) {
  const parts: string[] = [];
  const numbers: number[] = [];
  let lastIndex = 0;

  path.replace(PATH_NUMBER_PATTERN, (match, offset: number) => {
    parts.push(path.slice(lastIndex, offset));
    numbers.push(Number(match));
    lastIndex = offset + match.length;
    return match;
  });

  parts.push(path.slice(lastIndex));
  return { parts, numbers };
}

function formatPathNumber(value: number) {
  return value.toFixed(3).replace(/\.?0+$/, '');
}

function interpolateCompiledPath(
  from: ReturnType<typeof compilePath>,
  to: ReturnType<typeof compilePath>,
  progress: number
) {
  let result = '';

  for (let index = 0; index < from.parts.length; index += 1) {
    result += from.parts[index];

    if (index < from.numbers.length) {
      const current = from.numbers[index] ?? 0;
      const next = to.numbers[index] ?? current;
      result += formatPathNumber(current + (next - current) * progress);
    }
  }

  return result;
}

function power4In(value: number) {
  return value ** 4;
}

function power2In(value: number) {
  return value ** 2;
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
  const backTransitionArmedRef = useRef(false);
  const backTransitionTimerRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-landing-scroll-root]');
    const overlay = overlayRef.current;

    if (!root || !overlay || pathRefs.current.some(path => !path)) return undefined;

    let isDisposed = false;
    const getViewportHeight = () => root.clientHeight || window.innerHeight;
    const isMobileViewport = () => window.innerWidth <= MOBILE_BREAKPOINT_PX;
    const getScreenTop = (screenIndex: number) => screenIndex * getViewportHeight();
    const isNearScreen = (screenIndex: number) => {
      const tolerance = getViewportHeight() * SCREEN_TOLERANCE;
      return Math.abs(root.scrollTop - getScreenTop(screenIndex)) <= tolerance;
    };
    const isInBackTransitionRange = () => {
      const tolerance = getViewportHeight() * BACK_SCREEN_TOLERANCE;
      return Math.abs(root.scrollTop - getScreenTop(SECOND_SCREEN_INDEX)) <= tolerance;
    };
    const setOverlayVisible = (visible: boolean) => {
      overlay.style.opacity = visible ? '1' : '0';
    };

    const resetPaths = (direction: 'forward' | 'back') => {
      pathRefs.current.forEach(path => {
        if (!path) return;
        path.setAttribute(
          'd',
          direction === 'forward' ? PATHS.step1.unfilled : PATHS.step2.unfilled
        );
      });
    };

    const jumpToScreen = (screenIndex: number) => {
      root.scrollTo({ top: getScreenTop(screenIndex), behavior: 'auto' });
    };

    const restoreScroll = () => {
      root.style.overflowY = '';
      root.style.scrollSnapType = '';
      root.style.scrollBehavior = '';
    };

    const clearBackTransitionTimer = () => {
      if (backTransitionTimerRef.current !== null) {
        window.clearTimeout(backTransitionTimerRef.current);
        backTransitionTimerRef.current = null;
      }
    };

    const armBackTransition = (delay = BACK_TRANSITION_ARM_MS) => {
      if (backTransitionArmedRef.current || backTransitionTimerRef.current !== null) return;

      clearBackTransitionTimer();
      backTransitionArmedRef.current = false;
      backTransitionTimerRef.current = window.setTimeout(() => {
        backTransitionTimerRef.current = null;
        backTransitionArmedRef.current =
          !isAnimatingRef.current && isNearScreen(SECOND_SCREEN_INDEX);
      }, delay);
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
        const compiledFrom = compilePath(from);
        const compiledTo = compilePath(to);
        path.setAttribute('d', from);

        const tick = (now: number) => {
          if (isDisposed) {
            resolve();
            return;
          }

          const progress = Math.min((now - start) / duration, 1);
          path.setAttribute(
            'd',
            interpolateCompiledPath(compiledFrom, compiledTo, easing(progress))
          );

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
      await animatePath(path, PATHS.step1.unfilled, PATHS.step1.curve1, 420, power2In);
      await animatePath(path, PATHS.step1.curve1, PATHS.step1.filled, 100, value => value);
      if (shouldSwitch) {
        jumpToScreen(SECOND_SCREEN_INDEX);
      }
      await animatePath(path, PATHS.step2.filled, PATHS.step2.curve1, 100, sineIn);
      await animatePath(path, PATHS.step2.curve1, PATHS.step2.unfilled, 520, power4Out);
    };

    const unrevealLayer = async (path: SVGPathElement, delay: number, shouldSwitch: boolean) => {
      await wait(delay);
      await animatePath(path, PATHS.step2.unfilled, PATHS.step2.curve2, 420, power4In);
      await animatePath(path, PATHS.step2.curve2, PATHS.step2.filled, 100, value => value);
      if (shouldSwitch) {
        jumpToScreen(FIRST_SCREEN_INDEX);
      }
      await animatePath(path, PATHS.step1.filled, PATHS.step1.curve2, 100, sineIn);
      await animatePath(path, PATHS.step1.curve2, PATHS.step1.unfilled, 520, power4Out);
    };

    const runTransition = async (
      direction: 'forward' | 'back',
      options: { fromCurrent?: boolean } = {}
    ) => {
      if (isAnimatingRef.current) return;

      isAnimatingRef.current = true;
      root.style.overflowY = 'hidden';
      root.style.scrollSnapType = 'none';
      root.style.scrollBehavior = 'auto';
      if (direction === 'forward') {
        jumpToScreen(FIRST_SCREEN_INDEX);
      } else if (!options.fromCurrent) {
        jumpToScreen(SECOND_SCREEN_INDEX);
      }
      window.dispatchEvent(
        new CustomEvent('landing:path-transition-start', { detail: { direction } })
      );
      resetPaths(direction);
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
      if (direction === 'forward') {
        armBackTransition(BACK_TRANSITION_REENTRY_GUARD_MS);
      }
      window.dispatchEvent(
        new CustomEvent('landing:path-transition-complete', { detail: { direction } })
      );
    };

    const onWheel = (event: WheelEvent) => {
      if (isMobileViewport()) return;

      if (isAnimatingRef.current) {
        event.preventDefault();
        return;
      }

      if (event.deltaY > 0 && isNearScreen(FIRST_SCREEN_INDEX)) {
        event.preventDefault();
        void runTransition('forward');
        return;
      }

      if (event.deltaY < 0 && root.scrollTop <= 1) {
        event.preventDefault();
        return;
      }

      if (event.deltaY < 0 && isInBackTransitionRange()) return;
    };

    const onTouchStart = (event: TouchEvent) => {
      if (isMobileViewport()) return;

      touchStartYRef.current = event.touches[0]?.clientY ?? null;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (isMobileViewport()) return;

      if (isAnimatingRef.current) {
        event.preventDefault();
        return;
      }

      const startY = touchStartYRef.current;
      const currentY = event.touches[0]?.clientY;
      if (startY === null || currentY === undefined) return;

      const deltaY = startY - currentY;
      if (deltaY > 0 && isNearScreen(FIRST_SCREEN_INDEX)) {
        event.preventDefault();
        if (deltaY > TOUCH_TRANSITION_DELTA) {
          touchStartYRef.current = null;
          void runTransition('forward');
        }
        return;
      }

      if (
        deltaY < -TOUCH_TRANSITION_DELTA &&
        isInBackTransitionRange()
      ) {
        event.preventDefault();
        touchStartYRef.current = null;
        backTransitionArmedRef.current = false;
        void runTransition('back', { fromCurrent: true });
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (isMobileViewport()) return;

      if (isAnimatingRef.current) {
        event.preventDefault();
        return;
      }

      if (['ArrowDown', 'PageDown', ' ', 'Spacebar'].includes(event.key) && isNearScreen(FIRST_SCREEN_INDEX)) {
        event.preventDefault();
        void runTransition('forward');
        return;
      }

      if (['ArrowUp', 'PageUp'].includes(event.key) && isInBackTransitionRange()) {
        event.preventDefault();
        void runTransition('back', { fromCurrent: true });
      }
    };

    const onScroll = () => {
      if (isNearScreen(SECOND_SCREEN_INDEX)) {
        return;
      }

      clearBackTransitionTimer();
      backTransitionArmedRef.current = false;
    };

    const onScrollSettled = (event: Event) => {
      const settledTop = (event as CustomEvent<{ top?: number }>).detail?.top;
      if (settledTop === undefined) return;

      const screenTop = getScreenTop(SECOND_SCREEN_INDEX);
      const tolerance = getViewportHeight() * SCREEN_TOLERANCE;
      if (Math.abs(settledTop - screenTop) <= tolerance) {
        armBackTransition(BACK_TRANSITION_REENTRY_GUARD_MS);
        return;
      }

      clearBackTransitionTimer();
      backTransitionArmedRef.current = false;
    };

    const onBackRequest = (event: Event) => {
      if (isMobileViewport()) return;

      const detail = (
        event as CustomEvent<{
          force?: boolean;
          freshGesture?: boolean;
          fromCurrent?: boolean;
        }>
      ).detail;
      const shouldForce = Boolean(detail?.force);
      const freshGesture = Boolean(detail?.freshGesture);
      const fromCurrent = detail?.fromCurrent ?? shouldForce;

      if (
        shouldForce &&
        fromCurrent === false &&
        (!isNearScreen(SECOND_SCREEN_INDEX) ||
          (!freshGesture && !backTransitionArmedRef.current))
      ) {
        return;
      }

      if (!isAnimatingRef.current && (shouldForce || isNearScreen(SECOND_SCREEN_INDEX))) {
        backTransitionArmedRef.current = false;
        void runTransition('back', { fromCurrent });
      }
    };

    root.addEventListener('wheel', onWheel, { passive: false, capture: true });
    root.addEventListener('scroll', onScroll, { passive: true });
    root.addEventListener('touchstart', onTouchStart, { passive: true });
    root.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('landing:scroll-settled', onScrollSettled);
    window.addEventListener('landing:request-path-back', onBackRequest);

    return () => {
      isDisposed = true;
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
      clearBackTransitionTimer();
      root.removeEventListener('wheel', onWheel, { capture: true });
      root.removeEventListener('scroll', onScroll);
      root.removeEventListener('touchstart', onTouchStart);
      root.removeEventListener('touchmove', onTouchMove, { capture: true });
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('landing:scroll-settled', onScrollSettled);
      window.removeEventListener('landing:request-path-back', onBackRequest);
      restoreScroll();
    };
  }, []);

  return (
    <svg
      ref={overlayRef}
      className="scroll-path-transition-overlay pointer-events-none fixed inset-0 z-[9999] h-screen w-screen opacity-0"
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
