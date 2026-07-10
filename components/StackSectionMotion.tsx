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
const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3);
const easeOutBack = (value: number) => {
  const c1 = 1.35;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(value - 1, 3) + c1 * Math.pow(value - 1, 2);
};

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
        type === 'header' ? index * 0.035 : type === 'group' ? index * 0.05 : index * 0.035;
      const rawProgress = clamp((sectionProgress - offset) / (1 - offset));
      const itemProgress = smoothstep(rawProgress);
      const impactProgress = clamp(easeOutBack(rawProgress));
      const fastProgress = easeOutCubic(rawProgress);
      const remaining = 1 - itemProgress;
      const impactRemaining = 1 - impactProgress;
      const fastRemaining = 1 - fastProgress;

      element.style.opacity = (0.08 + fastProgress * 0.92).toFixed(3);
      element.style.clipPath = '';
      element.style.transformOrigin = '';

      if (type === 'split') {
        const direction = index === 0 ? -1 : 1;
        const scale = 0.84 + impactProgress * 0.16;
        element.style.transform = `translate3d(${(direction * impactRemaining * 260).toFixed(
          2
        )}px, ${(fastRemaining * 28).toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
        return;
      }

      if (type === 'group') {
        const direction = index % 2 === 0 ? -1 : 1;

        if (variant === 'fan') {
          const scale = 0.88 + impactProgress * 0.12;
          element.style.transformOrigin = '50% 100%';
          element.style.transform = `translate3d(${(direction * impactRemaining * 150).toFixed(
            2
          )}px, ${(fastRemaining * 56).toFixed(2)}px, 0) rotate(${(
            direction *
            impactRemaining *
            8
          ).toFixed(2)}deg) scale(${scale.toFixed(4)})`;
          return;
        }

        if (variant === 'tilt') {
          const scale = 0.78 + impactProgress * 0.22;
          element.style.transformOrigin = '50% 100%';
          element.style.transform = `perspective(900px) translate3d(${(
            direction *
            impactRemaining *
            34
          ).toFixed(2)}px, ${(fastRemaining * 120).toFixed(2)}px, 0) rotateX(${(
            fastRemaining * 30
          ).toFixed(2)}deg) rotateZ(${(direction * impactRemaining * 2.8).toFixed(
            2
          )}deg) scale(${scale.toFixed(4)})`;
          return;
        }

        if (variant === 'steps') {
          element.style.opacity = (0.16 + fastProgress * 0.84).toFixed(3);
          element.style.clipPath = `inset(0 ${(fastRemaining * 100).toFixed(2)}% 0 0)`;
          element.style.transformOrigin = '0 50%';
          element.style.transform = `translate3d(${(-fastRemaining * 96).toFixed(
            2
          )}px, ${(impactRemaining * 18).toFixed(2)}px, 0) scaleX(${(
            0.9 +
            impactProgress * 0.1
          ).toFixed(4)})`;
          return;
        }

        if (variant === 'weave') {
          const rowDirection = index < 3 ? -1 : 1;
          const scale = 0.86 + impactProgress * 0.14;
          element.style.transform = `translate3d(${(direction * impactRemaining * 190).toFixed(
            2
          )}px, ${(rowDirection * impactRemaining * 46).toFixed(2)}px, 0) rotate(${(
            direction *
            impactRemaining *
            5
          ).toFixed(2)}deg) scale(${scale.toFixed(4)})`;
          return;
        }

        if (variant === 'burst') {
          const columnDirection = index % 2 === 0 ? -1 : 1;
          const rowDirection = index < 2 ? -1 : 1;
          const scale = 0.7 + impactProgress * 0.3;
          element.style.transformOrigin = '50% 50%';
          element.style.transform = `translate3d(${(
            columnDirection *
            impactRemaining *
            132
          ).toFixed(2)}px, ${(fastRemaining * -24).toFixed(2)}px) rotate(${(
            columnDirection *
            impactRemaining *
            7
          ).toFixed(2)}deg) scale(${scale.toFixed(4)})`;
          return;
        }

        if (variant === 'split') {
          const columnDirection = index === 0 ? -1 : 1;
          const scale = 0.84 + impactProgress * 0.16;
          element.style.transform = `translate3d(${(
            columnDirection *
            impactRemaining *
            240
          ).toFixed(2)}px, ${(fastRemaining * 34).toFixed(
            2
          )}px, 0) scale(${scale.toFixed(4)})`;
          return;
        }

        const scale = 0.88 + impactProgress * 0.12;
        element.style.transform = `translate3d(0, ${(fastRemaining * 86).toFixed(
          2
        )}px, 0) scale(${scale.toFixed(4)})`;
        return;
      }

      if (variant === 'fan') {
        element.style.transform = `translate3d(${(-fastRemaining * 90).toFixed(
          2
        )}px, ${(fastRemaining * 12).toFixed(2)}px, 0)`;
        return;
      }

      if (variant === 'steps') {
        element.style.opacity = (0.18 + fastProgress * 0.82).toFixed(3);
        element.style.clipPath = `inset(0 ${(fastRemaining * 100).toFixed(2)}% 0 0)`;
        element.style.transform = `translate3d(${(-fastRemaining * 58).toFixed(
          2
        )}px, ${(fastRemaining * 10).toFixed(2)}px, 0)`;
        return;
      }

      if (variant === 'burst') {
        const scale = 0.82 + impactProgress * 0.18;
        element.style.transform = `translate3d(0, ${(fastRemaining * 58).toFixed(
          2
        )}px, 0) scale(${scale.toFixed(4)})`;
        return;
      }

      if (variant === 'tilt') {
        element.style.transform = `translate3d(0, ${(fastRemaining * 64).toFixed(
          2
        )}px, 0)`;
        return;
      }

      if (variant === 'weave') {
        element.style.transform = `translate3d(0, ${(fastRemaining * 48).toFixed(
          2
        )}px, 0)`;
        return;
      }

      element.style.transform = `translate3d(0, ${(fastRemaining * 52).toFixed(2)}px, 0)`;
    };

    const update = () => {
      frame = null;
      const viewportHeight = root.clientHeight;

      sections.forEach(({ anchor, items }) => {
        if (!anchor) return;

        const start = anchor.offsetTop - viewportHeight * 0.7;
        const end = anchor.offsetTop;
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
