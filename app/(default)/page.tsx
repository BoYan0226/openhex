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
import { ScrollPager } from '@/components/ScrollPager';
import { StackPageMask } from '@/components/StackPageMask';
import { StackSectionMotion } from '@/components/StackSectionMotion';
import { StackJumpNav } from '@/components/StackJumpNav';
import { DeferredWaveGridBackground } from '@/components/DeferredWaveGridBackground';
import { CustomerServiceDock } from '@/components/CustomerServiceDock';

type StickyPanelTone = 'light' | 'dark';

type StickyPanelProps = {
  children: ReactNode;
  layer: number;
  offsetRem: number;
  preSummary?: boolean;
  surface?: string;
  surfaceEnd?: string;
  surfaceStart?: string;
  targetId: string;
  tone?: StickyPanelTone;
  summary?: boolean;
};

const STICKY_BASE_OFFSET_REM = 0;
const STICKY_STEP_REM = 0;
const PAGE_SURFACE_LIGHT = '#fafafa';
const PAGE_SURFACE_SHADE = PAGE_SURFACE_LIGHT;

const stickyOffset = (index: number) => STICKY_BASE_OFFSET_REM + index * STICKY_STEP_REM;

const STACK_NAV_ITEMS = [
  { id: 'stack-home', label: '首页' },
  { id: 'stack-live-agent', label: 'Live Agent' },
  { id: 'stack-live-four', label: 'LIVE 四要素' },
  { id: 'stack-capabilities', label: '核心能力' },
  { id: 'stack-asset', label: '能力资产' },
  { id: 'stack-how-it-works', label: '如何创建' },
  { id: 'stack-connectors', label: '连接器' },
  { id: 'stack-infra', label: '技术底座' },
  { id: 'stack-which-side', label: '适合谁' },
  { id: 'stack-summary', label: 'OPS × A2A' },
] as const;

const STACK_NAV_ITEMS_CN = [
  { id: 'stack-home', label: '首页' },
  { id: 'stack-live-agent', label: 'Live Agent' },
  { id: 'stack-live-four', label: 'LIVE 四要素' },
  { id: 'stack-capabilities', label: '核心能力' },
  { id: 'stack-asset', label: '能力资产' },
  { id: 'stack-how-it-works', label: '如何创建' },
  { id: 'stack-connectors', label: '连接器' },
  { id: 'stack-infra', label: '技术底座' },
  { id: 'stack-which-side', label: '适合谁' },
  { id: 'stack-summary', label: 'OPS × A2A' },
] as const;

const stickyStyle = (
  layer: number,
  offsetRem: number,
  surfaceStart: string,
  surfaceEnd: string
) =>
  ({
    '--sticky-offset': `${offsetRem}rem`,
    '--sticky-z': layer,
    '--stack-content-shift': `${(STICKY_BASE_OFFSET_REM - offsetRem) * 1.5}rem`,
    '--stack-surface-start': surfaceStart,
    '--stack-surface-end': surfaceEnd,
  }) as CSSProperties;

function StickyPanel({
  children,
  layer,
  offsetRem,
  preSummary = false,
  surface = PAGE_SURFACE_LIGHT,
  surfaceEnd = surface,
  surfaceStart = surface,
  targetId,
  tone = 'light',
  summary = false,
}: StickyPanelProps) {
  return (
    <>
      <div
        id={targetId}
        className="stack-anchor"
        style={stickyStyle(layer, offsetRem, surfaceStart, surfaceEnd)}
      />
      <div
        className={`sticky-panel sticky-panel--${tone}${
          preSummary ? ' sticky-panel--pre-summary' : ''
        }${
          summary ? ' sticky-panel--summary' : ''
        }`}
        data-scroll-fade-section
        style={stickyStyle(layer, offsetRem, surfaceStart, surfaceEnd)}
      >
        {children}
      </div>
    </>
  );
}

export default function HomePage() {
  return (
    <main
      data-landing-scroll-root
      className="relative isolate h-screen overflow-x-hidden overflow-y-scroll bg-transparent text-ink"
    >
      <DeferredWaveGridBackground />
      <LandingNav />
      <ScrollPathTransition />
      <CustomerServiceDock />
      <ScrollPager />
      <StackPageMask />
      <StackSectionMotion />
      <StackJumpNav items={STACK_NAV_ITEMS_CN} />
      <div id="stack-home" className="stack-anchor" />
      <div data-scroll-fade-section>
        <FinalCtaSection />
      </div>
      <div className="sticky-flow">
        <StickyPanel
          layer={1}
          offsetRem={stickyOffset(0)}
          targetId="stack-live-agent"
        >
          <HeroSection />
        </StickyPanel>
        <StickyPanel
          layer={2}
          offsetRem={stickyOffset(1)}
          surface={PAGE_SURFACE_SHADE}
          targetId="stack-live-four"
        >
          <LiveFourSection />
        </StickyPanel>
        <StickyPanel
          layer={3}
          offsetRem={stickyOffset(2)}
          targetId="stack-capabilities"
        >
          <CapabilitiesSection />
        </StickyPanel>
        <StickyPanel
          layer={4}
          offsetRem={stickyOffset(3)}
          surface={PAGE_SURFACE_SHADE}
          targetId="stack-asset"
        >
          <AssetSection />
        </StickyPanel>
        <StickyPanel
          layer={5}
          offsetRem={stickyOffset(4)}
          targetId="stack-how-it-works"
        >
          <HowItWorksSection />
        </StickyPanel>
        <StickyPanel
          layer={6}
          offsetRem={stickyOffset(5)}
          surface={PAGE_SURFACE_SHADE}
          targetId="stack-connectors"
        >
          <ConnectorsSection />
        </StickyPanel>
        <StickyPanel
          layer={7}
          offsetRem={stickyOffset(6)}
          targetId="stack-infra"
        >
          <InfraSection />
        </StickyPanel>
        <StickyPanel
          layer={8}
          offsetRem={stickyOffset(7)}
          preSummary
          surface={PAGE_SURFACE_SHADE}
          targetId="stack-which-side"
        >
          <WhichSideSection />
        </StickyPanel>
        <StickyPanel
          layer={9}
          offsetRem={STICKY_BASE_OFFSET_REM}
          summary
          targetId="stack-summary"
          tone="dark"
        >
          <div className="summary-screen">
            <SummarySection />
            <LandingFooter />
          </div>
        </StickyPanel>
      </div>
    </main>
  );
}
