import { useTranslations } from 'next-intl';
import { Network, Cpu, Hand, Plug } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * 为 Live Agent 量身打造的基础设施 — dark section.
 *
 * Centered header (honey eyebrow pill → two-tone H2 → muted subtitle)
 * followed by a 2×2 grid of 4 cards, each with a honey-tinted icon
 * tile, a title and a muted description. Icons are mapped by index.
 */
const ICONS: LucideIcon[] = [Network, Cpu, Hand, Plug];

export function InfraSection() {
  const t = useTranslations('landing.infra');
  const items = t.raw('items') as Array<{ title: string; desc: string }>;

  return (
    <section
      data-stack-motion
      data-motion-style="burst"
      className="relative flex min-h-screen snap-start flex-col justify-center overflow-hidden py-20 text-ink md:py-24"
    >
      <div className="relative z-10 mx-auto max-w-[1240px] 2xl:max-w-[1440px] px-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center" data-motion="header">
          <span className="inline-flex items-center gap-2 rounded-full border border-honey/30 bg-honey/10 px-4 py-1.5 text-[12px] font-semibold tracking-wider text-honey-deep">
            <span className="hex-clip h-2.5 w-2.5 bg-honey" />
            {t('eyebrow')}
          </span>
          <h2 className="mt-5 text-[30px] font-semibold text-ink md:text-[44px] 2xl:text-[54px]">
            {t('titleLine1')} <span className="text-honey">{t('titleHighlight')}</span>
          </h2>
          <p className="mt-4 max-w-[680px] text-ink/55 2xl:text-[17px]">{t('subtitle')}</p>
        </div>

        {/* 2×2 card grid */}
        <div
          className="mx-auto mt-12 grid max-w-[920px] grid-cols-1 gap-5 md:grid-cols-2 2xl:mt-20 2xl:max-w-[1040px] 2xl:gap-6"
          data-motion="group"
        >
          {items.map((item, i) => {
            const Icon = ICONS[i];
            return (
              <article
                key={item.title}
                className="flex gap-4 rounded-[18px] border border-line bg-card p-7 shadow-[0_2px_20px_rgba(34,28,19,.04)] 2xl:gap-5 2xl:p-9"
              >
                <div className="hex-clip flex size-12 shrink-0 items-center justify-center bg-honey/15 text-honey-deep 2xl:size-14">
                  <Icon className="size-5 2xl:size-6" />
                </div>
                <div>
                  <h3 className="text-[17px] font-semibold text-ink 2xl:text-[20px]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-ink/60 2xl:mt-3 2xl:text-[15px]">
                    {item.desc}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
