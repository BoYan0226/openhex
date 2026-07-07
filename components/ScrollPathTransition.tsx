'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

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

export function ScrollPathTransition() {
  const overlayRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const isAnimatingRef = useRef(false);
  const touchStartYRef = useRef<number | null>(null);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-landing-scroll-root]');
    const overlay = overlayRef.current;
    const overlayPath = pathRef.current;

    if (!root || !overlay || !overlayPath) return undefined;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return undefined;

    const getViewportHeight = () => root.clientHeight || window.innerHeight;
    const getScreenTop = (screenIndex: number) => screenIndex * getViewportHeight();
    const isNearScreen = (screenIndex: number) => {
      const tolerance = getViewportHeight() * SCROLL_EDGE_TOLERANCE;
      return Math.abs(root.scrollTop - getScreenTop(screenIndex)) <= tolerance;
    };

    const restoreScroll = () => {
      root.style.overflowY = '';
      root.style.scrollSnapType = '';
    };

    const jumpToScreen = (screenIndex: number) => {
      root.scrollTo({ top: getScreenTop(screenIndex), behavior: 'auto' });
    };

    const runTransition = (direction: 'forward' | 'back') => {
      if (isAnimatingRef.current) return;

      isAnimatingRef.current = true;
      root.style.overflowY = 'hidden';
      root.style.scrollSnapType = 'none';

      const goingForward = direction === 'forward';
      overlay.style.setProperty(
        '--landing-transition-fill',
        goingForward ? 'var(--color-paper)' : 'var(--color-night)'
      );

      const timeline = gsap.timeline({
        defaults: { overwrite: true },
        onStart: () => {
          gsap.set(overlay, { autoAlpha: 1 });
        },
        onComplete: () => {
          gsap.set(overlay, { autoAlpha: 0 });
          restoreScroll();
          isAnimatingRef.current = false;
        },
      });

      if (goingForward) {
        timeline
          .set(overlayPath, { attr: { d: TRANSITION_PATHS.step1.unfilled } })
          .to(overlayPath, {
            duration: 0.68,
            ease: 'power4.in',
            attr: { d: TRANSITION_PATHS.step1.curve },
          })
          .to(overlayPath, {
            duration: 0.18,
            ease: 'power1',
            attr: { d: TRANSITION_PATHS.step1.filled },
            onComplete: () => jumpToScreen(SECOND_SCREEN_INDEX),
          })
          .set(overlayPath, { attr: { d: TRANSITION_PATHS.step2.filled } })
          .to(overlayPath, {
            duration: 0.18,
            ease: 'sine.in',
            attr: { d: TRANSITION_PATHS.step2.curveForward },
          })
          .to(overlayPath, {
            duration: 0.76,
            ease: 'power4',
            attr: { d: TRANSITION_PATHS.step2.unfilled },
          });
      } else {
        timeline
          .set(overlayPath, { attr: { d: TRANSITION_PATHS.step2.unfilled } })
          .to(overlayPath, {
            duration: 0.68,
            ease: 'power4.in',
            attr: { d: TRANSITION_PATHS.step2.curveBack },
          })
          .to(overlayPath, {
            duration: 0.18,
            ease: 'power1',
            attr: { d: TRANSITION_PATHS.step2.filled },
            onComplete: () => jumpToScreen(FIRST_SCREEN_INDEX),
          })
          .set(overlayPath, { attr: { d: TRANSITION_PATHS.step1.filled } })
          .to(overlayPath, {
            duration: 0.18,
            ease: 'sine.in',
            attr: { d: TRANSITION_PATHS.step1.curve },
          })
          .to(overlayPath, {
            duration: 0.76,
            ease: 'power4',
            attr: { d: TRANSITION_PATHS.step1.unfilled },
          });
      }
    };

    const shouldInterceptForward = () => isNearScreen(FIRST_SCREEN_INDEX);
    const shouldInterceptBack = () => isNearScreen(SECOND_SCREEN_INDEX);

    const onWheel = (event: WheelEvent) => {
      if (isAnimatingRef.current) {
        event.preventDefault();
        return;
      }

      if (event.deltaY > 0 && shouldInterceptForward()) {
        event.preventDefault();
        runTransition('forward');
        return;
      }

      if (event.deltaY < 0 && shouldInterceptBack()) {
        event.preventDefault();
        runTransition('back');
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
      if (deltaY > 24 && shouldInterceptForward()) {
        event.preventDefault();
        touchStartYRef.current = null;
        runTransition('forward');
        return;
      }

      if (deltaY < -24 && shouldInterceptBack()) {
        event.preventDefault();
        touchStartYRef.current = null;
        runTransition('back');
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
        runTransition('forward');
        return;
      }

      if (backKeys.includes(event.key) && shouldInterceptBack()) {
        event.preventDefault();
        runTransition('back');
      }
    };

    root.addEventListener('wheel', onWheel, { passive: false });
    root.addEventListener('touchstart', onTouchStart, { passive: true });
    root.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      root.removeEventListener('wheel', onWheel);
      root.removeEventListener('touchstart', onTouchStart);
      root.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKeyDown);
      restoreScroll();
      gsap.killTweensOf([overlay, overlayPath]);
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
