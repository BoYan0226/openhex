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

/**
 * 2026 landing redesign — full-screen snap scroll: each module fills one
 * viewport (min-h-screen, content vertically centred) and snaps into
 * place. Alternating cream / dark sections match the standalone HTML
 * design source. The fixed LandingNav floats over every screen; sections
 * carry the anchor ids the nav links jump to (live-four, capabilities,
 * how-it-works, connectors, which-side). Footer shares the final screen.
 */
export default function HomePage() {
  return (
    <main className="h-screen snap-y snap-proximity overflow-x-hidden overflow-y-scroll scroll-smooth bg-paper text-ink">
      <LandingNav />
      {/* Dark flip-word CTA opens the page (per design — moved to first). */}
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
