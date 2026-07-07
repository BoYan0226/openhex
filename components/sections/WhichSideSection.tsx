import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { AuthAwareCtaButton } from '@/components/AuthAwareCtaButton';
import { CONSUMER_CONTACTS_URL } from '@/components/landingLinks';

/**
 * 你想做哪一端? — centered header + two large cards (创造者 / 使用者). Each
 * card carries a role tag, a huge faint number (01/02), a title,
 * description, a CTA, and a bee illustration in the lower-right.
 */
export function WhichSideSection() {
  const t = useTranslations('landing.whichSide');

  return (
    <section
      id="which-side"
      className="relative flex min-h-screen snap-start flex-col justify-center overflow-hidden bg-[#fbf7ee] py-20 md:py-24"
    >
      <div className="relative z-10 mx-auto max-w-[1240px] 2xl:max-w-[1440px] px-6">
        {/* Centered header */}
        <div className="mb-12 flex flex-col items-center text-center 2xl:mb-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-honey/30 bg-honey/10 px-4 py-1.5 text-[12px] font-semibold tracking-wider text-honey-deep">
            <span className="hex-clip h-2.5 w-2.5 bg-honey" />
            {t('eyebrow')}
          </span>
          <h2 className="mt-5 text-[30px] font-semibold text-ink md:text-[44px] 2xl:text-[54px]">
            {t('title')}
          </h2>
          <p className="mx-auto mt-4 max-w-[680px] text-ink/55 2xl:text-[17px]">{t('subtitle')}</p>
        </div>

        {/* Two cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:gap-8">
          {/* Creator card */}
          <div className="relative flex min-h-[320px] flex-col overflow-hidden rounded-[20px] border border-line bg-[#fffdf7] p-8 shadow-[0_2px_24px_rgba(34,28,19,.05)] md:min-h-[380px] md:p-10 2xl:min-h-[460px] 2xl:p-12">
            <span
              aria-hidden
              className="pointer-events-none absolute right-6 top-4 font-display text-[88px] font-bold leading-none text-honey/15 md:text-[120px] 2xl:text-[150px]"
            >
              {t('creator.num')}
            </span>
            <div className="relative flex h-full flex-col">
              <span className="text-[12px] font-semibold tracking-wide text-honey-deep">
                {t('creator.tag')}
              </span>
              <h3 className="mt-3 text-[22px] font-semibold text-ink md:text-[26px] 2xl:text-[30px]">
                {t('creator.title')}
              </h3>
              <p className="mt-2 text-[13px] font-medium text-ink/45">{t('creator.audience')}</p>
              <p className="mt-4 max-w-[440px] text-[14px] leading-relaxed text-ink/60 2xl:text-[16px]">
                {t('creator.desc')}
              </p>
              <AuthAwareCtaButton
                path="/login"
                className="mt-auto inline-flex h-11 w-fit items-center rounded-full bg-honey px-5 pt-0 text-[14px] font-semibold text-ink hover:bg-honey-soft"
              >
                {t('creator.cta')}
              </AuthAwareCtaButton>
            </div>
            <Image
              src="/landing/bee-laptop.svg"
              width={150}
              height={150}
              alt=""
              className="pointer-events-none absolute -bottom-1 right-2 h-32 w-32 2xl:h-40 2xl:w-40"
            />
          </div>

          {/* User card */}
          <div className="relative flex min-h-[320px] flex-col overflow-hidden rounded-[20px] border border-line bg-[#fffdf7] p-8 shadow-[0_2px_24px_rgba(34,28,19,.05)] md:min-h-[380px] md:p-10 2xl:min-h-[460px] 2xl:p-12">
            <span
              aria-hidden
              className="pointer-events-none absolute right-6 top-4 font-display text-[88px] font-bold leading-none text-honey/15 md:text-[120px] 2xl:text-[150px]"
            >
              {t('user.num')}
            </span>
            <div className="relative flex h-full flex-col">
              <span className="text-[12px] font-semibold tracking-wide text-honey-deep">
                {t('user.tag')}
              </span>
              <h3 className="mt-3 text-[22px] font-semibold text-ink md:text-[26px] 2xl:text-[30px]">
                {t('user.title')}
              </h3>
              <p className="mt-2 text-[13px] font-medium text-ink/45">{t('user.audience')}</p>
              <p className="mt-4 max-w-[440px] text-[14px] leading-relaxed text-ink/60 2xl:text-[16px]">
                {t('user.desc')}
              </p>
              <a
                href={CONSUMER_CONTACTS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto inline-flex h-11 w-fit items-center rounded-full border border-line bg-white px-5 text-[14px] font-medium text-ink hover:bg-black/[0.03]"
              >
                {t('user.cta')}
              </a>
            </div>
            <Image
              src="/landing/bee-agent.svg"
              width={150}
              height={150}
              unoptimized
              alt=""
              className="pointer-events-none absolute -bottom-1 right-2 h-32 w-32 2xl:h-40 2xl:w-40 object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
