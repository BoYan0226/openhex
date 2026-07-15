'use client';

import { useEffect, useRef } from 'react';

const MIN_DELTA = 2;
const TRACKPAD_MULTIPLIER = 1.65;
const TRACKPAD_MAX_STEP = 200;
const MOUSE_WHEEL_MULTIPLIER = 3.1;
const MOUSE_WHEEL_MAX_STEP = 300;
const TRACKPAD_INERTIA_FACTOR = 0.17;
const MOUSE_INERTIA_FACTOR = 0.05;
const POSITION_EPSILON = 1.5;
const HOME_TRANSITION_SCREEN_INDEX = 1;
const HOME_TRANSITION_TOLERANCE_RATIO = 0.05;
const MOUSE_HOME_REENTRY_GUARD_MS = 140;
const TRACKPAD_HOME_IDLE_MS = 420;
const HOME_STOP_DURATION_MS = 260;
const MOBILE_BREAKPOINT_PX = 767;

type InputKind = 'mouse' | 'trackpad';

function easeOutCubic(value: number) {
  return 1 - (1 - value) ** 3;
}

function normalizeWheelDelta(event: WheelEvent, viewportHeight: number) {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 16;
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * viewportHeight;

  return event.deltaY;
}

function getInputKind(event: WheelEvent, normalizedDelta: number): InputKind {
  if (event.deltaMode !== WheelEvent.DOM_DELTA_PIXEL) return 'mouse';

  const legacyEvent = event as WheelEvent & {
    wheelDelta?: number;
    wheelDeltaY?: number;
  };
  const legacyDelta = Math.abs(legacyEvent.wheelDeltaY ?? legacyEvent.wheelDelta ?? 0);
  const isDiscreteMouseStep = legacyDelta >= 100 && Math.abs(legacyDelta % 120) <= 1;

  if (isDiscreteMouseStep) return 'mouse';

  return Math.abs(normalizedDelta) < 90 ? 'trackpad' : 'mouse';
}

