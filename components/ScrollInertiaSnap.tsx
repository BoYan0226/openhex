'use client';

import { useEffect, useRef } from 'react';

const WHEEL_GAIN = 0.46;
const FRICTION = 0.82;
const SNAP_FRICTION = 0.7;
const SNAP_EASE = 0.045;
const DAMPING_RANGE = 115;
const SNAP_SETTLE_DISTANCE = 0.6;
const WHEEL_IDLE_MS = 150;
const MAX_FRAME_DELTA = 32;

function getRemInPixels() {
  return Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
}

function normalizeWheelDelta(event: WheelEvent, root: HTMLElement) {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 18;
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * root.clientHeight;
  return event.deltaY;
}

function nearestPoint(value: number, points: number[]) {
  return points.reduce((nearest, point) =>
    Math.abs(point - value) < Math.abs(nearest - value) ? point : nearest
  );
}

function uniqueSorted(points: number[]) {
  return Array.from(new Set(points.map(point => Math.round(point)))).sort((a, b) => a - b);
}

export function ScrollInertiaSnap() {
  const frameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef(0);
  const lastWheelTimeRef = useRef(0);
  const velocityRef = useRef(0);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-landing-scroll-root]');
    if (!root) return undefined;

    const maxScrollTop = () => Math.max(0, root.scrollHeight - root.clientHeight);

    const getSnapPoints = () => {
      const remPx = getRemInPixels();
      const points = [0, root.clientHeight];

      document.querySelectorAll<HTMLElement>('.stack-anchor').forEach(anchor => {
        if (anchor.id === 'stack-summary') return;

        const offsetValue = getComputedStyle(anchor).getPropertyValue('--sticky-offset');
        const offsetRem = Number.parseFloat(offsetValue) || 0;
        points.push(anchor.offsetTop - offsetRem * remPx);
      });

      return uniqueSorted(points.map(point => Math.min(maxScrollTop(), Math.max(0, point))));
    };

    const stopFrame = () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };

    const tick = (now: number) => {
      const previous = lastFrameTimeRef.current || now;
      const delta = Math.min(MAX_FRAME_DELTA, now - previous) / 16.67;
      lastFrameTimeRef.current = now;

      const points = getSnapPoints();
      const current = root.scrollTop;
      const nearest = nearestPoint(current, points);
      const distance = nearest - current;
      const idleFor = now - lastWheelTimeRef.current;

      let velocity = velocityRef.current;
      const shouldSnap = idleFor > WHEEL_IDLE_MS;

      if (shouldSnap) {
        const snapStep = distance * SNAP_EASE * delta;
        const next = Math.min(maxScrollTop(), Math.max(0, current + snapStep));
        root.scrollTop = next;
        velocityRef.current = 0;

        if (Math.abs(nearest - next) < SNAP_SETTLE_DISTANCE) {
          root.scrollTop = nearest;
          frameRef.current = null;
          return;
        }

        frameRef.current = window.requestAnimationFrame(tick);
        return;
      }

      if (Math.abs(distance) < DAMPING_RANGE) {
        velocity *= SNAP_FRICTION ** delta;
      } else {
        velocity *= FRICTION ** delta;
      }

      const next = Math.min(maxScrollTop(), Math.max(0, current + velocity * delta));
      root.scrollTop = next;
      velocityRef.current = velocity;

      if (Math.abs(velocity) < 0.45) {
        velocityRef.current = 0;
        frameRef.current = null;
        return;
      }

      frameRef.current = window.requestAnimationFrame(tick);
    };

    const startFrame = () => {
      if (frameRef.current !== null) return;
      lastFrameTimeRef.current = 0;
      frameRef.current = window.requestAnimationFrame(tick);
    };

    const onWheel = (event: WheelEvent) => {
      if (event.defaultPrevented || root.style.overflowY === 'hidden') return;

      event.preventDefault();
      lastWheelTimeRef.current = performance.now();

      const delta = normalizeWheelDelta(event, root);
      const maxVelocity = root.clientHeight * 0.085;
      velocityRef.current = Math.max(
        -maxVelocity,
        Math.min(maxVelocity, velocityRef.current + delta * WHEEL_GAIN)
      );

      startFrame();
    };

    const onTransitionStart = () => {
      stopFrame();
      velocityRef.current = 0;
    };

    root.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('landing:path-transition-start', onTransitionStart);

    return () => {
      stopFrame();
      root.removeEventListener('wheel', onWheel);
      window.removeEventListener('landing:path-transition-start', onTransitionStart);
    };
  }, []);

  return null;
}
