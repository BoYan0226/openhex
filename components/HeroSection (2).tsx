import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { AuthAwareCtaButton } from './AuthAwareCtaButton';
import { BookDemoButton } from './BookDemoButton';
import { HONEYCOMB_LIGHT_STYLE } from '@/components/ui/textures';

/**
 * Hero section for the Live Agent landing redesign.
 *
 * Two-column layout on desktop (text left, chat-card mockup right),
 * stacked on mobile. A faint honeycomb texture sits on the cream
 * background. The chat card reconstructs the product surface: a bee
 * mascot peeking out the top-left, a LIVE badge, the 林 agent avatar +
 * name, a client question, the agent's reply, and an inner
 * project-progress card. Two floating toast chips overlap the card.
 */
export function HeroSection() {
  const t = useTranslations('landing.hero');

  return (
    <section className="relative flex min-h-screen snap-start flex-col justify-center overflow-hidden bg-paper pb-16 pt-24 md:pb-20 md:pt-28">
      {/* Faint honeycomb texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={HONEYCOMB_LIGHT_STYLE}
      />

      <div className="relative mx-auto flex w-full max-w-[1240px] flex-col items-center gap-14 px-6 2xl:max-w-[1440px] md:flex-row md:items-center md:gap-14">
        {/* Left column — copy */}
        <div className="flex w-full max-w-[560px] flex-col items-start 2xl:max-w-[680px]">
          <span className="inline-flex items-center gap-2 rounded-full border border-honey/30 bg-honey/10 px-4 py-1.5 text-[12px] font-semibold tracking-wider text-honey-deep">
            <span className="hex-clip h-2.5 w-2.5 bg-honey" />
            {t('eyebrow')}
          </span>

          <h1 className="mt-6 text-[26px] font-bold leading-[1.18] text-ink sm:text-[40px] sm:leading-[1.14] md:text-[50px] 2xl:text-[58px]">
            {t('titleLine1')}
            <br />
            {t('titleLine2')}
            <br />
            <span className="font-display text-[40px] font-bold text-honey sm:text-[56px] md:text-[68px] 2xl:text-[80px]">
              {t('liveWord')}
            </span>
          </h1>

          <p className="mt-6 max-w-[520px] text-[16px] leading-[1.7] text-ink/70 2xl:max-w-[600px] 2xl:text-[18px]">
            {t.rich('subtitle', {
              b: chunks => <b className="font-semibold text-ink">{chunks}</b>,
            })}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <AuthAwareCtaButton
              path="/login"
              className="inline-flex h-12 items-center justify-center rounded-full bg-honey px-6 text-[15px] font-semibold text-ink shadow-[0_4px_16px_rgba(241,212,34,.4)] transition-colors hover:bg-honey-soft"
            >
              {t('primaryCta')}
            </AuthAwareCtaButton>
            <BookDemoButton className="inline-flex h-12 items-center rounded-full border border-line bg-white px-6 text-[15px] font-medium text-ink hover:bg-black/[0.03]">
              {t('secondaryCta')}
            </BookDemoButton>
          </div>

          <p className="mt-6 flex items-center gap-2 text-[13px] text-ink/45">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            {t('caption')}
          </p>
        </div>

        {/* Right column — chat-card mockup (generously scaled to match design) */}
        <div className="relative w-full min-w-0 max-w-[540px] md:max-w-[620px] md:flex-1 2xl:max-w-[720px]">
          {/* Bee mascot peeking out the card's top-left corner */}
          <Image
            src="/landing/bee-hero.gif"
            width={120}
            height={120}
            unoptimized
            priority
            alt=""
            aria-hidden
            className="animate-float pointer-events-none absolute -top-14 left-1 z-20 h-[108px] w-[108px]"
          />
          {/* Floating toast chips overlapping the card corners */}
          <div className="absolute -top-4 right-2 z-20 inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-[11px] font-medium text-ink shadow-[0_8px_24px_rgba(34,28,19,.12)] md:right-4 md:px-3.5 md:py-2 md:text-[13px]">
            <span className="hex-clip h-2.5 w-2.5 bg-honey" />
            {t('card.toastProgress')}
          </div>
          <div className="absolute -bottom-3 -left-3 z-20 inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-2 text-[13px] font-medium text-ink shadow-[0_8px_24px_rgba(34,28,19,.12)]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {t('card.toastNew')}
          </div>

          <div className="relative z-10 rounded-[22px] border border-line bg-white p-5 pt-6 shadow-[0_28px_70px_rgba(34,28,19,.14)] md:p-7 md:pt-8">
            {/* LIVE badge, top-right */}
            <span className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-md bg-ink px-2 py-1 text-[10px] font-bold tracking-wider text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              LIVE
            </span>

            {/* Header: 林 hex avatar + name/meta */}
            <div className="flex items-center gap-3.5 pr-14">
              <div className="hex-clip flex h-11 w-11 shrink-0 items-center justify-center bg-honey font-display text-[18px] font-bold text-ink md:h-14 md:w-14 md:text-[22px]">
                林
              </div>
              <div className="min-w-0">
                <p className="text-[15px] font-bold leading-snug text-ink md:text-[17px]">
                  {t('card.name')}
                </p>
                <p className="mt-0.5 truncate text-[13px] text-ink/45">{t('card.meta')}</p>
              </div>
            </div>

            {/* Client question bubble */}
            <div className="ml-auto mt-6 max-w-[82%]">
              <p className="mb-1.5 text-right text-[12px] text-ink/40">{t('card.questionMeta')}</p>
              <div className="rounded-[18px] rounded-tr-[5px] bg-paper px-4 py-3 text-[13px] leading-[1.65] text-ink md:text-[14px]">
                {t('card.question')}
              </div>
            </div>

            {/* Agent answer bubble */}
            <div className="mt-5 max-w-[90%]">
              <p className="mb-1.5 text-[12px] font-semibold text-honey-deep">
                {t('card.answerName')}
              </p>
              <div className="rounded-[18px] rounded-tl-[5px] bg-honey/12 px-4 py-3.5 text-[14px] leading-[1.65] text-ink">
                {t('card.answer')}
              </div>
            </div>

            {/* Inner project / progress card */}
            <div className="mt-6 rounded-[18px] border border-line bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-ink">
                    {t('card.projectTitle')}
                  </p>
                  <p className="mt-1 truncate text-[12px] text-ink/45">{t('card.projectMeta')}</p>
                </div>
                <span className="shrink-0 text-[17px] font-bold text-honey-deep">
                  {t('card.progress')}
                </span>
              </div>
              <div className="mt-3.5 h-2.5 w-full overflow-hidden rounded-full bg-ink/10">
                <div
                  className="h-full rounded-full bg-honey"
                  style={{ width: t('card.progress') }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
