'use client';

import { useEffect } from 'react';

type MotionItem = {
  element: HTMLElement;
  index: number;
  type: 'group' | 'header' | 'split';
  variant: 'burst' | 'fan' | 'rise' | 'split' | 'steps' | 'tilt' | 'weave';
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
      const variant = (section.dataset.motionStyle || 'rise') as MotionItem['variant'];

      (['header', 'group', 'split'] as const).forEach(type => {
        const container = section.querySelector<HTMLElement>(`[data-motion='${type}']`);
        if (!container) return;

        Array.from(container.children).forEach((child, index) => {
          if (child instanceof HTMLElement) items.push({ element: child, index, type, variant });
        });
      });

      return { anchor, items };
    });

    let frame: number | null = null;

    const renderItem = (
      { element, index, type, variant }: MotionItem,
      sectionProgress: number
    ) => {
      const offset =
        type === 'header' ? index * 0.04 : type === 'group' ? index * 0.035 : index * 0.04;
      const itemProgress = smoothstep(clamp((sectionProgress - offset) / (1 - offset)));
      const remaining = 1 - itemProgress;

      element.style.opacity = (0.18 + itemProgress * 0.82).toFixed(3);
      element.style.clipPath = '';
      element.style.transformOrigin = '';

      if (type === 'split') {
        const direction = index === 0 ? -1 : 1;
        const scale = 0.92 + itemProgress * 0.08;
        element.style.transform = `translate3d(${(direction * remaining * 150).toFixed(
          2
        )}px, 0, 0) scale(${scale.toFixed(4)})`;
        return;
      }

      if (type === 'group') {
        const direction = index % 2 === 0 ? -1 : 1;

        if (variant === 'fan') {
          const scale = 0.92 + itemProgress * 0.08;
          element.style.transform = `translate3d(${(direction * remaining * 110).toFixed(
            2
          )}px, ${(remaining * 46).toFixed(2)}px, 0) rotate(${(
            direction *
            remaining *
            6
          ).toFixed(2)}deg) scale(${scale.toFixed(4)})`;
          return;
        }

        if (variant === 'tilt') {
          const scale = 0.9 + itemProgress * 0.1;
          element.style.transformOrigin = '50% 100%';
          element.style.transform = `perspective(900px) translate3d(0, ${(
            remaining * 92
          ).toFixed(2)}px, 0) rotateX(${(remaining * 20).toFixed(
            2
          )}deg) scale(${scale.toFixed(4)})`;
          return;
        }

        if (variant === 'steps') {
          element.style.opacity = '1';
          element.style.clipPath = `inset(0 ${(remaining * 100).toFixed(2)}% 0 0)`;
          element.style.transform = `translate3d(${(-remaining * 70).toFixed(2)}px, 0, 0)`;
          return;
        }

        if (variant === 'weave') {
          element.style.transform = `translate3d(${(direction * remaining * 130).toFixed(
            2
          )}px, ${(remaining * 24).toFixed(2)}px, 0) rotate(${(
            direction *
            remaining *
            3
          ).toFixed(2)}deg)`;
          return;
        }

        if (variant === 'burst') {
          const columnDirection = index % 2 === 0 ? -1 : 1;
          const rowDirection = index < 2 ? -1 : 1;
          const scale = 0.84 + itemProgress * 0.16;
          element.style.transform = `translate3d(${(
            columnDirection *
            remaining *
            84
          ).toFixed(2)}px, ${(rowDirection * remaining * 64).toFixed(
            2
          )}px, 0) scale(${scale.toFixed(4)})`;
          return;
        }

        const scale = 0.94 + itemProgress * 0.06;
        element.style.transform = `translate3d(0, ${(remaining * 72).toFixed(
          2
        )}px, 0) scale(${scale.toFixed(4)})`;
        return;
      }

      if (variant === 'fan') {
        element.style.transform = `translate3d(${(-remaining * 86).toFixed(
          2
        )}px, 0, 0)`;
        return;
      }

      if (variant === 'steps') {
        element.style.opacity = '1';
        element.style.clipPath = `inset(0 ${(remaining * 100).toFixed(2)}% 0 0)`;
        element.style.transform = `translate3d(${(-remaining * 42).toFixed(2)}px, 0, 0)`;
        return;
      }

      if (variant === 'burst') {
        const scale = 0.86 + itemProgress * 0.14;
        element.style.transform = `translate3d(0, ${(remaining * 36).toFixed(
          2
        )}px, 0) scale(${scale.toFixed(4)})`;
        return;
      }

      element.style.transform = `translate3d(0, ${(remaining * 48).toFixed(2)}px, 0)`;
    };

    const update = () => {
      frame = null;
      const viewportHeight = root.clientHeight;

      sections.forEach(({ anchor, items }) => {
        if (!anchor) return;

        const start = anchor.offsetTop - viewportHeight * 0.7;
        const end = anchor.offsetTop + viewportHeight * 0.02;
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
