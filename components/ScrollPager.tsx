'use client';

import { useEffect, useRef } from 'react';

const MIN_WHEEL_DELTA = 4;
const POSITION_EPSILON = 2;
const MOUSE_GESTURE_IDLE_MS = 180;
const TRACKPAD_GESTURE_IDLE_MS = 130;
const TRACKPAD_TAIL_IGNORE_MS = 70;
const TRACKPAD_TAIL_DELTA = 16;
const MOUSE_SNAP_IDLE_MS = 45;
const SNAP_DIRECTION_THRESHOLD = 0.18;
const BACK_TRANSITION_TOLERANCE = 28;
const BACK_TRANSITION_REARM_MS = 260;
const MOUSE_GESTURE_DISTANCE_LIMIT = 0.95;
const MOUSE_DISTANCE_MULTIPLIER = 1.8;
const MOUSE_MAX_INPUT_STEP = 240;
const MAX_VELOCITY = 2200;
const SPRING_STIFFNESS = 120;
const SPRING_DAMPING = 26;
const SPRING_MASS = 1.8;
const SETTLE_DISTANCE = 1;
const SETTLE_SPEED = 12;
const EASE_SNAP_MIN_DURATION = 520;
const EASE_SNAP_MAX_DURATION = 860;
const EASE_SNAP_PX_PER_MS = 1.55;
const TRACKPAD_SNAP_DURATION = 480;

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

function easeOutQuint(value: number) {
  return 1 - (1 - value) ** 5;
}

function easeOutQuart(value: number) {
  return 1 - (1 - value) ** 4;
}

