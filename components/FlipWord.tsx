'use client';

import { useEffect, useState } from 'react';

/**
 * Split-flap flip-word for the final CTA. The honey box is split at a
 * center seam; on each tick the current word's TOP half folds down and
 * the next word's BOTTOM half folds up — an airport-board / calendar
 * flip from the middle. Cycles 获客 / 挣钱 / 社交 / 干活 / 服务.
 */
export function FlipWord({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (words.length < 2) return;
    const id = setInterval(() => setFlipping(true), 2400);
    return () => clearInterval(id);
  }, [words.length]);

  const cur = words[index];
  const next = words[(index + 1) % words.length];

  // The fold-up flap finishes last → commit the new word then.
  const commit = () => {
    setIndex(prev => (prev + 1) % words.length);
    setFlipping(false);
  };

  return (
    <span className="flap ml-2 text-ink">
      {/* invisible sizer fixes the box to the current word's size */}
      <span className="flap-sizer">{cur}</span>

      {/* static halves: top shows the NEXT word (revealed as the old top
          folds away); bottom shows the CURRENT word until the new bottom
          folds in */}
      <span className="flap-half top">
        <span className="flap-glyph">{flipping ? next : cur}</span>
      </span>
      <span className="flap-half bottom">
        <span className="flap-glyph">{cur}</span>
      </span>

      {/* animating flaps */}
      {flipping && (
        <>
          <span className="flap-half top flap-fold-down">
            <span className="flap-glyph">{cur}</span>
          </span>
          <span className="flap-half bottom flap-fold-up" onAnimationEnd={commit}>
            <span className="flap-glyph">{next}</span>
          </span>
        </>
      )}

      <span aria-hidden className="flap-seam" />
    </span>
  );
}
