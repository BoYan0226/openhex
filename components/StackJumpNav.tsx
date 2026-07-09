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

export function StackJumpNav({ items }: StackJumpNavProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const jumpFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-landing-scroll-root]');
    const targets = items.map(item => document.getElementById(item.id));
    const summary = document.getElementById('stack-summary');
    if (!root) return undefined;

    let frame: number | null = null;

    const cancelJump = () => {
      if (jumpFrameRef.current !== null) {
        window.cancelAnimationFrame(jumpFrameRef.current);
        jumpFrameRef.current = null;
      }
    };

    const update = () => {
      frame = null;

      const isOpeningScreen = root.scrollTop < root.clientHeight * 0.65;
      const isSummaryScreen = Boolean(
        summary && root.scrollTop >= summary.offsetTop - root.clientHeight * 0.15
      );

      if (isOpeningScreen || isSummaryScreen) {
        setActiveIndex(null);
        return;
      }

      const probe = root.scrollTop + Math.min(root.clientHeight * 0.38, 280);
      let nextIndex = 0;

      targets.forEach((target, index) => {
        if (target && target.offsetTop <= probe) nextIndex = index;
      });

      setActiveIndex(nextIndex);
    };

    const requestUpdate = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(update);
    };

    root.addEventListener('scroll', requestUpdate, { passive: true });
    root.addEventListener('wheel', cancelJump, { passive: true });
    window.addEventListener('resize', requestUpdate);
    requestUpdate();

    return () => {
      cancelJump();
      if (frame !== null) window.cancelAnimationFrame(frame);
      root.removeEventListener('scroll', requestUpdate);
      root.removeEventListener('wheel', cancelJump);
      window.removeEventListener('resize', requestUpdate);
    };
  }, [items]);

  const handleJump = (id: string) => {
    const root = document.querySelector<HTMLElement>('[data-landing-scroll-root]');
    const target = document.getElementById(id);

    if (!root || !target) return;

    const topValue = getComputedStyle(target).getPropertyValue('--sticky-offset');
    const offsetRem = Number.parseFloat(topValue) || 0;
    const targetTop = target.offsetTop - offsetRem * getRemInPixels();
    const startTop = root.scrollTop;
    const distance = Math.max(0, targetTop) - startTop;

    if (jumpFrameRef.current !== null) {
      window.cancelAnimationFrame(jumpFrameRef.current);
    }

    const duration = Math.min(1400, Math.max(700, Math.abs(distance) * 0.16));
    const startTime = performance.now();
    const direction = Math.sign(distance);
    const overshoot = Math.min(10, Math.max(4, Math.abs(distance) * 0.0025));

    const animateJump = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const arrivalProgress = Math.min(1, progress / 0.84);
      const arrivalEase = 1 - (1 - arrivalProgress) ** 3;
      const settleProgress = Math.max(0, (progress - 0.84) / 0.16);
      const settleEase = settleProgress * settleProgress * (3 - 2 * settleProgress);
      const arrivalTop =
        startTop + (distance + direction * overshoot) * arrivalEase;

      root.scrollTop =
        progress < 0.84
          ? arrivalTop
          : Math.max(0, targetTop) + direction * overshoot * (1 - settleEase);

      if (progress >= 1) {
        root.scrollTop = Math.max(0, targetTop);
        jumpFrameRef.current = null;
        return;
      }

      jumpFrameRef.current = window.requestAnimationFrame(animateJump);
    };

    jumpFrameRef.current = window.requestAnimationFrame(animateJump);
  };

  return (
    <nav
      className="stack-jump-nav"
      aria-label="Stack section navigation"
      data-visible={activeIndex !== null ? 'true' : 'false'}
      style={{ '--stack-active-index': activeIndex ?? 0 } as CSSProperties}
    >
      <span className="stack-jump-indicator" aria-hidden />
      {items.map((item, index) => (
        <button
          key={item.id}
          type="button"
          className="stack-jump-label"
          data-active={activeIndex === index ? 'true' : 'false'}
          aria-current={activeIndex === index ? 'page' : undefined}
          style={{ '--stack-label-index': index } as CSSProperties}
          onClick={() => handleJump(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
