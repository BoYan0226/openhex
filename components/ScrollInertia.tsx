'use client';

import { useEffect, useRef } from 'react';

const WHEEL_GAIN = 0.52;
const FRICTION = 0.88;
const MAX_FRAME_DELTA = 32;
const MAX_VELOCITY_RATIO = 0.065;
const MIN_VELOCITY = 1.2;
const SNAP_RANGE = 0.65;
const SNAP_DURATION_MS = 650;

function normalizeWheelDelta(event: WheelEvent, root: HTMLElement) {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 18;
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * root.clientHeight;
  return event.deltaY;
}

function smoothstep(value: number) {
  return value * value * (3 - 2 * value);
}

export function ScrollInertia() {
  const frameRef = useRef<number | null>(null);
  const isSnappingRef = useRef(false);
  const lastFrameTimeRef = useRef(0);
  const velocityRef = useRef(0);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-landing-scroll-root]');
    if (!root) return undefined;

    const maxScrollTop = () => Math.max(0, root.scrollHeight - root.clientHeight);

    const getSnapPoints = () => {
      const points: number[] = [];
      const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

      document.querySelectorAll<HTMLElement>('.stack-anchor').forEach(anchor => {
        if (anchor.id === 'stack-live-agent') return;

        if (anchor.id === 'stack-summary') {
          const offsetRem =
            Number.parseFloat(getComputedStyle(anchor).getPropertyValue('--sticky-offset')) || 0;
          points.push(anchor.offsetTop - offsetRem * rem);
          return;
        }

        points.push(anchor.offsetTop);
      });

      return Array.from(new Set(points.map(point => Math.round(point)))).sort((a, b) => a - b);
    };

    const stopFrame = () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      isSnappingRef.current = false;
    };

    const startSnap = () => {
      const current = root.scrollTop;
      const points = getSnapPoints();
      if (points.length === 0) return;

      const target = points.reduce((nearest, point) =>
        Math.abs(point - current) < Math.abs(nearest - current) ? point : nearest
      );
      const distance = target - current;

      if (Math.abs(distance) < 1 || Math.abs(distance) > root.clientHeight * SNAP_RANGE) return;

      const start = performance.now();
      isSnappingRef.current = true;

      const snapTick = (now: number) => {
        const progress = Math.min(1, (now - start) / SNAP_DURATION_MS);
        root.scrollTop = current + distance * smoothstep(progress);

        if (progress >= 1) {
          root.scrollTop = target;
          isSnappingRef.current = false;
          frameRef.current = null;
          return;
        }

        frameRef.current = window.requestAnimationFrame(snapTick);
      };

      frameRef.current = window.requestAnimationFrame(snapTick);
    };

    const tick = (now: number) => {
      const previous = lastFrameTimeRef.current || now;
      const delta = Math.min(MAX_FRAME_DELTA, now - previous) / 16.67;
      lastFrameTimeRef.current = now;

      const current = root.scrollTop;
      const maxTop = maxScrollTop();
      const velocity = velocityRef.current * FRICTION ** delta;
      const next = Math.min(maxTop, Math.max(0, current + velocity * delta));

      root.scrollTop = next;

      const hitEdge = (next <= 0 && velocity < 0) || (next >= maxTop && velocity > 0);
      if (hitEdge || Math.abs(velocity) < MIN_VELOCITY) {
        velocityRef.current = 0;
        frameRef.current = null;
        startSnap();
        return;
      }

      velocityRef.current = velocity;
      frameRef.current = window.requestAnimationFrame(tick);
    };

    const startFrame = () => {
      if (frameRef.current !== null) return;
      lastFrameTimeRef.current = 0;
      frameRef.current = window.requestAnimationFrame(tick);
    };

    const onWheel = (event: WheelEvent) => {
      if (event.defaultPrevented || event.ctrlKey || root.style.overflowY === 'hidden') return;

      event.preventDefault();

      if (isSnappingRef.current) stopFrame();

      const delta = normalizeWheelDelta(event, root);
      const maxVelocity = root.clientHeight * MAX_VELOCITY_RATIO;

      if (
        velocityRef.current !== 0 &&
        Math.sign(delta) !== Math.sign(velocityRef.current)
      ) {
        velocityRef.current = 0;
      }

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