export function ScrollPager() {
  const animationFrameRef = useRef<number | null>(null);
  const animationModeRef = useRef<'ease' | 'spring' | null>(null);
  const targetRef = useRef(0);
  const velocityRef = useRef(0);
  const gestureStartRef = useRef(0);
  const lastInputTimeRef = useRef(0);
  const motionMinRef = useRef(0);
  const motionMaxRef = useRef(Number.POSITIVE_INFINITY);
  const lastDirectionRef = useRef<-1 | 1>(1);
  const isTrackpadGestureRef = useRef(false);
  const lastTrackpadReleaseRef = useRef(0);
  const liveAgentBackArmedRef = useRef(false);
  const liveAgentBackArmedAtRef = useRef(0);
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
      animationModeRef.current = null;
    };

    const cancelSnap = () => {
      if (snapTimerRef.current !== null) {
        window.clearTimeout(snapTimerRef.current);
        snapTimerRef.current = null;
      }
    };

    const getLastPoint = () => getPageTops(root).at(-1) ?? 0;
    const isNearLiveAgent = (value: number) =>
      Math.abs(value - root.clientHeight) <= BACK_TRANSITION_TOLERANCE;
    const clampTarget = (value: number) => Math.min(getLastPoint(), Math.max(0, value));
    const clampMotion = (value: number) =>
      Math.max(motionMinRef.current, Math.min(motionMaxRef.current, clampTarget(value)));
    const getAdjacentTarget = (points: number[], origin: number, direction: -1 | 1) => {
      if (direction > 0) {
        return points.find(point => point > origin + POSITION_EPSILON);
      }

      return [...points].reverse().find(point => point < origin - POSITION_EPSILON);
    };

    const syncLiveAgentBackArm = (position: number) => {
      const shouldArm = isNearLiveAgent(position);
      if (shouldArm === liveAgentBackArmedRef.current) return;

      liveAgentBackArmedRef.current = shouldArm;
      liveAgentBackArmedAtRef.current = shouldArm ? performance.now() : 0;
    };

    const dispatchSettled = () => {
      syncLiveAgentBackArm(targetRef.current);
      window.dispatchEvent(
        new CustomEvent('landing:scroll-settled', {
          detail: { top: targetRef.current },
        })
      );
    };

    const easeToTarget = (
      target: number,
      durationOverride?: number,
      easing: (value: number) => number = easeOutQuint,
      onComplete?: () => void
    ) => {
      cancelAnimation();
      animationModeRef.current = 'ease';
      const start = root.scrollTop;
      const distance = target - start;
      targetRef.current = target;
      velocityRef.current = 0;

      if (Math.abs(distance) <= POSITION_EPSILON) {
        root.scrollTop = target;
        velocityRef.current = 0;
        animationModeRef.current = null;
        onComplete?.();
        dispatchSettled();
        return;
      }

      const duration =
        durationOverride ??
        Math.min(
          EASE_SNAP_MAX_DURATION,
          Math.max(EASE_SNAP_MIN_DURATION, Math.abs(distance) / EASE_SNAP_PX_PER_MS)
        );
      const startedAt = performance.now();

      const tick = (now: number) => {
        const progress = Math.min((now - startedAt) / duration, 1);
        root.scrollTop = clampMotion(start + distance * easing(progress));

        if (progress < 1) {
          animationFrameRef.current = window.requestAnimationFrame(tick);
          return;
        }

        root.scrollTop = target;
        velocityRef.current = 0;
        animationFrameRef.current = null;
        animationModeRef.current = null;
        onComplete?.();
        dispatchSettled();
      };

      animationFrameRef.current = window.requestAnimationFrame(tick);
    };

    const startAnimation = () => {
      if (animationFrameRef.current !== null) return;
      animationModeRef.current = 'spring';
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
          animationModeRef.current = null;
          dispatchSettled();
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
        easeToTarget(target);
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
      easeToTarget(target);
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
      const direction = wheelDelta > 0 ? 1 : -1;

      if (
        isTrackpadInput &&
        !isTrackpadGestureRef.current &&
        now - lastTrackpadReleaseRef.current < TRACKPAD_TAIL_IGNORE_MS &&
        Math.abs(wheelDelta) < TRACKPAD_TAIL_DELTA
      ) {
        return;
      }

      const isOppositeTrackpadGesture =
        isTrackpadInput &&
        animationModeRef.current === 'ease' &&
        direction !== lastDirectionRef.current &&
        Math.abs(wheelDelta) >= TRACKPAD_TAIL_DELTA;

      if (
        animationModeRef.current === 'ease' &&
        (!isTrackpadInput || isNewGesture || isOppositeTrackpadGesture)
      ) {
        cancelAnimation();
        if (isOppositeTrackpadGesture) {
          isTrackpadGestureRef.current = false;
          lastInputTimeRef.current = 0;
        }
      }

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

      const isSettledOnLiveAgent =
        isNearLiveAgent(root.scrollTop) && isNearLiveAgent(targetRef.current);
      if (!isSettledOnLiveAgent) {
        liveAgentBackArmedRef.current = false;
        liveAgentBackArmedAtRef.current = 0;
      }

      if (
        wheelDelta < 0 &&
        isSettledOnLiveAgent &&
        liveAgentBackArmedRef.current &&
        now - liveAgentBackArmedAtRef.current > BACK_TRANSITION_REARM_MS &&
        isNewGesture
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

      if (isTrackpadInput) {
        if (isNewGesture || !isTrackpadGestureRef.current) {
          const points = getPageTops(root);
          const target = getAdjacentTarget(points, root.scrollTop, direction);
          isTrackpadGestureRef.current = true;
          gestureStartRef.current = root.scrollTop;
          lastDirectionRef.current = direction;
          lastInputTimeRef.current = now;
          motionMinRef.current = 0;
          motionMaxRef.current = getLastPoint();
          if (target !== undefined) {
            easeToTarget(target, TRACKPAD_SNAP_DURATION, easeOutQuart, () => {
              isTrackpadGestureRef.current = false;
              lastInputTimeRef.current = 0;
              lastTrackpadReleaseRef.current = performance.now();
            });
          } else {
            isTrackpadGestureRef.current = false;
            lastInputTimeRef.current = 0;
          }
          return;
        }

        if (animationModeRef.current !== 'ease') {
          lastInputTimeRef.current = now;
        }
        return;
      }

      if (isNewGesture) {
        isTrackpadGestureRef.current = false;
        gestureStartRef.current = root.scrollTop;
        targetRef.current = root.scrollTop;
        const gestureLimit = root.clientHeight * MOUSE_GESTURE_DISTANCE_LIMIT;
        motionMinRef.current = Math.max(0, gestureStartRef.current - gestureLimit);
        motionMaxRef.current = Math.min(
          getLastPoint(),
          gestureStartRef.current + gestureLimit
        );
      }
      lastInputTimeRef.current = now;

      const maxInputStep = MOUSE_MAX_INPUT_STEP;
      const distanceMultiplier = MOUSE_DISTANCE_MULTIPLIER;
      const velocityImpulse = 7;
      const step = Math.max(
        -maxInputStep,
        Math.min(maxInputStep, wheelDelta * distanceMultiplier)
      );
      lastDirectionRef.current = direction;

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
      scheduleSnap(MOUSE_SNAP_IDLE_MS);
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
        syncLiveAgentBackArm(root.scrollTop);
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
