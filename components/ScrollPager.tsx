'use client';

import { useEffect, useRef } from 'react';

const MIN_WHEEL_DELTA = 4;
const POSITION_EPSILON = 2;
const GESTURE_IDLE_MS = 320;
const SNAP_IDLE_MS = 110;
const SNAP_DIRECTION_THRESHOLD = 0.18;
const BACK_TRANSITION_TOLERANCE = 12;
const GESTURE_DISTANCE_LIMIT = 0.95;
const WHEEL_DISTANCE_MULTIPLIER = 1.8;
const MAX_INPUT_STEP = 240;
const MAX_VELOCITY = 2200;
const SPRING_STIFFNESS = 120;
const SPRING_DAMPING = 26;
const SPRING_MASS = 1.8;
const SETTLE_DISTANCE = 1;
const SETTLE_SPEED = 12;

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
  const targetRef = useRef(0);
  const velocityRef = useRef(0);
  const gestureStartRef = useRef(0);
  const lastInputTimeRef = useRef(0);
  const motionMinRef = useRef(0);
  const motionMaxRef = useRef(Number.POSITIVE_INFINITY);
  const lastDirectionRef = useRef<-1 | 1>(1);
  const snapTimerRef = useRef<number | null>(null);
  const resizeFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-landing-scroll-root]');
    if (!root) return undefined;

    const cancelAnimation = () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };

    const cancelSnap = () => {
      if (snapTimerRef.current !== null) {
        window.clearTimeout(snapTimerRef.current);
        snapTimerRef.current = null;
      }
    };

    const getLastPoint = () => getPageTops(root).at(-1) ?? 0;
    const clampTarget = (value: number) => Math.min(getLastPoint(), Math.max(0, value));
    const clampMotion = (value: number) =>
      Math.max(motionMinRef.current, Math.min(motionMaxRef.current, clampTarget(value)));

    const startAnimation = () => {
      if (animationFrameRef.current !== null) return;
      let previousTime = performance.now();
      const tick = (now: number) => {
        const deltaTime = Math.min((now - previousTime) / 1000, 0.032);
        previousTime = now;

        const position = root.scrollTop;
        const displacement = targetRef.current - position;
        const springForce = SPRING_STIFFNESS * displacement;
        const dampingForce = -SPRING_DAMPING * velocityRef.current;
        const acceleration = (springForce + dampingForce) / SPRING_MASS;

        velocityRef.current += acceleration * deltaTime;
        velocityRef.current = Math.max(
          -MAX_VELOCITY,
          Math.min(MAX_VELOCITY, velocityRef.current)
        );
        const nextPosition = position + velocityRef.current * deltaTime;
        const clampedPosition = clampMotion(nextPosition);
        root.scrollTop = clampedPosition;
        if (clampedPosition !== nextPosition) {
          velocityRef.current = 0;
        }

        const settled =
          Math.abs(targetRef.current - root.scrollTop) <= SETTLE_DISTANCE &&
          Math.abs(velocityRef.current) <= SETTLE_SPEED;

        if (settled) {
          root.scrollTop = targetRef.current;
          velocityRef.current = 0;
          animationFrameRef.current = null;
          window.dispatchEvent(
            new CustomEvent('landing:scroll-settled', {
              detail: { top: targetRef.current },
            })
          );
          return;
        }

        animationFrameRef.current = window.requestAnimationFrame(tick);
      };

      animationFrameRef.current = window.requestAnimationFrame(tick);
    };

    const movePage = (direction: -1 | 1) => {
      cancelSnap();
      const points = getPageTops(root);
      const current = root.scrollTop;
      const target =
        direction > 0
          ? points.find(point => point > current + POSITION_EPSILON)
          : [...points].reverse().find(point => point < current - POSITION_EPSILON);

      if (target !== undefined) {
        lastDirectionRef.current = direction;
        motionMinRef.current = 0;
        motionMaxRef.current = getLastPoint();
        targetRef.current = target;
        velocityRef.current = 0;
        startAnimation();
      }
    };

    const settleToPage = () => {
      snapTimerRef.current = null;
      const points = getPageTops(root);
      if (points.length === 0) return;

      const position = targetRef.current;
      let lower = points[0];
      let upper = points[points.length - 1];

      for (const point of points) {
        if (point <= position) lower = point;
        if (point >= position) {
          upper = point;
          break;
        }
      }

      let target = lower;
      if (upper !== lower) {
        const progress = (position - lower) / (upper - lower);
        target =
          lastDirectionRef.current > 0
            ? progress >= SNAP_DIRECTION_THRESHOLD
              ? upper
              : lower
            : progress <= 1 - SNAP_DIRECTION_THRESHOLD
              ? lower
              : upper;
      }

      motionMinRef.current = 0;
      motionMaxRef.current = getLastPoint();
      targetRef.current = target;
      startAnimation();
    };

    const scheduleSnap = () => {
      cancelSnap();
      snapTimerRef.current = window.setTimeout(settleToPage, SNAP_IDLE_MS);
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

      let wheelDelta = event.deltaY;
      if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
        wheelDelta *= 16;
      } else if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
        wheelDelta *= root.clientHeight;
      }

      if (Math.abs(wheelDelta) < MIN_WHEEL_DELTA) {
        return;
      }

      cancelSnap();
      const now = performance.now();
      const isNewGesture = now - lastInputTimeRef.current > GESTURE_IDLE_MS;

      if (
        wheelDelta < 0 &&
        isNewGesture &&
        Math.abs(root.scrollTop - root.clientHeight) <= BACK_TRANSITION_TOLERANCE
      ) {
        cancelAnimation();
        velocityRef.current = 0;
        window.dispatchEvent(new CustomEvent('landing:request-path-back'));
        lastInputTimeRef.current = now;
        return;
      }

      if (isNewGesture) {
        gestureStartRef.current = root.scrollTop;
        targetRef.current = root.scrollTop;
        const gestureLimit = root.clientHeight * GESTURE_DISTANCE_LIMIT;
        motionMinRef.current = Math.max(0, gestureStartRef.current - gestureLimit);
        motionMaxRef.current = Math.min(
          getLastPoint(),
          gestureStartRef.current + gestureLimit
        );
      }
      lastInputTimeRef.current = now;

      const step = Math.max(
        -MAX_INPUT_STEP,
        Math.min(MAX_INPUT_STEP, wheelDelta * WHEEL_DISTANCE_MULTIPLIER)
      );
      lastDirectionRef.current = step > 0 ? 1 : -1;

      if (
        velocityRef.current !== 0 &&
        Math.sign(step) !== Math.sign(velocityRef.current)
      ) {
        velocityRef.current = 0;
      }

      targetRef.current = clampTarget(
        Math.max(
          motionMinRef.current,
          Math.min(motionMaxRef.current, targetRef.current + step)
        )
      );
      velocityRef.current = Math.max(
        -MAX_VELOCITY,
        Math.min(MAX_VELOCITY, velocityRef.current + step * 7)
      );
      startAnimation();
      scheduleSnap();
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
      const lastPoint = getLastPoint();
      if (root.scrollTop > lastPoint) {
        root.scrollTop = lastPoint;
      }
      if (animationFrameRef.current === null) {
        targetRef.current = root.scrollTop;
      }
    };

    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest('.stack-jump-label')) {
        return;
      }
      cancelSnap();
      cancelAnimation();
      velocityRef.current = 0;
      window.setTimeout(() => {
        targetRef.current = root.scrollTop;
        gestureStartRef.current = root.scrollTop;
        motionMinRef.current = 0;
        motionMaxRef.current = getLastPoint();
      }, 0);
    };

    const onResize = () => {
      cancelSnap();
      cancelAnimation();
      velocityRef.current = 0;

      if (resizeFrameRef.current !== null) {
        window.cancelAnimationFrame(resizeFrameRef.current);
      }

      resizeFrameRef.current = window.requestAnimationFrame(() => {
        resizeFrameRef.current = null;
        const points = getPageTops(root);
        const nearest =
          points.reduce((best, point) =>
            Math.abs(point - root.scrollTop) < Math.abs(best - root.scrollTop) ? point : best
          , points[0] ?? 0);

        root.scrollTop = nearest;
        targetRef.current = nearest;
        gestureStartRef.current = nearest;
        lastInputTimeRef.current = 0;
        motionMinRef.current = 0;
        motionMaxRef.current = points.at(-1) ?? 0;
      });
    };

    targetRef.current = root.scrollTop;
    gestureStartRef.current = root.scrollTop;
    motionMaxRef.current = getLastPoint();
    root.addEventListener('wheel', onWheel, { passive: false });
    root.addEventListener('scroll', onScroll, { passive: true });
    root.addEventListener('click', onClick);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);

    return () => {
      cancelSnap();
      cancelAnimation();
      if (resizeFrameRef.current !== null) {
        window.cancelAnimationFrame(resizeFrameRef.current);
      }
      root.removeEventListener('wheel', onWheel);
      root.removeEventListener('scroll', onScroll);
      root.removeEventListener('click', onClick);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return null;
}
