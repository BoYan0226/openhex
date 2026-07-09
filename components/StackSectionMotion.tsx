'use client';

import { useEffect } from 'react';

export function StackSectionMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-landing-scroll-root]');
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>('[data-stack-motion]')
    ).map(section => ({
      anchor: section.closest('.sticky-panel')?.previousElementSibling as HTMLElement | null,
      section,
    }));
    if (!root || sections.length === 0) return undefined;

    let frame: number | null = null;

    const update = () => {
      frame = null;
      const triggerDistance = Math.max(84, root.clientHeight * 0.12);

      sections.forEach(({ anchor, section }) => {
        if (!anchor || section.dataset.motionVisible === 'true') return;

        if (Math.abs(root.scrollTop - anchor.offsetTop) <= triggerDistance) {
          section.dataset.motionVisible = 'true';
        }
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
