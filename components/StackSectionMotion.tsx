'use client';

import { useEffect } from 'react';

export function StackSectionMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-landing-scroll-root]');
    const sections = document.querySelectorAll<HTMLElement>('[data-stack-motion]');
    if (!root || sections.length === 0) return undefined;
    const settleTimers: number[] = [];

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.18) {
            const section = entry.target as HTMLElement;
            section.dataset.motionVisible = 'true';
            settleTimers.push(
              window.setTimeout(() => {
                section.dataset.motionSettled = 'true';
              }, 1250)
            );
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root,
        rootMargin: '0px 0px -10% 0px',
        threshold: [0.18, 0.35],
      }
    );

    sections.forEach(section => observer.observe(section));
    return () => {
      observer.disconnect();
      settleTimers.forEach(timer => window.clearTimeout(timer));
    };
  }, []);

  return null;
}