export function SectionInertiaSnap() {
  const frameRef = useRef<number | null>(null);
  const targetRef = useRef(0);
  const directionRef = useRef<1 | -1>(1);
  const inputKindRef = useRef<InputKind>('mouse');
  const pendingHomeStopRef = useRef(false);
  const homeStopSettlingRef = useRef(false);
  const homeTransitionBlockedUntilRef = useRef(0);
  const trackpadHomeReadyRef = useRef(false);
  const trackpadHomeIdleTimerRef = useRef<number | null>(null);
  const isStackJumpingRef = useRef(false);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-landing-scroll-root]');
    if (!root) return undefined;

    const isMobileViewport = () => window.innerWidth <= MOBILE_BREAKPOINT_PX;
    const getMaxScroll = () => Math.max(0, root.scrollHeight - root.clientHeight);
    const clamp = (value: number) => Math.max(0, Math.min(getMaxScroll(), value));
    const getHomeTransitionTop = () => root.clientHeight * HOME_TRANSITION_SCREEN_INDEX;
    const isAtHomeTransitionTop = () =>
      Math.abs(root.scrollTop - getHomeTransitionTop()) <=
      root.clientHeight * HOME_TRANSITION_TOLERANCE_RATIO;

    const clearTrackpadHomeReady = () => {
      trackpadHomeReadyRef.current = false;
      if (trackpadHomeIdleTimerRef.current !== null) {
        window.clearTimeout(trackpadHomeIdleTimerRef.current);
        trackpadHomeIdleTimerRef.current = null;
      }
    };

    const scheduleTrackpadHomeReady = () => {
      if (inputKindRef.current !== 'trackpad') return;
      if (trackpadHomeReadyRef.current || trackpadHomeIdleTimerRef.current !== null) return;

      trackpadHomeReadyRef.current = false;
      trackpadHomeIdleTimerRef.current = window.setTimeout(() => {
        trackpadHomeIdleTimerRef.current = null;
        trackpadHomeReadyRef.current = isAtHomeTransitionTop();
      }, TRACKPAD_HOME_IDLE_MS);
    };

    const cancelFrame = () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };

    const animateToTarget = () => {
      if (frameRef.current !== null) return;

      const tick = () => {
        const current = root.scrollTop;
        const distance = targetRef.current - current;
        const inertiaFactor =
          inputKindRef.current === 'trackpad' ? TRACKPAD_INERTIA_FACTOR : MOUSE_INERTIA_FACTOR;
        const next = clamp(current + distance * inertiaFactor);
        root.scrollTop = Math.abs(distance) <= POSITION_EPSILON ? targetRef.current : next;

        if (Math.abs(targetRef.current - root.scrollTop) <= POSITION_EPSILON) {
          root.scrollTop = targetRef.current;
          if (
            pendingHomeStopRef.current &&
            Math.abs(targetRef.current - getHomeTransitionTop()) <= POSITION_EPSILON
          ) {
            pendingHomeStopRef.current = false;
            const guardMs =
              inputKindRef.current === 'trackpad' ? 0 : MOUSE_HOME_REENTRY_GUARD_MS;
            homeTransitionBlockedUntilRef.current = performance.now() + guardMs;
            scheduleTrackpadHomeReady();
          }
          frameRef.current = null;
          return;
        }

        frameRef.current = window.requestAnimationFrame(tick);
      };

      frameRef.current = window.requestAnimationFrame(tick);
    };

    const easeToHomeTransitionTop = () => {
      cancelFrame();
      homeStopSettlingRef.current = true;
      const start = root.scrollTop;
      const target = getHomeTransitionTop();
      const distance = target - start;
      const startedAt = performance.now();

      if (Math.abs(distance) <= POSITION_EPSILON) {
        root.scrollTop = target;
        targetRef.current = target;
        homeStopSettlingRef.current = false;
        const guardMs =
          inputKindRef.current === 'trackpad' ? 0 : MOUSE_HOME_REENTRY_GUARD_MS;
        homeTransitionBlockedUntilRef.current = performance.now() + guardMs;
        scheduleTrackpadHomeReady();
        return;
      }

      const tick = (now: number) => {
        const progress = Math.min((now - startedAt) / HOME_STOP_DURATION_MS, 1);
        root.scrollTop = clamp(start + distance * easeOutCubic(progress));

        if (progress < 1) {
          frameRef.current = window.requestAnimationFrame(tick);
          return;
        }

        root.scrollTop = target;
        targetRef.current = target;
        homeStopSettlingRef.current = false;
        const guardMs =
          inputKindRef.current === 'trackpad' ? 0 : MOUSE_HOME_REENTRY_GUARD_MS;
        homeTransitionBlockedUntilRef.current = performance.now() + guardMs;
        scheduleTrackpadHomeReady();
        frameRef.current = null;
      };

      frameRef.current = window.requestAnimationFrame(tick);
    };

    const requestHomeTransition = () => {
      cancelFrame();
      targetRef.current = root.scrollTop;
      window.dispatchEvent(
        new CustomEvent('landing:request-path-back', {
          detail: { force: true, fromCurrent: true, freshGesture: true },
        })
      );
    };

    const onWheel = (event: WheelEvent) => {
      if (
        isMobileViewport() ||
        event.defaultPrevented ||
        event.ctrlKey ||
        isStackJumpingRef.current ||
        root.style.overflowY === 'hidden'
      ) {
        return;
      }

      const rawDelta = normalizeWheelDelta(event, root.clientHeight);
      if (Math.abs(rawDelta) < MIN_DELTA) return;

      const direction = rawDelta > 0 ? 1 : -1;
      inputKindRef.current = getInputKind(event, rawDelta);

      if (
        inputKindRef.current === 'trackpad' &&
        direction < 0 &&
        homeStopSettlingRef.current
      ) {
        event.preventDefault();
        return;
      }

      if (direction > 0) {
        homeStopSettlingRef.current = false;
        pendingHomeStopRef.current = false;
        if (!isAtHomeTransitionTop()) {
          clearTrackpadHomeReady();
          homeTransitionBlockedUntilRef.current = 0;
        }
      }

      if (direction < 0 && root.scrollTop <= POSITION_EPSILON) {
        event.preventDefault();
        cancelFrame();
        root.scrollTop = 0;
        targetRef.current = 0;
        return;
      }

      if (
        direction < 0 &&
        isAtHomeTransitionTop()
      ) {
        event.preventDefault();
        cancelFrame();
        root.scrollTop = getHomeTransitionTop();
        targetRef.current = getHomeTransitionTop();
        pendingHomeStopRef.current = false;

        if (
          inputKindRef.current === 'trackpad' &&
          trackpadHomeReadyRef.current
        ) {
          clearTrackpadHomeReady();
          requestHomeTransition();
          return;
        }

        if (inputKindRef.current === 'trackpad') {
          scheduleTrackpadHomeReady();
          return;
        }

        if (performance.now() >= homeTransitionBlockedUntilRef.current) {
          clearTrackpadHomeReady();
          requestHomeTransition();
          return;
        }

        return;
      }

      event.preventDefault();
      if (direction !== directionRef.current) {
        cancelFrame();
        homeStopSettlingRef.current = false;
        targetRef.current = clamp(root.scrollTop);
        pendingHomeStopRef.current = false;
        if (!isAtHomeTransitionTop()) clearTrackpadHomeReady();
      }
      directionRef.current = direction;

      const isTrackpad = inputKindRef.current === 'trackpad';
      const multiplier = isTrackpad ? TRACKPAD_MULTIPLIER : MOUSE_WHEEL_MULTIPLIER;
      const maxStep = isTrackpad ? TRACKPAD_MAX_STEP : MOUSE_WHEEL_MAX_STEP;
      const step = Math.sign(rawDelta) * Math.min(Math.abs(rawDelta) * multiplier, maxStep);
      const nextTarget = clamp(targetRef.current + step);
      const liveAgentTop = getHomeTransitionTop();

      if (direction < 0 && root.scrollTop > liveAgentTop && nextTarget < liveAgentTop) {
        event.preventDefault();
        if (homeStopSettlingRef.current) return;
        targetRef.current = liveAgentTop;
        pendingHomeStopRef.current = false;
        easeToHomeTransitionTop();
        return;
      } else {
        targetRef.current = nextTarget;
      }
      animateToTarget();
    };

    const onScroll = () => {
      if (frameRef.current === null) targetRef.current = root.scrollTop;
    };

    const onResize = () => {
      targetRef.current = clamp(root.scrollTop);
    };

    const syncWithPathTransition = () => {
      cancelFrame();
      homeStopSettlingRef.current = false;
      targetRef.current = root.scrollTop;
      pendingHomeStopRef.current = false;
      homeTransitionBlockedUntilRef.current = 0;
      clearTrackpadHomeReady();
    };

    const onStackJumpStart = () => {
      isStackJumpingRef.current = true;
      cancelFrame();
      homeStopSettlingRef.current = false;
      pendingHomeStopRef.current = false;
      homeTransitionBlockedUntilRef.current = 0;
      clearTrackpadHomeReady();
      targetRef.current = root.scrollTop;
    };

    const onStackJumpComplete = () => {
      isStackJumpingRef.current = false;
      cancelFrame();
      homeStopSettlingRef.current = false;
      pendingHomeStopRef.current = false;
      homeTransitionBlockedUntilRef.current = 0;
      clearTrackpadHomeReady();
      targetRef.current = root.scrollTop;
    };

    targetRef.current = root.scrollTop;
    root.addEventListener('wheel', onWheel, { passive: false });
    root.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('landing:path-transition-start', syncWithPathTransition);
    window.addEventListener('landing:path-transition-complete', syncWithPathTransition);
    window.addEventListener('landing:stack-jump-start', onStackJumpStart);
    window.addEventListener('landing:stack-jump-complete', onStackJumpComplete);

    return () => {
      cancelFrame();
      homeStopSettlingRef.current = false;
      clearTrackpadHomeReady();
      root.removeEventListener('wheel', onWheel);
      root.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('landing:path-transition-start', syncWithPathTransition);
      window.removeEventListener('landing:path-transition-complete', syncWithPathTransition);
      window.removeEventListener('landing:stack-jump-start', onStackJumpStart);
      window.removeEventListener('landing:stack-jump-complete', onStackJumpComplete);
    };
  }, []);

  return null;
}
