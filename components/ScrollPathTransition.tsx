'use client';

import { useEffect, useRef } from 'react';

const TRANSITION_PATHS = {
  step1: {
    unfilled: 'M 0 100 V 100 Q 50 100 100 100 V 100 z',
    curve: 'M 0 100 V 50 Q 50 0 100 50 V 100 z',
    filled: 'M 0 100 V 0 Q 50 0 100 0 V 100 z',
  },
  step2: {
    filled: 'M 0 0 V 100 Q 50 100 100 100 V 0 z',
    curveForward: 'M 0 0 V 50 Q 50 0 100 50 V 0 z',
    curveBack: 'M 0 0 V 50 Q 50 100 100 50 V 0 z',
    unfilled: 'M 0 0 V 0 Q 50 0 100 0 V 0 z',
  },
};

const FIRST_SCREEN_INDEX = 0;
const SECOND_SCREEN_INDEX = 1;
const SCROLL_EDGE_TOLERANCE = 0.12;
const SCROLL_BOUNDARY_RATIO = 0.42;
const MID_SCROLL_TOLERANCE_PX = 8;
const PATH_NUMBER_PATTERN = /-?\d*\.?\d+/g;

const ease = {
  linear: (value: number) => value,
  power4In: (value: number) => value ** 4,
  power4Out: (value: number) => 1 - (1 - value) ** 4,
  sineIn: (value: number) => 1 - Math.cos((value * Math.PI) / 2),
};

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

