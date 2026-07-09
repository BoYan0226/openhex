'use client';

import { useEffect, useRef } from 'react';

const WHEEL_GAIN = 0.58;
const FRICTION = 0.9;
const SNAP_EASE = 0.1;
const SNAP_SETTLE_DISTANCE = 12;
const WHEEL_IDLE_MS = 190;
const MAX_FRAME_DELTA = 32;
const MIN_VELOCITY = 0.35;
const SNAP_DIRECTION_THRESHOLD = 8;

function normalizeWheelDelta(event: WheelEvent, root: HTMLElement) {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 18;
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * root.clientHeight;
  return event.deltaY;
}

function uniqueSorted(points: number[]) {
  return Array.from(new Set(points.map(point => Math.round(point)))).sort((a, b) => a - b);
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

  return null;
}

export function ScrollInertia() {
  const frameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef(0);
  const lastWheelDirectionRef = useRef(0);
  const lastWheelTimeRef = useRef(0);
  const snapTargetRef = useRef<number | null>(null);
  const velocityRef = useRef(0);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-landing-scroll-root]');
    if (!root) return undefined;

    const maxScrollTop = () => Math.max(0, root.scrollHeight - root.clientHeight);

    const getSnapPoints = () => {
      const points = [0, root.clientHeight];

      document.querySelectorAll<HTMLElement>('.stack-anchor').forEach(anchor => {
        if (anchor.id === 'stack-live-agent' || anchor.id === 'stack-summary') return;
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

      const current = root.scrollTop;
      const maxTop = maxScrollTop();
      const idleFor = now - lastWheelTimeRef.current;
      const shouldSnap = idleFor >= WHEEL_IDLE_MS;

      if (shouldSnap && snapTargetRef.current === null) {
        snapTargetRef.current = directionalPoint(
          current,
          getSnapPoints(),
          lastWheelDirectionRef.current
        );
      }

      const snapTarget = snapTargetRef.current;
      if (shouldSnap && snapTarget !== null) {
        const distance = snapTarget - current;
        const next = Math.min(
          maxTop,
          Math.max(0, current + distance * Math.min(0.3, SNAP_EASE * delta))
        );

        root.scrollTop = next;
        velocityRef.current = 0;

        if (Math.abs(snapTarget - next) <= SNAP_SETTLE_DISTANCE) {
          root.scrollTop = snapTarget;
          snapTargetRef.current = null;
          frameRef.current = null;
          return;
        }

        frameRef.current = window.requestAnimationFrame(tick);
        return;
      }

      const velocity = velocityRef.current * FRICTION ** delta;
      const next = Math.min(maxTop, Math.max(0, current + velocity * delta));

      root.scrollTop = next;

      const hitEdge = (next <= 0 && velocity < 0) || (next >= maxTop && velocity > 0);
      if (hitEdge) {
        velocityRef.current = 0;
      } else {
        velocityRef.current = Math.abs(velocity) < MIN_VELOCITY ? 0 : velocity;
      }

      if (shouldSnap && snapTarget === null) {
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
      if (event.defaultPrevented || event.ctrlKey || root.style.overflowY === 'hidden') return;

      event.preventDefault();

      const delta = normalizeWheelDelta(event, root);
      const maxVelocity = root.clientHeight * 0.11;
      lastWheelDirectionRef.current = Math.sign(delta) || lastWheelDirectionRef.current;
      lastWheelTimeRef.current = performance.now();
      snapTargetRef.current = null;

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
      snapTargetRef.current = null;
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
