'use client';

import { useEffect } from 'react';

type MotionItem = {
  element: HTMLElement;
  index: number;
  type: 'group' | 'header' | 'split';
  variant: 'burst' | 'fan' | 'rise' | 'split' | 'steps' | 'tilt' | 'weave';
};

type SectionMotion = {
  element: HTMLElement;
  items: MotionItem[];
  lastProgress?: number;
};

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const smoothstep = (value: number) => value * value * (3 - 2 * value);
const MOTION_START_VIEWPORTS = 1.05;
const MOTION_END_VIEWPORTS = 0.05;
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

    const sections: SectionMotion[] = Array.from(
      document.querySelectorAll<HTMLElement>('[data-stack-motion]')
    ).map(section => {
      const items: MotionItem[] = [];
      const variant = (section.dataset.motionStyle || 'rise') as MotionItem['variant'];

      (['header', 'group', 'split'] as const).forEach(type => {
        const container = section.querySelector<HTMLElement>(`[data-motion='${type}']`);
        if (!container) return;

        Array.from(container.children).forEach((child, index) => {
          if (child instanceof HTMLElement) {
            child.style.opacity = '';
            child.style.filter = '';
            child.style.visibility = '';
            child.style.willChange = 'auto';
            items.push({ element: child, index, type, variant });
          }
        });
      });

      return { element: section, items };
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
      const fastProgress = itemProgress;
      const remaining = 1 - itemProgress;
      const impactRemaining = remaining;
      const fastRemaining = 1 - fastProgress;
      const isActive = rawProgress > 0.001 && rawProgress < 0.999;

      element.style.willChange = isActive ? 'transform' : 'auto';
      element.style.clipPath = '';
      element.style.transformOrigin = '';

      if (type === 'split') {
        const direction = index === 0 ? -1 : 1;
        const scale = 0.84 + impactProgress * 0.16;
        element.style.transform = `translate3d(${(direction * impactRemaining * 360).toFixed(
          2
        )}px, ${(fastRemaining * 50).toFixed(2)}px, 0) rotateY(${(
          direction *
          fastRemaining *
          -6
        ).toFixed(2)}deg) scale(${scale.toFixed(4)})`;
        return;
      }

      if (type === 'group') {
        const direction = index % 2 === 0 ? -1 : 1;

        if (variant === 'fan') {
          const scale = 0.88 + impactProgress * 0.12;
          element.style.transformOrigin = `${index % 2 === 0 ? 0 : 100}% 120%`;
          element.style.transform = `translate3d(${(direction * impactRemaining * 240).toFixed(
            2
          )}px, ${(fastRemaining * 88).toFixed(2)}px, 0) rotate(${(
            direction *
            impactRemaining *
            10
          ).toFixed(2)}deg) scale(${scale.toFixed(4)})`;
          return;
        }

        if (variant === 'tilt') {
          const scale = 0.72 + impactProgress * 0.28;
          element.style.transformOrigin = '50% 100%';
          element.style.transform = `perspective(900px) translate3d(${(
            direction *
            impactRemaining *
            88
          ).toFixed(2)}px, ${(fastRemaining * 180).toFixed(2)}px, 0) rotateX(${(
            fastRemaining * 19
          ).toFixed(2)}deg) rotateZ(${(direction * impactRemaining * 3).toFixed(
            2
          )}deg) scale(${scale.toFixed(4)})`;
          return;
        }

        if (variant === 'steps') {
          element.style.clipPath = `inset(0 ${(fastRemaining * 100).toFixed(
            2
          )}% 0 0 round ${(fastRemaining * 18).toFixed(2)}px)`;
          element.style.transformOrigin = '0 50%';
          element.style.transform = `translate3d(${(-fastRemaining * 150).toFixed(
            2
          )}px, ${(impactRemaining * 30).toFixed(2)}px, 0) skewX(${(
            -fastRemaining * 8
          ).toFixed(2)}deg) scaleX(${(
            0.9 +
            impactProgress * 0.1
          ).toFixed(4)})`;
          return;
        }

        if (variant === 'weave') {
          const rowDirection = index < 3 ? -1 : 1;
          const scale = 0.86 + impactProgress * 0.14;
          element.style.transform = `translate3d(${(direction * impactRemaining * 280).toFixed(
            2
          )}px, ${(rowDirection * impactRemaining * 92).toFixed(2)}px, 0) rotate(${(
            direction *
            impactRemaining *
            5
          ).toFixed(2)}deg) scale(${scale.toFixed(4)})`;
          return;
        }

        if (variant === 'burst') {
          const columnDirection = index % 2 === 0 ? -1 : 1;
          const rowDirection = index < 2 ? -1 : 1;
          const scale = 0.62 + impactProgress * 0.38;
          element.style.transformOrigin = '50% 50%';
          element.style.transform = `translate3d(${(
            columnDirection *
            impactRemaining *
            210
          ).toFixed(2)}px, ${(rowDirection * impactRemaining * 145).toFixed(
            2
          )}px, 0) rotate(${(
            columnDirection *
            impactRemaining *
            7.5
          ).toFixed(2)}deg) scale(${scale.toFixed(4)})`;
          return;
        }

        if (variant === 'split') {
          const columnDirection = index === 0 ? -1 : 1;
          const scale = 0.84 + impactProgress * 0.16;
          element.style.transform = `translate3d(${(
            columnDirection *
            impactRemaining *
            370
          ).toFixed(2)}px, ${(fastRemaining * 56).toFixed(
            2
          )}px, 0) rotateY(${(columnDirection * fastRemaining * -6.5).toFixed(
            2
          )}deg) scale(${scale.toFixed(4)})`;
          return;
        }

        const scale = 0.88 + impactProgress * 0.12;
        element.style.transform = `translate3d(0, ${(fastRemaining * 86).toFixed(
          2
        )}px, 0) scale(${scale.toFixed(4)})`;
        return;
      }

      if (variant === 'fan') {
        element.style.clipPath = `polygon(0 0, ${(fastProgress * 100).toFixed(
          2
        )}% 0, ${(fastProgress * 100).toFixed(2)}% 100%, 0 100%)`;
        element.style.transform = `translate3d(${(-fastRemaining * 160).toFixed(
          2
        )}px, ${(fastRemaining * 24).toFixed(2)}px, 0) skewX(${(
          -fastRemaining * 7
        ).toFixed(2)}deg)`;
        return;
      }

      if (variant === 'steps') {
        element.style.clipPath = `inset(0 ${(fastRemaining * 100).toFixed(
          2
        )}% 0 0 round ${(fastRemaining * 14).toFixed(2)}px)`;
        element.style.transform = `translate3d(${(-fastRemaining * 108).toFixed(
          2
        )}px, ${(fastRemaining * 16).toFixed(2)}px, 0) skewX(${(
          -fastRemaining * 5
        ).toFixed(2)}deg)`;
        return;
      }

      if (variant === 'burst') {
        const scale = 0.82 + impactProgress * 0.18;
        element.style.transform = `translate3d(0, ${(fastRemaining * 150).toFixed(
          2
        )}px, 0) rotateX(${(fastRemaining * 5).toFixed(2)}deg) scale(${scale.toFixed(4)})`;
        return;
      }

      if (variant === 'tilt') {
        element.style.transform = `translate3d(0, ${(fastRemaining * 150).toFixed(
          2
        )}px, 0) rotateX(${(fastRemaining * 9).toFixed(2)}deg)`;
        return;
      }

      if (variant === 'weave') {
        element.style.transform = `translate3d(${(fastRemaining * -105).toFixed(
          2
        )}px, ${(fastRemaining * 98).toFixed(
          2
        )}px, 0) rotate(${(fastRemaining * -1.5).toFixed(2)}deg)`;
        return;
      }

      element.style.transform = `translate3d(0, ${(fastRemaining * 92).toFixed(2)}px, 0)`;
    };

    const update = () => {
      frame = null;
      const viewportHeight = root.clientHeight;
      const rootTop = root.getBoundingClientRect().top;
      const startLine = viewportHeight * MOTION_START_VIEWPORTS;
      const endLine = viewportHeight * MOTION_END_VIEWPORTS;
      const motionDistance = Math.max(1, startLine - endLine);

      sections.forEach(section => {
        const { element, items } = section;
        const sectionTop = element.getBoundingClientRect().top - rootTop;
        const sectionProgress = clamp((startLine - sectionTop) / motionDistance);

        const quantizedProgress = Math.round(sectionProgress * 1000) / 1000;
        if (section.lastProgress === quantizedProgress) return;

        section.lastProgress = quantizedProgress;
        items.forEach(item => renderItem(item, quantizedProgress));
      });
    };

    const requestUpdate = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(update);
    };

    const onResize = () => {
      requestUpdate();
    };

    root.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', onResize);
    requestUpdate();

    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      root.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return null;
}
