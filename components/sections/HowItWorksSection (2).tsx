import { useTranslations } from 'next-intl';
import { HONEYCOMB_LIGHT_STYLE } from '@/components/ui/textures';

/**
 * 三步，创建你的 Live Agent — cream section, 3 steps in a row, each with a
 * hexagon number badge, a title and a description, joined by a hairline.
 */
type Step = {
  num: string;
  title: string;
  desc: string;
};

export function HowItWorksSection() {
  const t = useTranslations('landing.howItWorks');
  const steps = t.raw('steps') as Step[];

  return (
    <section
      id="how-it-works"
      className="relative flex min-h-screen snap-start flex-col justify-center overflow-hidden bg-paper py-20 md:py-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={HONEYCOMB_LIGHT_STYLE}
      />
      <div className="relative z-10 mx-auto max-w-[1240px] 2xl:max-w-[1440px] px-6">
        {/* Header */}
        <div className="mb-12 text-center md:mb-16 2xl:mb-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-honey/30 bg-honey/10 px-4 py-1.5 text-[12px] font-semibold tracking-wider text-honey-deep">
            <span className="hex-clip h-2.5 w-2.5 bg-honey" />
            {t('eyebrow')}
          </span>
          <h2 className="mt-4 text-[30px] font-semibold text-ink md:text-[44px] 2xl:text-[54px]">
            {t('title')}
          </h2>
          <p className="mx-auto mt-4 max-w-[680px] text-[15px] text-ink/55 2xl:text-[17px]">
            {t('subtitle')}
          </p>
        </div>

        {/* Steps — three columns separated by vertical dividers (desktop). */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-0">
          {steps.map((step, i) => (
            <div
              key={step.num}
              className={`md:px-10 2xl:px-14 ${i === 0 ? 'md:pl-0' : ''} ${
                i === steps.length - 1 ? 'md:pr-0' : ''
              } ${i < steps.length - 1 ? 'md:border-r md:border-line' : ''}`}
            >
              <div className="hex-clip flex h-12 w-12 items-center justify-center bg-honey 2xl:h-16 2xl:w-16">
                <span className="font-display text-[18px] font-semibold text-ink 2xl:text-[24px]">
                  {step.num}
                </span>
              </div>
              <h3 className="mt-4 text-[18px] font-semibold text-ink 2xl:mt-7 2xl:text-[23px]">
                {step.title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-ink/60 2xl:mt-3 2xl:text-[16px]">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
