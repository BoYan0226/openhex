import { useTranslations } from 'next-intl';
import { HONEYCOMB_STYLE } from '@/components/ui/textures';

/**
 * LIVE 四要素 — dark section. Left-aligned header (hexagon eyebrow → big
 * two-line title → subtitle), a faint honeycomb texture, and a 4-card row
 * where each card sits over a giant faint watermark letter (L / I / V / E)
 * at card height.
 */

type LiveItem = {
  letter: string;
  tagEn: string;
  tag: string;
  title: string;
  desc: string;
};

export function LiveFourSection() {
  const t = useTranslations('landing.liveFour');
  const items = t.raw('items') as LiveItem[];

  return (
    <section
      id="live-four"
      className="relative flex min-h-screen snap-start flex-col justify-center overflow-hidden bg-night bg-[linear-gradient(180deg,#1c150a,#181309)] py-20 text-white md:py-24"
    >
      {/* Honeycomb texture */}
      <div aria-hidden className="pointer-events-none absolute inset-0" style={HONEYCOMB_STYLE} />

      <div className="relative mx-auto w-full max-w-[1240px] 2xl:max-w-[1440px] px-6">
        {/* Header — left aligned */}
        <div className="max-w-[760px]">
          <span className="inline-flex items-center gap-2.5 text-[13px] font-semibold tracking-[2px] text-honey">
            <span className="hex-clip inline-block h-5 w-5 bg-honey" />
            {t('eyebrow')}
          </span>
          <h2 className="mt-5 text-[32px] font-bold leading-[1.25] text-white md:text-[46px] 2xl:text-[56px]">
            {t('titleLine1')}
            <br />
            {t('titleLine2')}
          </h2>
          <p className="mt-5 text-[15px] text-white/55">{t('subtitle')}</p>
        </div>

        {/* Cards, each over a giant faint watermark letter */}
        <div className="relative mt-14 2xl:mt-24">
          {/* Watermark letters — one per card column, at card height, behind */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 hidden gap-5 lg:grid lg:grid-cols-4"
          >
            {items.map(item => (
              <div key={item.letter} className="relative overflow-hidden">
                <span className="absolute right-[-12px] top-1/2 -translate-y-1/2 font-display text-[150px] font-bold leading-none text-white/[0.05] md:text-[190px]">
                  {item.letter}
                </span>
              </div>
            ))}
          </div>

          {/* Cards */}
          <div className="relative grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {items.map(item => (
              <div
                key={item.letter}
                className="flex flex-col rounded-[18px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-[2px] 2xl:min-h-[300px] 2xl:p-8"
              >
                <span className="font-display text-[44px] font-bold leading-none text-honey 2xl:text-[52px]">
                  {item.letter}
                </span>
                <p className="mt-3 text-[11px] uppercase tracking-[1.5px] text-honey/55 2xl:mt-5 2xl:text-[12px]">
                  {item.tagEn} · {item.tag}
                </p>
                <h3 className="mt-4 text-[18px] font-semibold text-white 2xl:mt-6 2xl:text-[22px]">
                  {item.title}
                </h3>
                <p className="mt-3 text-[13px] leading-relaxed text-white/55 2xl:mt-4 2xl:text-[15px]">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
