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

type StickyPanelProps = {
  children: ReactNode;
  label: string;
  layer: number;
  offsetRem: number;
  surfaceEnd?: string;
  surfaceStart?: string;
  targetId: string;
  tone?: StickyPanelTone;
};

const STICKY_BASE_OFFSET_REM = 4;
const STICKY_STEP_REM = 1.5;

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
  surfaceEnd = '#ffffff',
  surfaceStart = '#ffffff',
  targetId,
  tone = 'light',
}: StickyPanelProps) {
  return (
    <div
      id={targetId}
      className={`sticky-panel sticky-panel--${tone}`}
      style={stickyStyle(layer, offsetRem, surfaceStart, surfaceEnd)}
    >
      <a className="sticky-panel-label" href={`#${targetId}`}>
        {label}
      </a>
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
          targetId="stack-live-agent"
        >
          <HeroSection />
        </StickyPanel>
        <StickyPanel
          label="LIVE 四要素"
          layer={2}
          offsetRem={stickyOffset(1)}
          surfaceEnd="#f1f1f1"
          surfaceStart="#ffffff"
          targetId="stack-live-four"
        >
          <LiveFourSection />
        </StickyPanel>
        <StickyPanel
          label="核心能力"
          layer={3}
          offsetRem={stickyOffset(2)}
          surfaceEnd="#e8e8e8"
          surfaceStart="#f1f1f1"
          targetId="stack-capabilities"
        >
          <CapabilitiesSection />
        </StickyPanel>
        <StickyPanel
          label="能力资产"
          layer={4}
          offsetRem={stickyOffset(3)}
          surfaceEnd="#dfdfdf"
          surfaceStart="#e8e8e8"
          targetId="stack-asset"
        >
          <AssetSection />
        </StickyPanel>
        <StickyPanel
          label="如何创建"
          layer={5}
          offsetRem={stickyOffset(4)}
          surfaceEnd="#d6d6d6"
          surfaceStart="#dfdfdf"
          targetId="stack-how-it-works"
        >
          <HowItWorksSection />
        </StickyPanel>
        <StickyPanel
          label="连接器"
          layer={6}
          offsetRem={stickyOffset(5)}
          surfaceEnd="#cdcdcd"
          surfaceStart="#d6d6d6"
          targetId="stack-connectors"
        >
          <ConnectorsSection />
        </StickyPanel>
        <StickyPanel
          label="技术底座"
          layer={7}
          offsetRem={stickyOffset(6)}
          surfaceEnd="#c3c3c3"
          surfaceStart="#cdcdcd"
          targetId="stack-infra"
        >
          <InfraSection />
        </StickyPanel>
        <StickyPanel
          label="适合谁"
          layer={8}
          offsetRem={stickyOffset(7)}
          surfaceEnd="#bababa"
          surfaceStart="#c3c3c3"
          targetId="stack-which-side"
        >
          <WhichSideSection />
        </StickyPanel>
        <StickyPanel
          label="总结"
          layer={9}
          offsetRem={stickyOffset(8)}
          targetId="stack-summary"
          tone="dark"
        >
          <SummarySection />
        </StickyPanel>
      </div>
      <LandingFooter />
    </main>
  );
}
