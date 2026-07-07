import type { CSSProperties, ReactNode } from 'react';
import { LandingNav } from '@/components/LandingNav';
import { HeroSection } from '@/components/HeroSection';
import { LiveFourSection } from '@/components/sections/LiveFourSection';
import { CapabilitiesSection } from '@/components/sections/CapabilitiesSection';
import { AssetSection } from '@/components/sections/AssetSection';
import { HowItWorksSection } from '@/components/sections/HowItWorksSection';
import { ConnectorsSection } from '@/components/sections/ConnectorsSection';
import { InfraSection } from '@/components/sections/InfraSection';
import { WhichSideSection } from '@/components/sections/WhichSideSection';
import { SummarySection } from '@/components/sections/SummarySection';
import { FinalCtaSection } from '@/components/sections/FinalCtaSection';
import { LandingFooter } from '@/components/LandingFooter';
import { ScrollPathTransition } from '@/components/ScrollPathTransition';

type StickyPanelTone = 'light' | 'dark';

const STICKY_BASE_OFFSET_REM = 4;
const STICKY_STEP_REM = 3;

const stickyOffset = (index: number) => STICKY_BASE_OFFSET_REM + index * STICKY_STEP_REM;

const stickyStyle = (
  layer: number,
  offsetRem: number,
  surfaceStart: string,
  surfaceEnd: string
) =>
  ({
    '--sticky-offset': `${offsetRem}rem`,
    '--sticky-z': layer,
    '--stack-surface-start': surfaceStart,
    '--stack-surface-end': surfaceEnd,
  }) as CSSProperties;

function StickyPanel({
  children,
  label,
  layer,
  offsetRem,
  surfaceEnd = '#a1a1a1',
  surfaceStart = '#ffffff',
  tone = 'light',
}: {
  children: ReactNode;
  label: string;
  layer: number;
  offsetRem: number;
  surfaceEnd?: string;
  surfaceStart?: string;
  tone?: StickyPanelTone;
}) {
  return (
    <div
      className={`sticky-panel sticky-panel--${tone}`}
      style={stickyStyle(layer, offsetRem, surfaceStart, surfaceEnd)}
    >
      <div className="sticky-panel-label" aria-hidden>
        {label}
      </div>
      {children}
    </div>
  );
}

export default function HomePage() {
  return (
    <main
      data-landing-scroll-root
      className="h-screen overflow-x-hidden overflow-y-scroll bg-paper text-ink"
    >
      <LandingNav />
      <ScrollPathTransition />
      <FinalCtaSection />
      <div className="sticky-flow">
        <StickyPanel
          label="Live Agent"
          layer={1}
          offsetRem={stickyOffset(0)}
          surfaceEnd="#f1f1f1"
        >
          <HeroSection />
        </StickyPanel>
        <StickyPanel label="LIVE 四要素" layer={2} offsetRem={stickyOffset(1)} tone="dark">
          <LiveFourSection />
        </StickyPanel>
        <StickyPanel
          label="核心能力"
          layer={3}
          offsetRem={stickyOffset(2)}
          surfaceEnd="#dfdfdf"
          surfaceStart="#fafafa"
        >
          <CapabilitiesSection />
        </StickyPanel>
        <StickyPanel
          label="能力资产"
          layer={4}
          offsetRem={stickyOffset(3)}
          surfaceEnd="#d4d4d4"
          surfaceStart="#f5f5f5"
        >
          <AssetSection />
        </StickyPanel>
        <StickyPanel
          label="如何创建"
          layer={5}
          offsetRem={stickyOffset(4)}
          surfaceEnd="#c9c9c9"
          surfaceStart="#eeeeee"
        >
          <HowItWorksSection />
        </StickyPanel>
        <StickyPanel
          label="连接器"
          layer={6}
          offsetRem={stickyOffset(5)}
          surfaceEnd="#bebebe"
          surfaceStart="#e7e7e7"
        >
          <ConnectorsSection />
        </StickyPanel>
        <StickyPanel label="技术底座" layer={7} offsetRem={stickyOffset(6)} tone="dark">
          <InfraSection />
        </StickyPanel>
        <StickyPanel
          label="适合谁"
          layer={8}
          offsetRem={stickyOffset(7)}
          surfaceEnd="#a1a1a1"
          surfaceStart="#dedede"
        >
          <WhichSideSection />
        </StickyPanel>
        <StickyPanel label="总结" layer={9} offsetRem={stickyOffset(8)} tone="dark">
          <SummarySection />
        </StickyPanel>
      </div>
      <LandingFooter />
    </main>
  );
}
