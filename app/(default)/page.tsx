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

export default function HomePage() {
  return (
    <main
      data-landing-scroll-root
      className="h-screen snap-y snap-proximity overflow-x-hidden overflow-y-scroll scroll-smooth bg-paper text-ink"
    >
      <LandingNav />
      <ScrollPathTransition />
      <FinalCtaSection />
      <HeroSection />
      <LiveFourSection />
      <CapabilitiesSection />
      <AssetSection />
      <HowItWorksSection />
      <ConnectorsSection />
      <InfraSection />
      <WhichSideSection />
      <SummarySection />
      <LandingFooter />
    </main>
  );
}
