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

function getRemInPixels() {
  return Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
}

function easeOutCubic(value: number) {
  return 1 - (1 - value) ** 3;
}

export function StackJumpNav({ items }: StackJumpNavProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [navPhase, setNavPhase] = useState<'opening' | 'active' | 'summary'>('opening');
  const jumpFrameRef = useRef<number | null>(null);
  const visibleActiveIndex = activeIndex ?? 0;

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-landing-scroll-root]');
    const targets = items.map(item => document.getElementById(item.id));
    const summary = document.getElementById('stack-summary');
    if (!root) return undefined;

    let frame: number | null = null;

    const update = () => {
      frame = null;

      const isOpeningScreen = root.scrollTop < root.clientHeight * 0.65;
      const isSummaryScreen = Boolean(
        summary && root.scrollTop >= summary.offsetTop - root.clientHeight * 0.15
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

      const probe = root.scrollTop + Math.min(root.clientHeight * 0.38, 280);
      let nextIndex = 0;

      targets.forEach((target, index) => {
        if (target && target.offsetTop <= probe) nextIndex = index;
      });

      setActiveIndex(current => (current === nextIndex ? current : nextIndex));
      setNavPhase(current => (current === 'active' ? current : 'active'));
    };

    const requestUpdate = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(update);
    };

    root.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    requestUpdate();

    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      root.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
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
      return;
    }

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      root.scrollTop = startTop + distance * easeOutCubic(progress);

      if (progress < 1) {
        jumpFrameRef.current = window.requestAnimationFrame(tick);
        return;
      }

      root.scrollTop = targetTop;
      jumpFrameRef.current = null;
    };

    jumpFrameRef.current = window.requestAnimationFrame(tick);
  };

  const handleJump = (id: string) => {
    const root = document.querySelector<HTMLElement>('[data-landing-scroll-root]');
    const target = document.getElementById(id);

    if (!root || !target) return;

    if (id === 'stack-home') {
      window.dispatchEvent(
        new CustomEvent('landing:request-path-back', {
          detail: { force: true },
        })
      );
      return;
    }

    const topValue = getComputedStyle(target).getPropertyValue('--sticky-offset');
    const offsetRem = Number.parseFloat(topValue) || 0;
    const targetTop = target.offsetTop - offsetRem * getRemInPixels();
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
        const blur = Math.min(0.36, distance * 0.06);

        return (
          <button
            key={item.id}
            type="button"
            className="stack-jump-label"
            data-active={activeIndex === index ? 'true' : 'false'}
            aria-current={activeIndex === index ? 'page' : undefined}
            style={
              {
                '--stack-label-y': `${((index - visibleActiveIndex) * 2.72).toFixed(2)}rem`,
                '--stack-label-shift': `${shift.toFixed(2)}rem`,
                '--stack-label-opacity': opacity.toFixed(2),
                '--stack-label-font-size': `clamp(${(0.94 * scale).toFixed(
                  3
                )}rem, ${(0.83 * scale).toFixed(3)}rem + ${(0.44 * scale).toFixed(
                  3
                )}vw, ${(1.24 * scale).toFixed(3)}rem)`,
                '--stack-label-blur': `${blur.toFixed(2)}px`,
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
