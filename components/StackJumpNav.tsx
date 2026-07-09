'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-landing-scroll-root]');
    const targets = items.map(item => document.getElementById(item.id));
    if (!root) return undefined;

    let frame: number | null = null;

    const update = () => {
      frame = null;

      if (root.scrollTop < root.clientHeight * 0.65) {
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
    window.addEventListener('resize', requestUpdate);
    requestUpdate();

    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      root.removeEventListener('scroll', requestUpdate);
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

    root.scrollTo({
      top: Math.max(0, targetTop),
      behavior: 'smooth',
    });
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
