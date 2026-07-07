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

const stickyStyle = (index: number) =>
  ({
    '--sticky-offset': `${index * 2}rem`,
    '--sticky-z': index + 1,
  }) as CSSProperties;

function StickyPanel({ children, index }: { children: ReactNode; index: number }) {
  return (
    <div className="sticky-panel snap-start" style={stickyStyle(index)}>
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
        <StickyPanel index={0}>
          <HeroSection />
        </StickyPanel>
        <StickyPanel index={1}>
          <LiveFourSection />
        </StickyPanel>
        <StickyPanel index={2}>
          <CapabilitiesSection />
        </StickyPanel>
        <StickyPanel index={3}>
          <AssetSection />
        </StickyPanel>
        <StickyPanel index={4}>
          <HowItWorksSection />
        </StickyPanel>
        <StickyPanel index={5}>
          <ConnectorsSection />
        </StickyPanel>
        <StickyPanel index={6}>
          <InfraSection />
        </StickyPanel>
        <StickyPanel index={7}>
          <WhichSideSection />
        </StickyPanel>
        <StickyPanel index={8}>
          <SummarySection />
        </StickyPanel>
      </div>
      <LandingFooter />
    </main>
  );
}
