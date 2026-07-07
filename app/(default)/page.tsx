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

const stickyStyle = (layer: number, offsetRem: number) =>
  ({
    '--sticky-offset': `${offsetRem}rem`,
    '--sticky-z': layer,
  }) as CSSProperties;

function StickyPanel({
  children,
  layer,
  offsetRem,
}: {
  children: ReactNode;
  layer: number;
  offsetRem: number;
}) {
  return (
    <div className="sticky-panel snap-start" style={stickyStyle(layer, offsetRem)}>
      {children}
    </div>
  );
}

export default function HomePage() {
  return (
    <main
      data-landing-scroll-root
      className="h-screen snap-y snap-proximity overflow-x-hidden overflow-y-scroll scroll-smooth bg-paper text-ink"
    >
      <LandingNav />
      <ScrollPathTransition />
      <FinalCtaSection />
      <div className="sticky-flow">
        <StickyPanel layer={1} offsetRem={0}>
          <HeroSection />
        </StickyPanel>
        <StickyPanel layer={2} offsetRem={4}>
          <LiveFourSection />
        </StickyPanel>
        <StickyPanel layer={3} offsetRem={4}>
          <CapabilitiesSection />
        </StickyPanel>
        <StickyPanel layer={4} offsetRem={6}>
          <AssetSection />
        </StickyPanel>
        <StickyPanel layer={5} offsetRem={8}>
          <HowItWorksSection />
        </StickyPanel>
        <StickyPanel layer={6} offsetRem={10}>
          <ConnectorsSection />
        </StickyPanel>
        <StickyPanel layer={7} offsetRem={12}>
          <InfraSection />
        </StickyPanel>
        <StickyPanel layer={8} offsetRem={14}>
          <WhichSideSection />
        </StickyPanel>
        <StickyPanel layer={9} offsetRem={16}>
          <SummarySection />
        </StickyPanel>
      </div>
      <LandingFooter />
    </main>
  );
}
