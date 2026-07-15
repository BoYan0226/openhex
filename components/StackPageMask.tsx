'use client';

import { useEffect } from 'react';

const MOBILE_BREAKPOINT_PX = 767;
const HANDLE_LONG_WIDTH_VW = 72;
const HANDLE_REST_WIDTH_VW = 22;

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const easeOutCubic = (value: number) => 1 - (1 - value) ** 3;

function getStaticTop(element: HTMLElement, root: HTMLElement) {
  let top = 0;
  let current: HTMLElement | null = element;

  while (current && current !== root) {
    top += current.offsetTop;
    current = current.offsetParent as HTMLElement | null;
  }

  return top;
}

export function StackPageMask() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-landing-scroll-root]');
    const panels = Array.from(document.querySelectorAll<HTMLElement>('.sticky-panel'));
    if (!root || panels.length === 0) return undefined;

    let frame: number | null = null;
    let panelTops: number[] = [];
    let previousScrollTop = root.scrollTop;
    const handleTimers = new Map<HTMLElement, number>();

    const clearHandleTimer = (panel: HTMLElement) => {
      const timer = handleTimers.get(panel);
      if (timer === undefined) return;

      window.clearTimeout(timer);
      handleTimers.delete(panel);
    };

    const clearMasks = () => {
      panels.forEach(panel => {
        clearHandleTimer(panel);
        panel.style.clipPath = '';
        panel.style.pointerEvents = '';
        panel.style.removeProperty('--stack-handle-width');
        delete panel.dataset.handleHidden;
      });
    };

    const refresh = () => {
      panelTops = panels.map(panel => getStaticTop(panel, root));
    };

    const render = () => {
      frame = null;

      if (window.innerWidth <= MOBILE_BREAKPOINT_PX) {
        clearMasks();
        return;
      }

      const scrollTop = root.scrollTop;
      const viewportHeight = root.clientHeight;
      const isScrollingUp = scrollTop < previousScrollTop - 0.5;
      let activeIndex = -1;
      previousScrollTop = scrollTop;

      panelTops.forEach((top, index) => {
        if (top <= scrollTop + 1) activeIndex = index;
      });

      panels.forEach((panel, index) => {
        if (
          panel.classList.contains('sticky-panel--light') ||
          panel.classList.contains('sticky-panel--summary')
        ) {
          const anchorTop = panelTops[index];
          const nextTop = panelTops[index + 1];
          const panelTop = Math.max(0, anchorTop - scrollTop);
          const isReverseEntering =
            isScrollingUp &&
            nextTop !== undefined &&
            scrollTop > anchorTop + 1 &&
            scrollTop <= nextTop + 1;
          const reverseSpan =
            nextTop === undefined ? viewportHeight : Math.min(viewportHeight, nextTop - anchorTop);
          const arrivalProgress = isReverseEntering
            ? clamp((nextTop - scrollTop) / Math.max(1, reverseSpan))
            : clamp(1 - panelTop / Math.max(1, viewportHeight));
          const easedProgress = easeOutCubic(arrivalProgress);
          const width =
            HANDLE_LONG_WIDTH_VW -
            (HANDLE_LONG_WIDTH_VW - HANDLE_REST_WIDTH_VW) * easedProgress;
          const isAtTop = panelTop <= 1;

          panel.style.setProperty('--stack-handle-width', `${width.toFixed(2)}vw`);

          if (isAtTop && isReverseEntering) {
            clearHandleTimer(panel);
            panel.dataset.handleHidden = 'true';
          } else if (!isAtTop) {
            clearHandleTimer(panel);
            panel.dataset.handleHidden = 'false';
          } else if (
            panel.dataset.handleHidden !== 'true' &&
            !handleTimers.has(panel)
          ) {
            const timer = window.setTimeout(() => {
              handleTimers.delete(panel);
              panel.dataset.handleHidden = 'true';
            }, 120);
            handleTimers.set(panel, timer);
          }
        }

        if (index < activeIndex) {
          panel.style.clipPath = 'inset(0 0 100% 0)';
          panel.style.pointerEvents = 'none';
          return;
        }

        if (index === activeIndex) {
          const nextTop = panelTops[index + 1];
          const visibleHeight = Number.isFinite(nextTop)
            ? Math.min(viewportHeight, Math.max(0, nextTop - scrollTop))
            : viewportHeight;
          const clippedBottom = Math.max(0, viewportHeight - visibleHeight);

          panel.style.clipPath =
            clippedBottom > 0.5 ? `inset(0 0 ${clippedBottom.toFixed(2)}px 0)` : '';
          panel.style.pointerEvents = '';
          return;
        }

        panel.style.clipPath = '';
        panel.style.pointerEvents = '';
      });
    };

    const requestRender = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(render);
    };

    const onResize = () => {
      refresh();
      requestRender();
    };

    refresh();
    root.addEventListener('scroll', requestRender, { passive: true });
    window.addEventListener('resize', onResize);
    requestRender();

    void document.fonts?.ready.then(onResize);

    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      handleTimers.forEach(timer => window.clearTimeout(timer));
      handleTimers.clear();
      root.removeEventListener('scroll', requestRender);
      window.removeEventListener('resize', onResize);
      clearMasks();
    };
  }, []);

  return null;
}
