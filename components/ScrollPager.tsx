'use client';

import { useEffect, useRef } from 'react';

const MIN_WHEEL_DELTA = 4;
const POSITION_EPSILON = 2;
const MOUSE_GESTURE_IDLE_MS = 180;
const TRACKPAD_GESTURE_IDLE_MS = 560;
const MOUSE_SNAP_IDLE_MS = 45;
const TRACKPAD_SNAP_IDLE_MS = 95;
const SNAP_DIRECTION_THRESHOLD = 0.18;
const BACK_TRANSITION_TOLERANCE = 28;
const MOUSE_GESTURE_DISTANCE_LIMIT = 0.95;
const TRACKPAD_GESTURE_DISTANCE_LIMIT = 1;
const MOUSE_DISTANCE_MULTIPLIER = 1.8;
const TRACKPAD_DISTANCE_MULTIPLIER = 1;
const MOUSE_MAX_INPUT_STEP = 240;
const TRACKPAD_MAX_INPUT_STEP = 92;
const MAX_VELOCITY = 2200;
const SPRING_STIFFNESS = 120;
const SPRING_DAMPING = 26;
const SPRING_MASS = 1.8;
const SETTLE_DISTANCE = 1;
const SETTLE_SPEED = 12;
const SNAP_START_MIN_VELOCITY = 880;
const SNAP_START_VELOCITY_PER_PX = 3.2;
const SNAP_START_MAX_VELOCITY = 2100;

function getPageTops(root: HTMLElement) {
  const points = [0, root.clientHeight];

  document.querySelectorAll<HTMLElement>('.stack-anchor').forEach(anchor => {
    if (anchor.id === 'stack-live-agent') return;

    if (anchor.id === 'stack-summary') {
      const summaryTop = Math.max(0, anchor.offsetTop);
      points.push(summaryTop);
      return;
    }

    points.push(anchor.offsetTop);
  });

  return Array.from(new Set(points.map(point => Math.round(point)))).sort((a, b) => a - b);
}

function isLikelyTrackpad(event: WheelEvent, normalizedDelta: number) {
  return event.deltaMode === WheelEvent.DOM_DELTA_PIXEL && Math.abs(normalizedDelta) < 80;
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
  const isTrackpadGestureRef = useRef(false);
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
    const primeVelocityToward = (target: number) => {
      const distance = target - root.scrollTop;
      if (Math.abs(distance) <= POSITION_EPSILON) {
        velocityRef.current = 0;
        return;
      }

      const direction = distance > 0 ? 1 : -1;
      const initialSpeed = Math.min(
        SNAP_START_MAX_VELOCITY,
        Math.max(SNAP_START_MIN_VELOCITY, Math.abs(distance) * SNAP_START_VELOCITY_PER_PX)
      );
      velocityRef.current = direction * initialSpeed;
    };

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
        primeVelocityToward(target);
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
      primeVelocityToward(target);
      startAnimation();
    };

    const scheduleSnap = (delay: number) => {
      cancelSnap();
      snapTimerRef.current = window.setTimeout(settleToPage, delay);
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
      const isTrackpadInput =
        isLikelyTrackpad(event, wheelDelta) ||
        (isTrackpadGestureRef.current && now - lastInputTimeRef.current < TRACKPAD_GESTURE_IDLE_MS);
      const gestureIdleMs = isTrackpadInput ? TRACKPAD_GESTURE_IDLE_MS : MOUSE_GESTURE_IDLE_MS;
      const isNewGesture = now - lastInputTimeRef.current > gestureIdleMs;

      if (
        wheelDelta < 0 &&
        root.scrollTop <= POSITION_EPSILON &&
        targetRef.current <= POSITION_EPSILON
      ) {
        cancelAnimation();
        root.scrollTop = 0;
        targetRef.current = 0;
        velocityRef.current = 0;
        lastInputTimeRef.current = now;
        return;
      }

      if (
        wheelDelta < 0 &&
        Math.min(root.scrollTop, targetRef.current) >=
          root.clientHeight - BACK_TRANSITION_TOLERANCE &&
        Math.min(root.scrollTop, targetRef.current) <=
          root.clientHeight + BACK_TRANSITION_TOLERANCE
      ) {
        cancelAnimation();
        velocityRef.current = 0;
        targetRef.current = root.clientHeight;
        root.scrollTop = root.clientHeight;
        window.dispatchEvent(
          new CustomEvent('landing:request-path-back', {
            detail: { source: 'wheel' },
          })
        );
        lastInputTimeRef.current = now;
        return;
      }

      if (isNewGesture) {
        isTrackpadGestureRef.current = isTrackpadInput;
        gestureStartRef.current = root.scrollTop;
        targetRef.current = root.scrollTop;
        const gestureLimit =
          root.clientHeight *
          (isTrackpadInput ? TRACKPAD_GESTURE_DISTANCE_LIMIT : MOUSE_GESTURE_DISTANCE_LIMIT);
        motionMinRef.current = Math.max(0, gestureStartRef.current - gestureLimit);
        motionMaxRef.current = Math.min(
          getLastPoint(),
          gestureStartRef.current + gestureLimit
        );
      }
      lastInputTimeRef.current = now;

      const maxInputStep = isTrackpadInput ? TRACKPAD_MAX_INPUT_STEP : MOUSE_MAX_INPUT_STEP;
      const distanceMultiplier = isTrackpadInput
        ? TRACKPAD_DISTANCE_MULTIPLIER
        : MOUSE_DISTANCE_MULTIPLIER;
      const velocityImpulse = isTrackpadInput ? 4.2 : 7;
      const step = Math.max(
        -maxInputStep,
        Math.min(maxInputStep, wheelDelta * distanceMultiplier)
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
        Math.min(MAX_VELOCITY, velocityRef.current + step * velocityImpulse)
      );
      startAnimation();
      scheduleSnap(isTrackpadInput ? TRACKPAD_SNAP_IDLE_MS : MOUSE_SNAP_IDLE_MS);
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
