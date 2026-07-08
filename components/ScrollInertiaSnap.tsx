'use client';

import { useEffect, useRef } from 'react';

const WHEEL_GAIN = 0.54;
const FRICTION = 0.86;
const SNAP_EASE = 0.085;
const SNAP_SETTLE_DISTANCE = 1.2;
const SNAP_START_VELOCITY = 2.5;
const WHEEL_IDLE_MS = 150;
const MAX_FRAME_DELTA = 32;
const SNAP_DIRECTION_THRESHOLD = 8;

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

function directionalPoint(value: number, points: number[], direction: number) {
  if (direction > 0) {
    return points.find(point => point > value + SNAP_DIRECTION_THRESHOLD) ?? null;
  }

  if (direction < 0) {
    return (
      points
        .slice()
        .reverse()
        .find(point => point < value - SNAP_DIRECTION_THRESHOLD) ?? null
    );
  }

  return nearestPoint(value, points);
}

function uniqueSorted(points: number[]) {
  return Array.from(new Set(points.map(point => Math.round(point)))).sort((a, b) => a - b);
}

export function ScrollInertiaSnap() {
  const frameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef(0);
  const lastWheelTimeRef = useRef(0);
  const lastWheelDirectionRef = useRef(0);
  const velocityRef = useRef(0);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-landing-scroll-root]');
    if (!root) return undefined;

    const maxScrollTop = () => Math.max(0, root.scrollHeight - root.clientHeight);

    const getSnapPoints = () => {
      const points = [0, root.clientHeight];

      document.querySelectorAll<HTMLElement>('.stack-anchor').forEach(anchor => {
        if (anchor.id === 'stack-live-agent') return;
        if (anchor.id === 'stack-summary') return;

        points.push(anchor.offsetTop);
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
      const idleFor = now - lastWheelTimeRef.current;

      let velocity = velocityRef.current;
      const shouldSnap = idleFor > WHEEL_IDLE_MS && Math.abs(velocity) < SNAP_START_VELOCITY;
      const target = shouldSnap
        ? directionalPoint(current, points, lastWheelDirectionRef.current)
        : null;
      const distance = target === null ? 0 : target - current;

      if (shouldSnap) {
        if (target === null) {
          velocity *= FRICTION ** delta;
          const next = Math.min(maxScrollTop(), Math.max(0, current + velocity * delta));
          root.scrollTop = next;
          velocityRef.current = velocity;

          if (Math.abs(velocity) < 0.45) {
            velocityRef.current = 0;
            frameRef.current = null;
            return;
          }

          frameRef.current = window.requestAnimationFrame(tick);
          return;
        }

        const snapStep = distance * Math.min(0.28, SNAP_EASE * delta);
        const next = Math.min(maxScrollTop(), Math.max(0, current + snapStep));
        root.scrollTop = next;
        velocityRef.current = 0;

        if (Math.abs(target - next) < SNAP_SETTLE_DISTANCE) {
          root.scrollTop = target;
          frameRef.current = null;
          return;
        }

        frameRef.current = window.requestAnimationFrame(tick);
        return;
      }

      velocity *= FRICTION ** delta;

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
      const maxVelocity = root.clientHeight * 0.105;
      lastWheelDirectionRef.current = Math.sign(delta) || lastWheelDirectionRef.current;
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
