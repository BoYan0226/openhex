'use client';

import { useEffect, useRef } from 'react';

const MIN_WHEEL_DELTA = 4;
const POSITION_EPSILON = 2;
const MOUSE_GESTURE_IDLE_MS = 180;
const MOUSE_SNAP_IDLE_MS = 45;
const TRACKPAD_DELTA_LIMIT = 90;
const TRACKPAD_START_DELAY_MS = 12;
const TRACKPAD_SESSION_IDLE_MS = 120;
const TRACKPAD_REINTENT_DELAY_MS = 160;
const TRACKPAD_REVERSE_DELAY_MS = 120;
const TRACKPAD_FRESH_GAP_MS = 72;
const TRACKPAD_REINTENT_MIN_DELTA = 12;
const TRACKPAD_REINTENT_MAX_DELTA = 24;
const TRACKPAD_REINTENT_RISE = 6;
const TRACKPAD_REINTENT_RATIO = 1.7;
const MOBILE_BREAKPOINT_PX = 767;
const MOBILE_TOUCH_TRIGGER_PX = 42;
const MOBILE_PAGE_EDGE_TOLERANCE = 24;
const MOBILE_PANEL_END_TOLERANCE = 4;
const MOBILE_PAGE_DURATION = 560;
const SNAP_DIRECTION_THRESHOLD = 0.18;
const SNAP_MIN_DISTANCE_PX = 195;
const MOUSE_GESTURE_DISTANCE_LIMIT = 0.95;
const MOUSE_DISTANCE_MULTIPLIER = 1.8;
const MOUSE_MAX_INPUT_STEP = 240;
const MAX_VELOCITY = 2200;
const TRACKPAD_MAX_VELOCITY = 4000;
const SPRING_STIFFNESS = 120;
const SPRING_DAMPING = 26;
const SPRING_MASS = 1.8;
const SETTLE_DISTANCE = 1;
const SETTLE_SPEED = 12;
const EASE_SNAP_MIN_DURATION = 520;
const EASE_SNAP_MAX_DURATION = 860;
const EASE_SNAP_PX_PER_MS = 1.55;
const HOME_TRANSITION_PAGE_TOLERANCE = 8;
const SUMMARY_TOP_OVERLAP = 2;

function easeOutQuint(value: number) {
  return 1 - (1 - value) ** 5;
}

function getStaticTop(element: HTMLElement, root: HTMLElement) {
  let top = 0;
  let current: HTMLElement | null = element;

  while (current && current !== root) {
    top += current.offsetTop;
    current = current.offsetParent as HTMLElement | null;
  }

  return top;
}

