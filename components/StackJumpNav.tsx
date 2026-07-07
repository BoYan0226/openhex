'use client';

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
    <nav className="stack-jump-nav" aria-label="Stack section navigation">
      {items.map((item, index) => (
        <button
          key={item.id}
          type="button"
          className="stack-jump-label"
          style={{ '--stack-label-index': index } as CSSProperties}
          onClick={() => handleJump(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