export function ScrollPathTransition() {
  const overlayRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isAnimatingRef = useRef(false);
  const touchStartYRef = useRef<number | null>(null);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-landing-scroll-root]');
    const overlay = overlayRef.current;
    const overlayPath = pathRef.current;

    if (!root || !overlay || !overlayPath) return undefined;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return undefined;

    let isDisposed = false;
    let lastScrollTop = root.scrollTop;

    const getViewportHeight = () => root.clientHeight || window.innerHeight;
    const getScreenTop = (screenIndex: number) => screenIndex * getViewportHeight();
    const isNearScreen = (screenIndex: number) => {
      const tolerance = getViewportHeight() * SCROLL_EDGE_TOLERANCE;
      return Math.abs(root.scrollTop - getScreenTop(screenIndex)) <= tolerance;
    };
    const isInsideFirstTransitionRange = () => {
      const viewportHeight = getViewportHeight();
      return (
        root.scrollTop > MID_SCROLL_TOLERANCE_PX &&
        root.scrollTop < viewportHeight - MID_SCROLL_TOLERANCE_PX
      );
    };
    const isInsideFirstTwoScreens = () => {
      const viewportHeight = getViewportHeight();
      return root.scrollTop >= 0 && root.scrollTop <= viewportHeight + MID_SCROLL_TOLERANCE_PX;
    };

    const restoreScroll = () => {
      root.style.overflowY = '';
      root.style.scrollSnapType = '';
      root.style.scrollBehavior = '';
    };

    const jumpToScreen = (screenIndex: number) => {
      root.scrollTo({ top: getScreenTop(screenIndex), behavior: 'auto' });
    };

    const setOverlayVisible = (visible: boolean) => {
      overlay.style.opacity = visible ? '1' : '0';
    };

    const animatePath = (
      from: string,
      to: string,
      duration: number,
      easing: (value: number) => number
    ) =>
      new Promise<void>(resolve => {
        const start = performance.now();
        overlayPath.setAttribute('d', from);

        const tick = (now: number) => {
          if (isDisposed) {
            resolve();
            return;
          }

          const progress = Math.min((now - start) / duration, 1);
          overlayPath.setAttribute('d', interpolatePath(from, to, easing(progress)));

          if (progress < 1) {
            animationFrameRef.current = window.requestAnimationFrame(tick);
            return;
          }

          resolve();
        };

        animationFrameRef.current = window.requestAnimationFrame(tick);
      });

    const runTransition = async (direction: 'forward' | 'back') => {
      if (isAnimatingRef.current) return;

      isAnimatingRef.current = true;
      root.style.overflowY = 'hidden';
      root.style.scrollSnapType = 'none';
      root.style.scrollBehavior = 'auto';

      const goingForward = direction === 'forward';
      jumpToScreen(goingForward ? FIRST_SCREEN_INDEX : SECOND_SCREEN_INDEX);
      overlay.style.setProperty(
        '--landing-transition-fill',
        goingForward ? 'var(--color-paper)' : 'var(--color-night)'
      );
      setOverlayVisible(true);

      if (goingForward) {
        await animatePath(
          TRANSITION_PATHS.step1.unfilled,
          TRANSITION_PATHS.step1.curve,
          680,
          ease.power4In
        );
        await animatePath(
          TRANSITION_PATHS.step1.curve,
          TRANSITION_PATHS.step1.filled,
          180,
          ease.linear
        );
        jumpToScreen(SECOND_SCREEN_INDEX);
        await animatePath(
          TRANSITION_PATHS.step2.filled,
          TRANSITION_PATHS.step2.curveForward,
          180,
          ease.sineIn
        );
        await animatePath(
          TRANSITION_PATHS.step2.curveForward,
          TRANSITION_PATHS.step2.unfilled,
          760,
          ease.power4Out
        );
      } else {
        await animatePath(
          TRANSITION_PATHS.step2.unfilled,
          TRANSITION_PATHS.step2.curveBack,
          680,
          ease.power4In
        );
        await animatePath(
          TRANSITION_PATHS.step2.curveBack,
          TRANSITION_PATHS.step2.filled,
          180,
          ease.linear
        );
        jumpToScreen(FIRST_SCREEN_INDEX);
        await animatePath(
          TRANSITION_PATHS.step1.filled,
          TRANSITION_PATHS.step1.curve,
          180,
          ease.sineIn
        );
        await animatePath(
          TRANSITION_PATHS.step1.curve,
          TRANSITION_PATHS.step1.unfilled,
          760,
          ease.power4Out
        );
      }

      setOverlayVisible(false);
      restoreScroll();
      lastScrollTop = root.scrollTop;
      isAnimatingRef.current = false;
    };

    const shouldInterceptForward = () =>
      isNearScreen(FIRST_SCREEN_INDEX) || isInsideFirstTransitionRange();
    const shouldInterceptBack = () =>
      isNearScreen(SECOND_SCREEN_INDEX) || isInsideFirstTransitionRange();

    const onWheel = (event: WheelEvent) => {
      if (isAnimatingRef.current) {
        event.preventDefault();
        return;
      }

      if (event.deltaY > 0 && isInsideFirstTwoScreens() && shouldInterceptForward()) {
        event.preventDefault();
        void runTransition('forward');
        return;
      }

      if (event.deltaY < 0 && isInsideFirstTwoScreens() && shouldInterceptBack()) {
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
      if (deltaY > 24 && isInsideFirstTwoScreens() && shouldInterceptForward()) {
        event.preventDefault();
        touchStartYRef.current = null;
        void runTransition('forward');
        return;
      }

      if (deltaY < -24 && isInsideFirstTwoScreens() && shouldInterceptBack()) {
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

      const forwardKeys = ['ArrowDown', 'PageDown', ' ', 'Spacebar'];
      const backKeys = ['ArrowUp', 'PageUp'];

      if (forwardKeys.includes(event.key) && shouldInterceptForward()) {
        event.preventDefault();
        void runTransition('forward');
        return;
      }

      if (backKeys.includes(event.key) && shouldInterceptBack()) {
        event.preventDefault();
        void runTransition('back');
      }
    };

    const onScroll = () => {
      if (isAnimatingRef.current) return;

      const viewportHeight = getViewportHeight();
      const currentScrollTop = root.scrollTop;
      const forwardBoundary = viewportHeight * SCROLL_BOUNDARY_RATIO;
      const backBoundary = viewportHeight * (1 + SCROLL_BOUNDARY_RATIO);
      const direction = currentScrollTop >= lastScrollTop ? 'forward' : 'back';

      if (isInsideFirstTransitionRange()) {
        void runTransition(direction);
        return;
      }

      if (lastScrollTop < forwardBoundary && currentScrollTop >= forwardBoundary) {
        void runTransition('forward');
        return;
      }

      if (lastScrollTop > backBoundary && currentScrollTop <= backBoundary) {
        void runTransition('back');
        return;
      }

      lastScrollTop = currentScrollTop;
    };

    root.addEventListener('wheel', onWheel, { passive: false, capture: true });
    root.addEventListener('scroll', onScroll, { passive: true });
    root.addEventListener('touchstart', onTouchStart, { passive: true });
    root.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      isDisposed = true;
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      root.removeEventListener('wheel', onWheel, { capture: true });
      root.removeEventListener('scroll', onScroll);
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
      <path
        ref={pathRef}
        className="fill-[var(--landing-transition-fill,var(--color-paper))]"
        d={TRANSITION_PATHS.step1.unfilled}
      />
    </svg>
  );
}