function isLikelyTrackpad(event: WheelEvent, normalizedDelta: number) {
  if (event.deltaMode !== WheelEvent.DOM_DELTA_PIXEL) return false;

  const legacyEvent = event as WheelEvent & {
    wheelDelta?: number;
    wheelDeltaY?: number;
  };
  const legacyDelta = Math.abs(legacyEvent.wheelDeltaY ?? legacyEvent.wheelDelta ?? 0);
  const isDiscreteMouseStep =
    legacyDelta >= 100 && Math.abs(legacyDelta % 120) <= 0.5;

  return !isDiscreteMouseStep && Math.abs(normalizedDelta) < TRACKPAD_DELTA_LIMIT;
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
  const trackpadConsumedRef = useRef(false);
  const trackpadPendingDirectionRef = useRef<-1 | 1 | null>(null);
  const trackpadStartTimerRef = useRef<number | null>(null);
  const trackpadReleaseTimerRef = useRef<number | null>(null);
  const trackpadLastEventAtRef = useRef(0);
  const trackpadLastIntentAtRef = useRef(0);
  const trackpadLastDeltaRef = useRef(0);
  const trackpadPeakDeltaRef = useRef(0);
  const trackpadValleyDeltaRef = useRef(Number.POSITIVE_INFINITY);
  const trackpadReintentArmedRef = useRef(false);
  const trackpadRiseCountRef = useRef(0);
  const snapTimerRef = useRef<number | null>(null);
  const resizeFrameRef = useRef<number | null>(null);
  const pageTopsRef = useRef<number[]>([]);
  const summaryTopRef = useRef(Number.POSITIVE_INFINITY);
  const summaryBottomRef = useRef(Number.POSITIVE_INFINITY);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartTopRef = useRef(0);
  const touchPanelBottomRef = useRef(Number.POSITIVE_INFINITY);
  const touchStartedAtPanelEndRef = useRef(false);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-landing-scroll-root]');
    if (!root) return undefined;
    const scrollRoot = root;

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

    const refreshPageTops = () => {
      const points = [0, root.clientHeight];
      summaryTopRef.current = Number.POSITIVE_INFINITY;
      summaryBottomRef.current = Number.POSITIVE_INFINITY;

      document.querySelectorAll<HTMLElement>('.stack-anchor').forEach(anchor => {
        if (anchor.id === 'stack-live-agent') return;

        if (anchor.id === 'stack-summary') {
          const summaryPanel = anchor.nextElementSibling;
          const navHeight =
            document.querySelector<HTMLElement>('nav')?.getBoundingClientRect().height ?? 0;
          const panelTop =
            summaryPanel instanceof HTMLElement
              ? getStaticTop(summaryPanel, root)
              : getStaticTop(anchor, root);
          const panelHeight =
            summaryPanel instanceof HTMLElement ? summaryPanel.offsetHeight : root.clientHeight;

          summaryTopRef.current = Math.max(0, panelTop - navHeight + SUMMARY_TOP_OVERLAP);
          summaryBottomRef.current = panelTop + panelHeight;
          points.push(summaryTopRef.current);
          return;
        }

        points.push(getStaticTop(anchor, root));
      });

      pageTopsRef.current = Array.from(new Set(points.map(point => Math.round(point)))).sort(
        (a, b) => a - b
      );
    };
    const getPageTops = () => pageTopsRef.current;
    const getScrollMax = () => {
      const naturalMax = Math.max(0, root.scrollHeight - root.clientHeight);
      if (!Number.isFinite(summaryBottomRef.current)) return naturalMax;

      return Math.max(
        0,
        Math.min(
          naturalMax,
          Math.max(summaryTopRef.current, summaryBottomRef.current - root.clientHeight)
        )
      );
    };
    const getLastPoint = () => Math.max(pageTopsRef.current.at(-1) ?? 0, getScrollMax());
    const clampTarget = (value: number) => Math.min(getLastPoint(), Math.max(0, value));
    const clampMotion = (value: number) =>
      Math.max(motionMinRef.current, Math.min(motionMaxRef.current, clampTarget(value)));
    const isScrollableSummaryArea = (direction: -1 | 1) => {
      const summaryTop = summaryTopRef.current;
      if (!Number.isFinite(summaryTop)) return false;

      const scrollMax = getScrollMax();
      if (scrollMax <= summaryTop + POSITION_EPSILON) return false;

      return direction > 0
        ? root.scrollTop >= summaryTop - POSITION_EPSILON
        : root.scrollTop > summaryTop + POSITION_EPSILON;
    };
    const isHomeTarget = (value: number | undefined) =>
      value !== undefined && value <= POSITION_EPSILON;
    const isMobileViewport = () => window.innerWidth <= MOBILE_BREAKPOINT_PX;
    const clearTrackpadRelease = () => {
      if (trackpadReleaseTimerRef.current !== null) {
        window.clearTimeout(trackpadReleaseTimerRef.current);
        trackpadReleaseTimerRef.current = null;
      }
    };
    const clearTrackpadStart = () => {
      if (trackpadStartTimerRef.current !== null) {
        window.clearTimeout(trackpadStartTimerRef.current);
        trackpadStartTimerRef.current = null;
      }
    };
    const resetTrackpadGesture = () => {
      clearTrackpadStart();
      clearTrackpadRelease();
      trackpadConsumedRef.current = false;
      trackpadPendingDirectionRef.current = null;
      trackpadLastEventAtRef.current = 0;
      trackpadLastIntentAtRef.current = 0;
      trackpadLastDeltaRef.current = 0;
      trackpadPeakDeltaRef.current = 0;
      trackpadValleyDeltaRef.current = Number.POSITIVE_INFINITY;
      trackpadReintentArmedRef.current = false;
      trackpadRiseCountRef.current = 0;
    };
    const scheduleTrackpadRelease = () => {
      clearTrackpadRelease();
      trackpadReleaseTimerRef.current = window.setTimeout(() => {
        trackpadReleaseTimerRef.current = null;
        trackpadConsumedRef.current = false;
        trackpadPendingDirectionRef.current = null;
        trackpadLastEventAtRef.current = 0;
        trackpadLastIntentAtRef.current = 0;
        trackpadLastDeltaRef.current = 0;
        trackpadPeakDeltaRef.current = 0;
        trackpadValleyDeltaRef.current = Number.POSITIVE_INFINITY;
        trackpadReintentArmedRef.current = false;
        trackpadRiseCountRef.current = 0;
      }, TRACKPAD_SESSION_IDLE_MS);
    };
    function startTrackpadPage(direction: -1 | 1, intentOrigin = scrollRoot.scrollTop) {
      const points = getPageTops();
      const target = getAdjacentTarget(points, intentOrigin, direction);

      if (target === undefined) {
        scheduleTrackpadRelease();
        return;
      }

      if (direction < 0 && isHomeTarget(target) && scrollRoot.scrollTop > POSITION_EPSILON) {
        requestHomeTransition({
          freshGesture: true,
          fromCurrent: Math.abs(scrollRoot.scrollTop - scrollRoot.clientHeight) > POSITION_EPSILON,
        });
        return;
      }

      cancelAnimation();
      lastDirectionRef.current = direction;
      gestureStartRef.current = scrollRoot.scrollTop;
      motionMinRef.current = 0;
      motionMaxRef.current = getLastPoint();
      easeToTarget(target, undefined, easeOutQuint, undefined, TRACKPAD_MAX_VELOCITY);
    }
    const requestHomeTransition = (
      options: { freshGesture?: boolean; fromCurrent?: boolean } = {}
    ) => {
      cancelSnap();
      cancelAnimation();
      velocityRef.current = 0;
      lastInputTimeRef.current = 0;
      resetTrackpadGesture();
      window.dispatchEvent(
        new CustomEvent('landing:request-path-back', {
          detail: {
            force: true,
            fromCurrent: Boolean(options.fromCurrent),
            freshGesture: Boolean(options.freshGesture),
          },
        })
      );
    };
    const requestMouseHomeTransition = () => {
      requestHomeTransition({
        freshGesture: true,
        fromCurrent:
          Math.abs(scrollRoot.scrollTop - scrollRoot.clientHeight) >
          HOME_TRANSITION_PAGE_TOLERANCE,
      });
    };
    const getAdjacentTarget = (points: number[], origin: number, direction: -1 | 1) => {
      if (direction > 0) {
        return points.find(point => point > origin + POSITION_EPSILON);
      }

      return [...points].reverse().find(point => point < origin - POSITION_EPSILON);
    };
    const dispatchSettled = () => {
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
      onComplete?: () => void,
      maxSpeed = Number.POSITIVE_INFINITY
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
      let previousTime = startedAt;

      const tick = (now: number) => {
        const progress = Math.min((now - startedAt) / duration, 1);
        const desiredPosition = clampMotion(start + distance * easing(progress));
        const elapsed = Math.max(0, now - previousTime) / 1000;
        const maxStep = Number.isFinite(maxSpeed)
          ? maxSpeed * elapsed
          : Number.POSITIVE_INFINITY;
        const remainingStep = desiredPosition - root.scrollTop;
        const nextPosition =
          Math.abs(remainingStep) <= maxStep
            ? desiredPosition
            : root.scrollTop + Math.sign(remainingStep) * maxStep;
        previousTime = now;
        root.scrollTop = clampMotion(nextPosition);

        if (
          progress < 1 ||
          Math.abs(target - root.scrollTop) > POSITION_EPSILON
        ) {
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
      const points = getPageTops();
      const current = root.scrollTop;
      const target =
        direction > 0
          ? points.find(point => point > current + POSITION_EPSILON)
          : [...points].reverse().find(point => point < current - POSITION_EPSILON);

      if (target !== undefined) {
        if (direction < 0 && isHomeTarget(target) && root.scrollTop > POSITION_EPSILON) {
          requestHomeTransition();
          return;
        }

        lastDirectionRef.current = direction;
        motionMinRef.current = 0;
        motionMaxRef.current = getLastPoint();
        easeToTarget(target);
      }
    };

    const settleToPage = () => {
      snapTimerRef.current = null;
      const points = getPageTops();
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
        const pageDistance = upper - lower;
        const progress = (position - lower) / pageDistance;
        const snapThreshold = Math.min(
          0.42,
          Math.max(SNAP_DIRECTION_THRESHOLD, SNAP_MIN_DISTANCE_PX / pageDistance)
        );
        target =
          lastDirectionRef.current > 0
            ? progress >= snapThreshold
              ? upper
              : lower
            : progress <= 1 - snapThreshold
              ? lower
              : upper;
      }

      if (lastDirectionRef.current < 0 && isHomeTarget(target) && root.scrollTop > POSITION_EPSILON) {
        requestMouseHomeTransition();
        return;
      }

      motionMinRef.current = 0;
      motionMaxRef.current = getLastPoint();
      easeToTarget(target);
    };

    const scheduleSnap = (delay: number) => {
      cancelSnap();
      snapTimerRef.current = window.setTimeout(settleToPage, delay);
    };

    type MobilePanelPoint = {
      bottom: number;
      top: number;
    };

    const getMobilePanelPoints = () => {
      const viewportHeight = root.clientHeight;

      return Array.from(document.querySelectorAll<HTMLElement>('.stack-anchor'))
        .filter(anchor => anchor.id !== 'stack-home')
        .map((anchor): MobilePanelPoint | null => {
          const panel = anchor.nextElementSibling;
          if (!(panel instanceof HTMLElement)) return null;

          const navHeight =
            document.querySelector<HTMLElement>('nav')?.getBoundingClientRect().height ?? 0;
          const top =
            anchor.id === 'stack-live-agent'
              ? viewportHeight
              : anchor.id === 'stack-summary'
                ? Math.max(0, panel.offsetTop - navHeight + SUMMARY_TOP_OVERLAP)
                : anchor.offsetTop;
          const contentBottom = panel.offsetTop + panel.scrollHeight;

          return {
            top,
            bottom: Math.max(top + viewportHeight, contentBottom),
          };
        })
        .filter((point): point is MobilePanelPoint => point !== null)
        .sort((a, b) => a.top - b.top);
    };

    const getCurrentMobilePanel = () =>
      [...getMobilePanelPoints()]
        .reverse()
        .find(point => point.top <= root.scrollTop + MOBILE_PAGE_EDGE_TOLERANCE);

    const getMobileAdjacentTarget = (direction: -1 | 1) => {
      const panels = getMobilePanelPoints();
      const current = root.scrollTop;
      const viewportHeight = root.clientHeight;

      if (direction > 0) {
        const currentPanel = [...panels]
          .reverse()
          .find(point => point.top <= current + MOBILE_PAGE_EDGE_TOLERANCE);
        const nextPanel = panels.find(point => point.top > current + POSITION_EPSILON);
        if (!currentPanel || !nextPanel) return undefined;

        const hasReadCurrentPanel =
          current + viewportHeight >= currentPanel.bottom - MOBILE_PANEL_END_TOLERANCE;
        return hasReadCurrentPanel ? nextPanel.top : undefined;
      }

      const currentPanel = [...panels]
        .reverse()
        .find(point => point.top <= current + POSITION_EPSILON);
      if (!currentPanel) return undefined;

      const targetPanel = [...panels]
        .reverse()
        .find(point => point.top < currentPanel.top - POSITION_EPSILON);
      const isAtCurrentPanelTop = current <= currentPanel.top + MOBILE_PAGE_EDGE_TOLERANCE;
      if (!isAtCurrentPanelTop) return undefined;

      return targetPanel?.top ?? 0;
    };
    const pageMobileSection = (direction: -1 | 1) => {
      const target = getMobileAdjacentTarget(direction);
      if (target === undefined) return;

      cancelSnap();
      cancelAnimation();
      resetTrackpadGesture();

      if (direction < 0 && isHomeTarget(target) && root.scrollTop > POSITION_EPSILON) {
        requestHomeTransition();
        return;
      }

      lastDirectionRef.current = direction;
      motionMinRef.current = 0;
      motionMaxRef.current = getLastPoint();
      easeToTarget(target, MOBILE_PAGE_DURATION);
    };

    const onWheel = (event: WheelEvent) => {
      if (isMobileViewport()) return;

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
      const isNewGesture = now - lastInputTimeRef.current > MOUSE_GESTURE_IDLE_MS;
      const direction = wheelDelta > 0 ? 1 : -1;
      const hasActiveTrackpadGesture =
        trackpadConsumedRef.current ||
        trackpadStartTimerRef.current !== null;
      const isTrackpadInput =
        hasActiveTrackpadGesture || isLikelyTrackpad(event, wheelDelta);

      if (
        animationModeRef.current !== null &&
        direction !== lastDirectionRef.current &&
        (!isTrackpadInput || !hasActiveTrackpadGesture)
      ) {
        cancelAnimation();
        resetTrackpadGesture();
        targetRef.current = root.scrollTop;
        gestureStartRef.current = root.scrollTop;
        velocityRef.current = 0;
        motionMinRef.current = 0;
        motionMaxRef.current = getLastPoint();
      }

      if (
        !isTrackpadInput &&
        direction < 0 &&
        Math.abs(root.scrollTop - root.clientHeight) <= HOME_TRANSITION_PAGE_TOLERANCE
      ) {
        requestMouseHomeTransition();
        return;
      }

      if (!isTrackpadInput && animationModeRef.current === 'ease' && isNewGesture) {
        cancelAnimation();
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

      if (isScrollableSummaryArea(direction)) {
        cancelAnimation();
        resetTrackpadGesture();
        const scrollMax = getScrollMax();
        const summaryTop = summaryTopRef.current;
        const nextTop = Math.max(summaryTop, Math.min(scrollMax, root.scrollTop + wheelDelta));

        root.scrollTop = nextTop;
        targetRef.current = nextTop;
        gestureStartRef.current = nextTop;
        velocityRef.current = 0;
        lastDirectionRef.current = direction;
        lastInputTimeRef.current = now;
        motionMinRef.current = summaryTop;
        motionMaxRef.current = scrollMax;
        return;
      }

      if (isTrackpadInput) {
        const deltaMagnitude = Math.abs(wheelDelta);
        const previousEventAt = trackpadLastEventAtRef.current;
        const previousDelta = trackpadLastDeltaRef.current;
        const previousPeak = Math.max(trackpadPeakDeltaRef.current, deltaMagnitude);
        const eventGap = previousEventAt > 0 ? now - previousEventAt : Number.POSITIVE_INFINITY;
        const timeSinceIntent = now - trackpadLastIntentAtRef.current;
        const armThreshold = Math.max(5, Math.min(10, previousPeak * 0.2));
        const reintentThreshold = Math.max(
          TRACKPAD_REINTENT_MIN_DELTA,
          Math.min(TRACKPAD_REINTENT_MAX_DELTA, previousPeak * 0.35)
        );
        const freshGapThreshold = Math.max(10, Math.min(20, previousPeak * 0.28));
        const previousValley = Number.isFinite(trackpadValleyDeltaRef.current)
          ? trackpadValleyDeltaRef.current
          : Math.max(1, previousDelta);
        const isRising =
          previousDelta > 0 &&
          deltaMagnitude >= previousDelta * 1.15 &&
          deltaMagnitude - previousDelta >= 2;
        const nextRiseCount = isRising
          ? trackpadRiseCountRef.current + 1
          : deltaMagnitude < previousDelta * 0.95
            ? 0
            : trackpadRiseCountRef.current;
        const isFreshGapIntent =
          trackpadConsumedRef.current &&
          timeSinceIntent >= TRACKPAD_REINTENT_DELAY_MS &&
          eventGap >= TRACKPAD_FRESH_GAP_MS &&
          deltaMagnitude >= freshGapThreshold &&
          deltaMagnitude - previousDelta >= 4;
        const isRenewedImpulse =
          trackpadConsumedRef.current &&
          trackpadReintentArmedRef.current &&
          timeSinceIntent >= TRACKPAD_REINTENT_DELAY_MS &&
          nextRiseCount >= 2 &&
          deltaMagnitude >= reintentThreshold &&
          deltaMagnitude >= previousValley * TRACKPAD_REINTENT_RATIO &&
          deltaMagnitude - previousValley >= TRACKPAD_REINTENT_RISE;
        const isReverseIntent =
          trackpadConsumedRef.current &&
          timeSinceIntent >= TRACKPAD_REVERSE_DELAY_MS &&
          direction !== lastDirectionRef.current &&
          deltaMagnitude >= TRACKPAD_REINTENT_MIN_DELTA &&
          (eventGap >= 40 || nextRiseCount >= 1);

        trackpadLastEventAtRef.current = now;
        trackpadLastDeltaRef.current = deltaMagnitude;
        trackpadPeakDeltaRef.current = previousPeak;
        trackpadRiseCountRef.current = nextRiseCount;
        if (
          timeSinceIntent >= TRACKPAD_REINTENT_DELAY_MS &&
          deltaMagnitude <= armThreshold
        ) {
          trackpadReintentArmedRef.current = true;
          trackpadValleyDeltaRef.current = Math.min(previousValley, deltaMagnitude);
        }
        lastInputTimeRef.current = now;
        scheduleTrackpadRelease();

        if (trackpadStartTimerRef.current !== null) {
          trackpadPendingDirectionRef.current = direction;
          return;
        }

        if (trackpadConsumedRef.current) {
          if (isFreshGapIntent || isRenewedImpulse || isReverseIntent) {
            trackpadLastIntentAtRef.current = now;
            trackpadPeakDeltaRef.current = deltaMagnitude;
            trackpadValleyDeltaRef.current = Number.POSITIVE_INFINITY;
            trackpadReintentArmedRef.current = false;
            trackpadRiseCountRef.current = 0;
            const intentOrigin =
              animationModeRef.current === 'ease' ? targetRef.current : scrollRoot.scrollTop;
            startTrackpadPage(direction, intentOrigin);
          }
          return;
        }

        trackpadConsumedRef.current = true;
        trackpadLastIntentAtRef.current = now;
        trackpadPeakDeltaRef.current = deltaMagnitude;
        trackpadValleyDeltaRef.current = Number.POSITIVE_INFINITY;
        trackpadReintentArmedRef.current = false;
        trackpadRiseCountRef.current = 0;
        trackpadPendingDirectionRef.current = direction;
        trackpadStartTimerRef.current = window.setTimeout(() => {
          trackpadStartTimerRef.current = null;
          const intendedDirection = trackpadPendingDirectionRef.current ?? direction;
          trackpadPendingDirectionRef.current = null;
          const intentOrigin =
            animationModeRef.current === 'ease' ? targetRef.current : scrollRoot.scrollTop;
          startTrackpadPage(intendedDirection, intentOrigin);
        }, TRACKPAD_START_DELAY_MS);
        return;
      }

      resetTrackpadGesture();

      if (isNewGesture) {
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

      const nextTarget = clampTarget(
        Math.max(
          motionMinRef.current,
          Math.min(motionMaxRef.current, targetRef.current + step)
        )
      );

      if (direction < 0 && isHomeTarget(nextTarget) && root.scrollTop > POSITION_EPSILON) {
        requestMouseHomeTransition();
        return;
      }

      targetRef.current = nextTarget;
      velocityRef.current = Math.max(
        -MAX_VELOCITY,
        Math.min(MAX_VELOCITY, velocityRef.current + step * velocityImpulse)
      );
      startAnimation();
      scheduleSnap(MOUSE_SNAP_IDLE_MS);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (isMobileViewport()) return;

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
    const onTouchStart = (event: TouchEvent) => {
      if (isMobileViewport()) return;

      touchStartYRef.current = event.touches[0]?.clientY ?? null;
      touchStartTopRef.current = root.scrollTop;
      const currentPanelBottom =
        getCurrentMobilePanel()?.bottom ?? Number.POSITIVE_INFINITY;
      touchPanelBottomRef.current = currentPanelBottom;
      touchStartedAtPanelEndRef.current =
        root.scrollTop + root.clientHeight >=
        currentPanelBottom - MOBILE_PANEL_END_TOLERANCE;
    };
    const onTouchMove = (event: TouchEvent) => {
      if (isMobileViewport() || touchStartYRef.current === null) return;

      const y = event.touches[0]?.clientY;
      if (y === undefined) return;

      const deltaY = touchStartYRef.current - y;
      if (deltaY <= 0) return;

      const maxCurrentPanelTop = touchPanelBottomRef.current - root.clientHeight;
      if (!Number.isFinite(maxCurrentPanelTop)) return;

      const panelBottomIsVisible =
        touchStartTopRef.current + root.clientHeight >=
        touchPanelBottomRef.current - MOBILE_PANEL_END_TOLERANCE;
      if (panelBottomIsVisible) return;

      const clampedTop = Math.max(touchStartTopRef.current, maxCurrentPanelTop);
      if (root.scrollTop >= clampedTop - POSITION_EPSILON) {
        event.preventDefault();
        root.scrollTop = clampedTop;
        targetRef.current = clampedTop;
      }
    };
    const onTouchEnd = (event: TouchEvent) => {
      if (isMobileViewport()) return;

      const startY = touchStartYRef.current;
      touchStartYRef.current = null;
      touchPanelBottomRef.current = Number.POSITIVE_INFINITY;
      const startedAtPanelEnd = touchStartedAtPanelEndRef.current;
      touchStartedAtPanelEndRef.current = false;
      if (startY === null || root.style.overflowY === 'hidden') return;

      const endY = event.changedTouches[0]?.clientY;
      if (endY === undefined) return;

      const deltaY = startY - endY;
      if (Math.abs(deltaY) < MOBILE_TOUCH_TRIGGER_PX) return;
      if (deltaY > 0 && !startedAtPanelEnd) return;

      const nativeScrollDistance = Math.abs(root.scrollTop - touchStartTopRef.current);
      if (nativeScrollDistance > root.clientHeight * 0.72) return;

      pageMobileSection(deltaY > 0 ? 1 : -1);
    };
    const onTouchCancel = () => {
      touchStartYRef.current = null;
      touchPanelBottomRef.current = Number.POSITIVE_INFINITY;
      touchStartedAtPanelEndRef.current = false;
    };

    const onScroll = () => {
      if (isMobileViewport()) return;

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
      resetTrackpadGesture();
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
      resetTrackpadGesture();
      velocityRef.current = 0;

      if (resizeFrameRef.current !== null) {
        window.cancelAnimationFrame(resizeFrameRef.current);
      }

      resizeFrameRef.current = window.requestAnimationFrame(() => {
        resizeFrameRef.current = null;
        refreshPageTops();
        if (isMobileViewport()) {
          targetRef.current = root.scrollTop;
          gestureStartRef.current = root.scrollTop;
          lastInputTimeRef.current = 0;
          motionMinRef.current = 0;
          motionMaxRef.current = getLastPoint();
          return;
        }

        const points = getPageTops();
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

    const onPathTransitionStart = () => {
      cancelSnap();
      cancelAnimation();
      resetTrackpadGesture();
      velocityRef.current = 0;
      lastInputTimeRef.current = 0;
      targetRef.current = root.scrollTop;
      gestureStartRef.current = root.scrollTop;
      motionMinRef.current = 0;
      motionMaxRef.current = getLastPoint();
    };

    refreshPageTops();
    targetRef.current = root.scrollTop;
    gestureStartRef.current = root.scrollTop;
    motionMaxRef.current = getLastPoint();
    root.addEventListener('wheel', onWheel, { passive: false });
    root.addEventListener('scroll', onScroll, { passive: true });
    root.addEventListener('click', onClick);
    root.addEventListener('touchstart', onTouchStart, { passive: true });
    root.addEventListener('touchmove', onTouchMove, { passive: false });
    root.addEventListener('touchend', onTouchEnd, { passive: true });
    root.addEventListener('touchcancel', onTouchCancel, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);
    window.addEventListener('landing:path-transition-start', onPathTransitionStart);

    return () => {
      cancelSnap();
      cancelAnimation();
      resetTrackpadGesture();
      if (resizeFrameRef.current !== null) {
        window.cancelAnimationFrame(resizeFrameRef.current);
      }
      root.removeEventListener('wheel', onWheel);
      root.removeEventListener('scroll', onScroll);
      root.removeEventListener('click', onClick);
      root.removeEventListener('touchstart', onTouchStart);
      root.removeEventListener('touchmove', onTouchMove);
      root.removeEventListener('touchend', onTouchEnd);
      root.removeEventListener('touchcancel', onTouchCancel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('landing:path-transition-start', onPathTransitionStart);
    };
  }, []);

  return null;
}
