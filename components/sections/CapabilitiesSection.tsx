import { useTranslations } from 'next-intl';
import { UserRound, Share2, Send } from 'lucide-react';

/**
 * 三件普通 AI 做不到的事 — cream section, 3 numbered cards each with a
 * hexagon icon badge, big faint number, title, honey tag, and desc.
 */
const ICONS = [UserRound, Share2, Send] as const;

type CapabilityItem = {
  num: string;
  title: string;
  tag: string;
  desc: string;
};

export function CapabilitiesSection() {
  const t = useTranslations('landing.threeThings');
  const items = t.raw('items') as CapabilityItem[];

  return (
    <section
      id="capabilities"
      data-stack-motion
      data-short-screen-fit
      data-motion-style="tilt"
      className="relative flex min-h-screen snap-start flex-col justify-center overflow-hidden bg-[#fbf7ee] py-20 md:py-24"
    >
      <div className="relative z-10 mx-auto max-w-[1240px] 2xl:max-w-[1440px] px-6">
        {/* Header */}
        <div className="mb-12 text-center md:mb-16 2xl:mb-20" data-motion="header">
          <span className="section-kicker">
            <span className="section-kicker-dot" />
            {t('eyebrow')}
          </span>
          <h2 className="mt-4 text-[26px] font-semibold leading-[1.18] text-ink sm:text-[40px] sm:leading-[1.14] md:text-[50px] 2xl:text-[58px]">
            {t('title')}
          </h2>
          <p className="mx-auto mt-4 max-w-[680px] text-[15px] text-ink/55 2xl:text-[17px]">
            {t('subtitle')}
          </p>
        </div>

        {/* Cards */}
        <div
          className="grid grid-cols-1 gap-6 md:grid-cols-3 2xl:gap-8"
          data-motion="group"
        >
          {items.map((item, i) => {
            const Icon = ICONS[i] ?? UserRound;
            return (
              <article
                key={item.num}
                className="glass-surface flex flex-col rounded-[20px] border border-line bg-card p-8 shadow-[0_2px_20px_rgba(34,28,19,.04)] md:p-9 2xl:min-h-[380px] 2xl:p-12"
              >
                <span className="font-display text-[15px] font-bold text-honey-deep">
                  {item.num}
                </span>
                <div className="hex-clip mt-4 flex h-14 w-14 items-center justify-center bg-honey/15 2xl:mt-6 2xl:h-16 2xl:w-16">
                  <Icon className="h-6 w-6 text-honey-deep 2xl:h-7 2xl:w-7" strokeWidth={2} />
                </div>
                <h3 className="mt-6 text-[20px] font-semibold text-ink 2xl:mt-8 2xl:text-[24px]">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-[14px] font-semibold text-honey-deep 2xl:mt-2 2xl:text-[15px]">
                  {item.tag}
                </p>
                <p className="mt-3 text-[14px] leading-relaxed text-ink/60 2xl:mt-4 2xl:text-[16px]">
                  {item.desc}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
