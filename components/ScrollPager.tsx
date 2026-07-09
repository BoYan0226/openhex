'use client';

import { useEffect, useRef } from 'react';

const GESTURE_END_MS = 80;
const MIN_WHEEL_DELTA = 4;
const NEW_GESTURE_DELTA = 18;
const PAGE_TRANSITION_MS = 850;
const POSITION_EPSILON = 2;

function getRemInPixels() {
  return Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
}

function getPageTops(root: HTMLElement) {
  const rem = getRemInPixels();
  const points = [0, root.clientHeight];

  document.querySelectorAll<HTMLElement>('.stack-anchor').forEach(anchor => {
    if (anchor.id === 'stack-live-agent') return;

    if (anchor.id === 'stack-summary') {
      const offsetRem =
        Number.parseFloat(getComputedStyle(anchor).getPropertyValue('--sticky-offset')) || 0;
      const offset = offsetRem * rem;
      const summaryTop = Math.max(0, anchor.offsetTop - offset);
      points.push(summaryTop);

      const summaryScreen =
        anchor.nextElementSibling?.querySelector<HTMLElement>('.summary-screen');
      if (summaryScreen) {
        const visibleHeight = root.clientHeight - offset;
        const summaryBottom = summaryTop + Math.max(0, summaryScreen.scrollHeight - visibleHeight);
        if (summaryBottom > summaryTop + POSITION_EPSILON) {
          points.push(summaryBottom);
        }
      }
      return;
    }

    points.push(anchor.offsetTop);
  });

  return Array.from(new Set(points.map(point => Math.round(point)))).sort((a, b) => a - b);
}

export function ScrollPager() {
  const animationFrameRef = useRef<number | null>(null);
  const gestureActiveRef = useRef(false);
  const gestureEndTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-landing-scroll-root]');
    if (!root) return undefined;

    const cancelAnimation = () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };

    const animateTo = (target: number) => {
      cancelAnimation();

      const startTop = root.scrollTop;
      const distance = target - startTop;
      const startTime = performance.now();

      const tick = (now: number) => {
        const progress = Math.min(1, (now - startTime) / PAGE_TRANSITION_MS);
        const eased = -(Math.cos(Math.PI * progress) - 1) / 2;

        root.scrollTop = startTop + distance * eased;

        if (progress >= 1) {
          root.scrollTop = target;
          animationFrameRef.current = null;
          return;
        }

        animationFrameRef.current = window.requestAnimationFrame(tick);
      };

      animationFrameRef.current = window.requestAnimationFrame(tick);
    };

    const movePage = (direction: -1 | 1) => {
      if (animationFrameRef.current !== null) return;

      const points = getPageTops(root);
      const current = root.scrollTop;
      const target =
        direction > 0
          ? points.find(point => point > current + POSITION_EPSILON)
          : [...points].reverse().find(point => point < current - POSITION_EPSILON);

      if (target !== undefined) {
        animateTo(target);
      }
    };

    const finishGestureAfterPause = () => {
      if (gestureEndTimerRef.current !== null) {
        window.clearTimeout(gestureEndTimerRef.current);
      }

      gestureEndTimerRef.current = window.setTimeout(() => {
        gestureActiveRef.current = false;
        gestureEndTimerRef.current = null;
      }, GESTURE_END_MS);
    };

    const onWheel = (event: WheelEvent) => {
      if (
        event.defaultPrevented ||
        event.ctrlKey ||
        root.style.overflowY === 'hidden'
      ) {
        return;
      }

      event.preventDefault();

      const delta = Math.abs(event.deltaY);
      if (delta < MIN_WHEEL_DELTA) {
        return;
      }

      finishGestureAfterPause();

      if (
        gestureActiveRef.current &&
        (animationFrameRef.current !== null || delta < NEW_GESTURE_DELTA)
      ) {
        return;
      }

      gestureActiveRef.current = true;
      movePage(event.deltaY > 0 ? 1 : -1);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (['ArrowDown', 'PageDown', ' ', 'Spacebar'].includes(event.key)) {
        event.preventDefault();
        movePage(1);
      } else if (['ArrowUp', 'PageUp'].includes(event.key)) {
        event.preventDefault();
        movePage(-1);
      }
    };

    const onScroll = () => {
      const points = getPageTops(root);
      const lastPoint = points.at(-1);
      if (lastPoint !== undefined && root.scrollTop > lastPoint) {
        root.scrollTop = lastPoint;
      }
    };

    root.addEventListener('wheel', onWheel, { passive: false });
    root.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      cancelAnimation();
      if (gestureEndTimerRef.current !== null) {
        window.clearTimeout(gestureEndTimerRef.current);
      }
      root.removeEventListener('wheel', onWheel);
      root.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return null;
}
