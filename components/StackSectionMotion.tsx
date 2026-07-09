'use client';

import { useEffect } from 'react';

type MotionItem = {
  element: HTMLElement;
  index: number;
  type: 'group' | 'header' | 'split';
};

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const smoothstep = (value: number) => value * value * (3 - 2 * value);

export function StackSectionMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-landing-scroll-root]');
    if (!root) return undefined;

    const sections = Array.from(
      document.querySelectorAll<HTMLElement>('[data-stack-motion]')
    ).map(section => {
      const anchor = section.closest('.sticky-panel')?.previousElementSibling as HTMLElement | null;
      const items: MotionItem[] = [];

      (['header', 'group', 'split'] as const).forEach(type => {
        const container = section.querySelector<HTMLElement>(`[data-motion='${type}']`);
        if (!container) return;

        Array.from(container.children).forEach((child, index) => {
          if (child instanceof HTMLElement) items.push({ element: child, index, type });
        });
      });

      return { anchor, items };
    });

    let frame: number | null = null;

    const renderItem = ({ element, index, type }: MotionItem, sectionProgress: number) => {
      const offset =
        type === 'header' ? index * 0.08 : type === 'group' ? 0.14 + index * 0.07 : index * 0.08;
      const itemProgress = smoothstep(clamp((sectionProgress - offset) / (1 - offset)));
      const remaining = 1 - itemProgress;

      element.style.opacity = itemProgress.toFixed(3);

      if (type === 'split') {
        const direction = index === 0 ? -1 : 1;
        element.style.transform = `translate3d(${(direction * remaining * 160).toFixed(2)}px, 0, 0)`;
        return;
      }

      if (type === 'group') {
        const scale = 0.96 + itemProgress * 0.04;
        element.style.transform = `translate3d(0, ${(remaining * 76).toFixed(
          2
        )}px, 0) scale(${scale.toFixed(4)})`;
        return;
      }

      element.style.transform = `translate3d(0, ${(remaining * 52).toFixed(2)}px, 0)`;
    };

    const update = () => {
      frame = null;
      const viewportHeight = root.clientHeight;

      sections.forEach(({ anchor, items }) => {
        if (!anchor) return;

        const start = anchor.offsetTop - viewportHeight * 0.72;
        const end = anchor.offsetTop - viewportHeight * 0.08;
        const sectionProgress = clamp((root.scrollTop - start) / Math.max(1, end - start));

        items.forEach(item => renderItem(item, sectionProgress));
      });
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
  }, []);

  return null;
}
