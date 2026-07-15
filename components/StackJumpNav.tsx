'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

type StackJumpItem = {
  id: string;
  label: string;
};

type StackJumpNavProps = {
  items: readonly StackJumpItem[];
};

function easeOutCubic(value: number) {
  return 1 - (1 - value) ** 3;
}

const SUMMARY_TOP_OVERLAP = 2;

function getScrollTopForElement(root: HTMLElement, element: HTMLElement) {
  return root.scrollTop + element.getBoundingClientRect().top - root.getBoundingClientRect().top;
}

function getSummaryTop(root: HTMLElement, anchor: HTMLElement) {
  const summaryPanel = anchor.nextElementSibling;
  const navHeight = document.querySelector<HTMLElement>('nav')?.getBoundingClientRect().height ?? 0;
  const panelTop =
    summaryPanel instanceof HTMLElement
      ? getScrollTopForElement(root, summaryPanel)
      : getScrollTopForElement(root, anchor);

  return Math.max(0, panelTop - navHeight + SUMMARY_TOP_OVERLAP);
}

function getSectionTop(root: HTMLElement, anchor: HTMLElement) {
  if (anchor.id === 'stack-summary') return getSummaryTop(root, anchor);

  const panel = anchor.nextElementSibling;
  return panel instanceof HTMLElement
    ? getScrollTopForElement(root, panel)
    : getScrollTopForElement(root, anchor);
}

export function StackJumpNav({ items }: StackJumpNavProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [navPhase, setNavPhase] = useState<'opening' | 'active' | 'summary'>('opening');
  const jumpFrameRef = useRef<number | null>(null);
  const targetTopsRef = useRef<number[]>([]);
  const summaryTopRef = useRef(0);
  const visibleActiveIndex = activeIndex ?? 0;

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-landing-scroll-root]');
    const targets = items.map(item => document.getElementById(item.id));
    const summary = document.getElementById('stack-summary');
    if (!root) return undefined;

    let frame: number | null = null;
    const refreshTargetTops = () => {
      targetTopsRef.current = targets.map(target => (target ? getSectionTop(root, target) : 0));
      summaryTopRef.current = summary ? getSummaryTop(root, summary) : 0;
    };

    const update = () => {
      frame = null;

      const isOpeningScreen = root.scrollTop < root.clientHeight * 0.65;
      const isSummaryScreen = Boolean(
        summary && root.scrollTop >= summaryTopRef.current - root.clientHeight * 0.15
      );

      if (isOpeningScreen) {
        setNavPhase(current => (current === 'opening' ? current : 'opening'));
        setActiveIndex(current => (current === null ? current : null));
        return;
      }

      if (isSummaryScreen) {
        setNavPhase(current => (current === 'summary' ? current : 'summary'));
        setActiveIndex(current => (current === items.length - 1 ? current : items.length - 1));
        return;
      }

      const probe = root.scrollTop + root.clientHeight * 0.5;
      let nextIndex = 0;

      targetTopsRef.current.forEach((targetTop, index) => {
        if (targets[index] && targetTop <= probe) nextIndex = index;
      });

      const correctedIndex = Math.min(items.length - 1, Math.max(1, nextIndex));

      setActiveIndex(current => (current === correctedIndex ? current : correctedIndex));
      setNavPhase(current => (current === 'active' ? current : 'active'));
    };

    const requestUpdate = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(update);
    };

    const onResize = () => {
      refreshTargetTops();
      requestUpdate();
    };

    refreshTargetTops();
    root.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', onResize);
    requestUpdate();

    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      root.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', onResize);
      if (jumpFrameRef.current !== null) window.cancelAnimationFrame(jumpFrameRef.current);
    };
  }, [items]);

  const animateJump = (root: HTMLElement, targetTop: number) => {
    if (jumpFrameRef.current !== null) {
      window.cancelAnimationFrame(jumpFrameRef.current);
      jumpFrameRef.current = null;
    }

    const startTop = root.scrollTop;
    const distance = targetTop - startTop;
    const duration = Math.min(720, Math.max(360, Math.abs(distance) / 3.4));
    const startedAt = performance.now();

    if (Math.abs(distance) < 2) {
      root.scrollTop = targetTop;
      window.dispatchEvent(new CustomEvent('landing:stack-jump-complete'));
      return;
    }

    window.dispatchEvent(
      new CustomEvent('landing:stack-jump-start', {
        detail: { top: targetTop },
      })
    );

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      root.scrollTop = startTop + distance * easeOutCubic(progress);

      if (progress < 1) {
        jumpFrameRef.current = window.requestAnimationFrame(tick);
        return;
      }

      root.scrollTop = targetTop;
      jumpFrameRef.current = null;
      window.dispatchEvent(new CustomEvent('landing:stack-jump-complete'));
    };

    jumpFrameRef.current = window.requestAnimationFrame(tick);
  };

  const handleJump = (id: string) => {
    const root = document.querySelector<HTMLElement>('[data-landing-scroll-root]');
    const target = document.getElementById(id);

    if (!root || !target) return;

    if (id === 'stack-home') {
      if (root.scrollTop < root.clientHeight * 0.65) return;

      window.dispatchEvent(
        new CustomEvent('landing:request-path-back', {
          detail: { force: true, fromCurrent: true },
        })
      );
      return;
    }

    const targetTop = getSectionTop(root, target);
    animateJump(root, Math.max(0, targetTop));
  };

  return (
    <nav
      className="stack-jump-nav"
      aria-label="Stack section navigation"
      data-visible={activeIndex !== null ? 'true' : 'false'}
      data-phase={navPhase}
    >
      <span className="stack-jump-indicator" aria-hidden />
      {items.map((item, index) => {
        const distance = Math.abs(index - visibleActiveIndex);
        const shift = 0.55 + 3.7 * Math.exp(-distance * 0.42);
        const opacity = Math.max(0.2, 1 - distance * 0.14);
        const scale = Math.max(0.74, 1 - distance * 0.055);

        return (
          <button
            key={item.id}
            type="button"
            className="stack-jump-label"
            data-active={activeIndex === index ? 'true' : 'false'}
            aria-current={activeIndex === index ? 'page' : undefined}
            style={
              {
                '--stack-label-y': `calc(${((index - visibleActiveIndex) * 2.72).toFixed(
                  2
                )}rem * var(--stack-label-size-factor, 1))`,
                '--stack-label-shift': `calc(${shift.toFixed(
                  2
                )}rem * var(--stack-label-size-factor, 1))`,
                '--stack-label-opacity': opacity.toFixed(2),
                '--stack-label-scale': scale.toFixed(3),
              } as CSSProperties
            }
            onClick={() => handleJump(item.id)}
          >
            <span className="stack-jump-label-text">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
