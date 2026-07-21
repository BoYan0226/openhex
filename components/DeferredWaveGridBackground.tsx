'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const BACKGROUND_BOOT_DELAY_MS = 650;

const WaveGridBackground = dynamic(
  () => import('./WaveGridBackground').then(module => module.WaveGridBackground),
  { ssr: false }
);

export function DeferredWaveGridBackground() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let bootTimer = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      bootTimer = window.setTimeout(() => setReady(true), BACKGROUND_BOOT_DELAY_MS);
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (bootTimer) window.clearTimeout(bootTimer);
    };
  }, []);

  return (
    <>
      <div aria-hidden className="wave-grid-background wave-grid-background-placeholder" />
      {ready ? <WaveGridBackground /> : null}
    </>
  );
}
