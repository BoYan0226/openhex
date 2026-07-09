'use client';

import { useEffect, useRef } from 'react';

const WHEEL_GAIN = 0.58;
const FRICTION = 0.9;
const MAX_FRAME_DELTA = 32;
const MIN_VELOCITY = 0.35;

function normalizeWheelDelta(event: WheelEvent, root: HTMLElement) {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 18;
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * root.clientHeight;
  return event.deltaY;
}

export function ScrollInertia() {
  const frameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef(0);
  const velocityRef = useRef(0);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-landing-scroll-root]');
    if (!root) return undefined;

    const maxScrollTop = () => Math.max(0, root.scrollHeight - root.clientHeight);

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
      const velocity = velocityRef.current * FRICTION ** delta;
      const next = Math.min(maxTop, Math.max(0, current + velocity * delta));

      root.scrollTop = next;

      const hitEdge = (next <= 0 && velocity < 0) || (next >= maxTop && velocity > 0);
      if (hitEdge || Math.abs(velocity) < MIN_VELOCITY) {
        velocityRef.current = 0;
        frameRef.current = null;
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

      const delta = normalizeWheelDelta(event, root);
      const maxVelocity = root.clientHeight * 0.11;

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
