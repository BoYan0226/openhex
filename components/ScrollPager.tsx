'use client';

import { useEffect, useRef } from 'react';

const GESTURE_END_MS = 180;
const MIN_WHEEL_DELTA = 4;
const POSITION_EPSILON = 2;

function getRemInPixels() {
  return Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
}

function getPageTops(root: HTMLElement) {
  const rem = getRemInPixels();
  const points = [0, root.clientHeight];

  document.querySelectorAll<HTMLElement>('.stack-anchor').forEach(anchor => {
    if (anchor.id === 'stack-live-agent') return;

    const offsetRem =
      Number.parseFloat(getComputedStyle(anchor).getPropertyValue('--sticky-offset')) || 0;
    points.push(Math.max(0, anchor.offsetTop - offsetRem * rem));
  });

  return Array.from(new Set(points.map(point => Math.round(point)))).sort((a, b) => a - b);
}

export function ScrollPager() {
  const gestureActiveRef = useRef(false);
  const gestureEndTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-landing-scroll-root]');
    if (!root) return undefined;

    const movePage = (direction: -1 | 1) => {
      const points = getPageTops(root);
      const current = root.scrollTop;
      const target =
        direction > 0
          ? points.find(point => point > current + POSITION_EPSILON)
          : [...points].reverse().find(point => point < current - POSITION_EPSILON);

      if (target !== undefined) {
        root.scrollTop = target;
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
      finishGestureAfterPause();

      if (Math.abs(event.deltaY) < MIN_WHEEL_DELTA || gestureActiveRef.current) {
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
